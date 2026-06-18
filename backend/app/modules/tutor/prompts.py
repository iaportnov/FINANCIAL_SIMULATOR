"""System-prompt construction for the AI tutor.

Builds the grounding context from the **public** projection of a trainer task
(instructions, sheet, editable cells) plus the learner's current cell state.
The secret grading rules (expected values, required functions) are never loaded
here, so the model physically cannot leak the authoritative answer.
"""

from app.modules.trainer.schemas import TrainerTaskPublic

# The tutor is a coach, not an answer key. The deterministic grader owns the
# truth; the tutor guides reasoning. See ADR-0009 and the product guardrail:
# "AI never computes the authoritative number or states the authoritative rule."
TUTOR_PERSONA = """\
Ты — ИИ-наставник по МСФО (IFRS) внутри тренажёра с электронной таблицей.
Учащийся решает практическую задачу в таблице, и ты помогаешь ему разобраться.

Твоя роль:
- объясняй релевантные стандарты, термины и логику расчёта простым языком;
- задавай наводящие вопросы и веди учащегося к решению по шагам;
- подсказывай метод и формулу расчёта (какие ячейки и как связать), опираясь на
  условие задачи и то, что учащийся уже ввёл;
- если в ячейках есть ошибка по структуре расчёта — мягко укажи, где искать.

Жёсткие правила:
- НЕ называй итоговое числовое значение ответа и не диктуй готовую формулу «под
  копирку» так, чтобы её осталось только вставить. Подводи к ней рассуждением.
- Проверку правильности делает тренажёр (кнопка «Проверить»), а не ты. Не выноси
  вердикт «верно/неверно» по числу — ты можешь обсуждать только метод и логику.
- Отвечай кратко и по делу, на русском языке. Без длинных вступлений.
- Если вопрос не относится к задаче или к МСФО — вежливо верни учащегося к задаче.\
"""


def _format_cells(cells: dict[str, dict]) -> str:
    lines: list[str] = []
    for ref in sorted(cells, key=_a1_sort_key):
        cell = cells.get(ref) or {}
        value = cell.get("value")
        formula = cell.get("formula")
        if value in (None, "") and not formula:
            continue
        parts = [f"{ref}:"]
        if formula:
            parts.append(f"формула «{formula}»")
        if value not in (None, ""):
            parts.append(f"значение {value}")
        lines.append("  " + " ".join(parts))
    return "\n".join(lines)


def _a1_sort_key(ref: str) -> tuple[int, int]:
    letters = "".join(c for c in ref if c.isalpha())
    digits = "".join(c for c in ref if c.isdigit())
    col = 0
    for ch in letters.upper():
        col = col * 26 + (ord(ch) - 64)
    return (int(digits) if digits else 0, col)


def build_system_prompt(
    task: TrainerTaskPublic,
    cells: dict[str, dict],
    solution_notes: str = "",
) -> str:
    sheet_cells = (task.sheet or {}).get("cells", {}) if isinstance(task.sheet, dict) else {}

    blocks = [
        TUTOR_PERSONA,
        f"# Задача: {task.title}",
        "## Условие\n" + (task.instructions_md or "—"),
    ]

    if solution_notes.strip():
        blocks.append(
            "## Методические заметки для наставника\n"
            + solution_notes.strip()
            + "\n\nИспользуй эти заметки как опору для объяснения метода. Не раскрывай их как "
            "готовое решение и не называй итоговые числовые ответы."
        )

    initial = _format_cells(sheet_cells)
    if initial:
        blocks.append("## Исходные данные таблицы\n" + initial)

    if task.editable:
        blocks.append("## Ячейки, которые заполняет учащийся\n" + ", ".join(task.editable))

    current = _format_cells(cells)
    blocks.append(
        "## Текущее состояние ответа учащегося\n" + (current or "Учащийся пока ничего не ввёл.")
    )

    return "\n\n".join(blocks)
