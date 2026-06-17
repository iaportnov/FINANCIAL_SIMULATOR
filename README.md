# Financial Simulator

Платформа для изучения финансов: профиль, мини-курсы с тестами, тренажёр Excel,
уровень и карта заданий. Модульный монолит (FastAPI) + React/TypeScript.

> Архитектура и решения: см. [`CONTEXT.md`](CONTEXT.md) и [`docs/adr/`](docs/adr/).

## Структура

```
backend/    FastAPI, модули в app/modules/{users,courses,quizzes,trainer,progression}
frontend/   React + Vite + TypeScript + Mantine, src/features/*
content/    авторский контент (lessons/*.md, quizzes/*.yaml, trainer/*.yaml, curriculum.yaml, levels.yaml)
docs/adr/   Architecture Decision Records
```

## Запуск через Docker Compose

```bash
# 1) поднять БД
docker compose up -d db

# 2) создать и применить первую миграцию (одноразово), затем залить контент
docker compose run --rm backend alembic revision --autogenerate -m "init"
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python -m app.seed

# 3) поднять всё
docker compose up
```

- Backend: http://localhost:8000 (OpenAPI: http://localhost:8000/docs)
- Frontend: http://localhost:5173

## Локальный запуск (без Docker)

Backend (нужен Postgres и [uv](https://docs.astral.sh/uv/)):

```bash
cd backend
cp .env.example .env            # при необходимости поправьте DATABASE_URL
uv sync
uv run alembic revision --autogenerate -m "init"
uv run alembic upgrade head
uv run python -m app.seed
uv run uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
# типы из OpenAPI (бэкенд должен быть запущен):
npm run generate:types
```

## Тесты

```bash
cd backend && uv run pytest         # юнит-тесты ядра (грейдинг) работают без БД
cd frontend && npm test
```

## Сквозной поток MVP

Регистрация → вход → карта заданий → курс «Основы личных финансов»
(2 блока: урок → тест → тренажёр) → закрытие блока даёт XP → рост уровня.
