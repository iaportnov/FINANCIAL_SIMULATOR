# CONTEXT — Financial Simulator

Платформа для изучения финансов для начинающих и продолжающих: профиль, мини-курсы
с тестами, тренажёр Excel, уровень и карта заданий. За каждый пройденный блок
пользователь получает XP и повышает уровень.

Этот файл — канонический обзор архитектуры и ubiquitous language. Точечные решения
с обоснованием — в `docs/adr/`.

---

## 1. Цель и принципы

- **Цель первой итерации:** задать архитектуру под дальнейшую разработку + дать
  демонстрируемый MVP — **тонкий сквозной срез через все модули**.
- **Главный принцип:** каждая сущность (профиль, курсы, тесты, тренажёр, прогресс)
  написана **отдельно**, так чтобы над ней можно было работать независимо.
- **Стиль:** модульный монолит с вертикальными слайсами, мягкие границы между
  модулями (ссылки по ID, без межмодульных FK), целостность держим в коде.

## 2. Технологии

| Слой | Выбор |
|------|-------|
| Backend | Python, **FastAPI**, **async SQLAlchemy 2.0** + `asyncpg`, **Alembic** |
| БД | **PostgreSQL** (одна БД на весь монолит) |
| Конфиг | `pydantic-settings` (типизированные настройки из env) |
| Зависимости (py) | `uv` |
| Frontend | **React + TypeScript + Vite**, **Mantine**, **React Router**, **TanStack Query**, **Zustand** (сессия) |
| Типы контракта | генерация TS-типов из OpenAPI (`openapi-typescript`) |
| Тренажёр | **Fortune-sheet** (MIT) за собственным адаптером; `@formulajs/formulajs` как фолбэк функций |
| Запуск | Docker Compose (`db` + `backend` + `frontend`) |
| Тесты | `pytest` + `pytest-asyncio` + `httpx`; `Vitest` + RTL; CI в GitHub Actions |

## 3. Структура репозитория

```
/backend
  app/
    main.py                 сборка роутеров, middleware, обработчики ошибок
    core/                   config, db (async engine/session), security (JWT, хэш),
                            errors (иерархия + хендлеры), pagination
    modules/
      users/                идентичность + аутентификация
      courses/              статичная программа: Course → Block → Step + Lesson
      quizzes/              тесты: контент, грейдинг, попытки
      trainer/              тренажёр: задачи, грейдинг, сабмиты
      progression/          динамика пользователя: прохождения, XP, уровень, карта
    seed/                   идемпотентный загрузчик контента
  alembic/                  единая история миграций на всю БД
  tests/
/frontend
  src/
    app/                    роутинг, провайдеры, layout
    features/{profile,courses,quizzes,trainer,progression}
    shared/                 ui-kit-обёртки, api-client, auth, утилиты
/content                    авторский контент (источник для сидера)
  lessons/*.md              уроки (Markdown с YAML front-matter)
  quizzes/*.yaml            тесты
  trainer/*.yaml            задачи тренажёра
  curriculum.yaml           программа: курсы → блоки → шаги
  levels.yaml               пороги уровней (level → требуемый суммарный XP)
/docs
  adr/                      Architecture Decision Records
docker-compose.yml
```

Каждый модуль бэкенда — самодостаточный пакет:
`router.py · service.py · repository.py · models.py · schemas.py`.

## 4. Карта модулей и зависимости

Зависимости строго направленные (DAG), циклов нет:

```
quizzes ─┐
trainer ─┼─► progression ─► courses
         │        │
         └────────┴────────────────► users   (current_user во всех модулях)
```

- **users** — фундамент, ни от кого не зависит.
- **courses** — статичная программа, ни от кого не зависит (read-mostly, из сидера).
- **progression** — читает структуру из `courses`, принимает отчёты о завершении.
- **quizzes / trainer** — по завершении активности зовут `progression` «снизу вверх».
- Завершение **урока** (грейдинга нет) обрабатывает сам `progression` — поэтому
  `courses` не зависит от `progression`, и цикл не возникает.

Межмодульные вызовы — прямой импорт публичных функций из `service.py` соседа.
Внутреннюю шину событий не вводим на MVP, но направление зависимостей уже
событийно-совместимо (путь роста — заменить прямой вызов на событие).

## 5. Ответственность и модель данных по модулям

### users
Идентичность и аутентификация.
- `User(id, email⊥, password_hash, display_name, role[user|admin], created_at)`
- `RefreshToken(id, user_id, token_hash, expires_at, revoked)` — ротация refresh.
- Выдаёт зависимость `current_user` остальным модулям.

