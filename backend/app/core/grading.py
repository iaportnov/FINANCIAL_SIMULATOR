"""Shared grading helpers used by quizzes and the trainer."""


def within_tolerance(value, expected, tolerance: dict | None = None) -> bool:
    """Compare a numeric answer against an expected value.

    tolerance: { "type": "relative" | "absolute", "value": float } or None.
    A missing tolerance means exact equality.
    """
    if value is None or expected is None:
        return False
    try:
        value = float(value)
        expected = float(expected)
    except (TypeError, ValueError):
        return False

    if not tolerance:
        return value == expected

    kind = tolerance.get("type", "absolute")
    margin = float(tolerance.get("value", 0))
    if kind == "relative":
        return abs(value - expected) <= abs(expected) * margin
    return abs(value - expected) <= margin
