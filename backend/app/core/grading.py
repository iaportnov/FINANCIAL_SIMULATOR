"""Shared grading helpers used by quizzes and the trainer."""


def coerce_number(value) -> float:
    if isinstance(value, bool):
        raise ValueError("booleans are not numeric answers")
    if isinstance(value, int | float):
        return float(value)

    text = str(value).strip()
    if not text:
        raise ValueError("empty numeric answer")

    text = (
        text.replace("\u00a0", "")
        .replace("\u202f", "")
        .replace(" ", "")
        .replace("_", "")
    )
    text = "".join(ch for ch in text if ch.isdigit() or ch in ",.-+eE")

    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(",", ".")

    return float(text)


def within_tolerance(value, expected, tolerance: dict | None = None) -> bool:
    """Compare a numeric answer against an expected value.

    tolerance: { "type": "relative" | "absolute", "value": float } or None.
    A missing tolerance means exact equality.
    """
    if value is None or expected is None:
        return False
    try:
        value = coerce_number(value)
        expected = coerce_number(expected)
    except (TypeError, ValueError):
        return False

    if not tolerance:
        return value == expected

    kind = tolerance.get("type", "absolute")
    margin = float(tolerance.get("value", 0))
    if kind == "relative":
        return abs(value - expected) <= abs(expected) * margin
    return abs(value - expected) <= margin