### courses (статичная программа обучения)
- `Course(id, slug⊥, title, description, order_index, gating='linear')`
- `Block(id, course_id, slug, title, order_index, xp_reward)`
- `Step(id, block_id, order_index, activity_type[lesson|quiz|trainer_task], activity_id, title)`
- `Lesson(id, slug⊥, title, content_md)` — контент уроков (Markdown).

`Step` ссылается на активность **полиморфно**: `activity_type + activity_id`.
`title` денормализован для отрисовки карты без обращения к контентным модулям.

### quizzes (тесты)
- `Quiz(id, slug⊥, title, pass_threshold=0.7)`
- `Question(id, quiz_id, order_index, type[single_choice|multiple_choice|numeric],
   prompt, options_json, correct_json⊕, tolerance, explanation)`
- `QuizAttempt(id, user_id, quiz_id, score, passed, answers_json, created_at)`

Грейдинг **на сервере**, правильные ответы (`correct_json`) клиенту не уходят.
Порог по умолчанию 70%, пересдачи без ограничений. На прохождении —
`progression.record_completion(user_id, 'quiz', quiz_id)`.

### trainer (тренажёр Excel)
- `TrainerTask(id, slug⊥, title, instructions_md, sheet_json, editable_json)`
- `TrainerGrading⊕(task_id, rules_json, xp)` — **секретная** часть, не сериализуется клиенту.
- `TrainerSubmission(id, user_id, task_id, cells_json, passed, per_cell_result_json, created_at)`

Движок таблицы (Fortune-sheet) спрятан за адаптером `<SpreadsheetTrainer>`. Задача
описана нейтральной YAML-схемой (см. §8). Грейдинг гибридный и серверный (см. §8).
На решении — `progression.record_completion(user_id, 'trainer_task', task_id)`.

### progression (динамика пользователя)
- `ActivityCompletion(id, user_id, activity_type, activity_id, completed_at)`
- `UserProgress(user_id⊥, total_xp, level)`
- `LevelThreshold(level⊥, required_xp)` — из `content/levels.yaml`.

Логика: получив отчёт о завершении активности, помечает соответствующий `Step`
завершённым, проверяет, закрыт ли `Block`; при закрытии начисляет `block.xp_reward`
и пересчитывает `level` по таблице порогов. Отдаёт **карту**: дерево
`courses → blocks → steps` со статусом каждого шага
(`locked | unlocked | completed`) + текущие XP/level.

`⊥` — уникальный; `⊕` — серверный секрет, клиенту не отдаётся.

## 6. Аутентификация (свой тонкий auth)

- **JWT**: короткоживущий **access-токен в памяти** фронта + **refresh-токен в
  httpOnly Secure SameSite cookie** (ротация).
- Пароли — `passlib`/bcrypt. Своя реализация в `users` (без `fastapi-users`).
- Регистрация: email + пароль, **без** email-верификации и OAuth (заложено на будущее).
- Поле `role` (`user|admin`) заведено сразу — под будущую админку.
- **Сброс пароля — вне MVP** (нет почты).

## 7. Сквозные соглашения API

- Префикс `/api/v1`; роутеры: `/auth`, `/me`, `/courses`, `/quizzes`, `/trainer`, `/progression`.
- **Единый конверт ошибок** через глобальный хендлер над доменными исключениями
  (`NotFoundError`, `ValidationError`, `PermissionError`, …):
  ```json
  { "error": { "code": "not_found", "message": "Course not found" } }
  ```
- **Пагинация:** `limit/offset`, конверт `{ "items": [...], "total": N, "limit": L, "offset": O }`.
- Валидация — Pydantic-схемы в `schemas.py` каждого модуля.

## 8. Тренажёр: схема задачи и грейдинг

Задача — нейтральный YAML с **публичной** и **секретной** частями. API отдаёт клиенту
только публичную проекцию; блок `grading` остаётся на сервере.

```yaml
slug: loan-monthly-payment
title: "Платёж по кредиту"
instructions: |            # Markdown
  Заполни B5: ежемесячный платёж по аннуитету…
sheet:                     # начальное состояние (A1-нотация)
  cells:
    B1: { value: 500000 }
    B2: { value: 12 }
    B5: { value: null }
editable: [B5]             # остальное заперто
hints: ["Месячная ставка = годовая / 12 / 100"]
# --- СЕКРЕТ (на клиент не уходит) ---
grading:
  rules:
    - cell: B5
      expected: 11122.22
      tolerance: { type: relative, value: 0.01 }   # ±1%
      must_be_formula: true          # опционально
      must_use_function: [PMT]       # опционально, толерантный парсинг
  xp: 20
```

**Грейдинг гибридный и серверный:** клиент считает таблицу локально (UX), на
«Проверить» шлёт модель ячеек (значения + текст формул); сервер сверяет с секретным
эталоном и правилами и возвращает только вердикт по ячейкам + балл. Пересчёта
Excel-формул в Python на MVP нет. Защита от читерства: эталон на клиент не попадает.

## 9. Прогресс, XP и уровни

- У каждого `Block` — `xp_reward`. Закрыл все шаги блока → блок закрыт → начислен XP.
- Уровень = максимальный `level`, чей `required_xp ≤ total_xp` (таблица `LevelThreshold`
  из `content/levels.yaml`). Баланс крутится данными, без правки кода.
- Карта строго **линейная** на MVP: следующий шаг открывается по завершению
  предыдущего, следующий блок — по закрытию предыдущего. На `Course` заложен флаг
  `gating` на будущее (свободный выбор тематик).

## 10. Контент-пайплайн

- БД — источник правды в рантайме; контент для MVP **авторится файлами** в `/content`
  и грузится **идемпотентным сидером** по стабильным `slug` (повторный запуск
  обновляет, не дублирует).
- Форматы: уроки — Markdown, тесты и задачи тренажёра — YAML, пороги уровней — YAML.
- Админка/CMS — вне MVP; модель спроектирована так, чтобы CRUD добавился позже.

## 11. Тестирование

- Backend: `pytest` + `pytest-asyncio`, API через `httpx.AsyncClient`, тестовая БД —
  **реальный Postgres** с откатом транзакции после каждого теста.
- Пирамида: **unit на сервисы** (грейдинг тестов, грейдинг тренажёра, прогресс/XP),
  **integration на API** (по эндпоинту на модуль), **1–2 сквозных потока**.
- **Прагматичный TDD**: test-first на ядро (грейдинг + прогресс), test-after на CRUD/плумбинг.
- Frontend: `Vitest` + RTL на ключевые узлы; Playwright — позже.
- CI: GitHub Actions на PR (линт + бэк-тесты + фронт-тесты).

## 12. Ubiquitous language (глоссарий)

- **Course (Курс)** — тематический контейнер обучения. Содержит блоки.
- **Block (Блок)** — атомарная единица прогресса; за закрытие начисляется XP. Содержит шаги.
- **Step (Шаг)** — один пункт блока; полиморфная ссылка на активность (`type + id`).
- **Activity (Активность)** — то, что проходит пользователь: `lesson | quiz | trainer_task`.
- **Lesson (Урок)** — обучающий контент в Markdown; завершается отметкой «пройдено».
- **Quiz (Тест)** — набор вопросов с серверным грейдингом и порогом сдачи.
- **Trainer Task (Задача тренажёра)** — задача в Excel-подобной таблице с серверным грейдингом.
- **Map (Карта заданий)** — визуализация обхода `courses → blocks → steps` со статусами.
- **Completion (Завершение)** — факт прохождения активности пользователем.
- **XP** — очки за закрытые блоки. **Level (Уровень)** — функция от суммарного XP по порогам.
- **Gating** — правило открытия следующего шага/блока/курса (на MVP — линейное).
- **Grading (Грейдинг)** — серверная проверка ответа против секретного эталона.

## 13. Объём MVP

**Входит:** скелет всех модулей с чистыми границами; адаптер тренажёра; сидер;
миграции; CI; рабочий сквозной поток (регистрация → профиль → карта → 1 курс с
1–2 блоками `урок → тест → задача` → закрытие блока → +XP → рост уровня); стартовый
демо-контент (курс «Основы личных финансов», 2 блока).

**Не входит:** админка/CMS, email-верификация, OAuth, сброс пароля, достижения/бейджи,
лидерборды, ветвление карты, диаграммы и эксклюзивные фичи в тренажёре, пересчёт
Excel-формул на сервере, мобильное приложение.

## 14. ADR

См. `docs/adr/` — решения с контекстом и последствиями:
0001 модульный монолит · 0002 стек и данные · 0003 модель прогресса ·
0004 контент-как-код · 0005 серверный грейдинг · 0006 движок тренажёра ·
0007 аутентификация · 0008 архитектура фронтенда.
