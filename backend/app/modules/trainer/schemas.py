from pydantic import BaseModel


class TrainerTaskPublic(BaseModel):
    id: int
    slug: str
    title: str
    instructions_md: str
    sheet: dict
    editable: list[str]
    grading_rules: list[dict] | None = None
    # NOTE: grading rules are intentionally absent from the public projection.


class SubmitTrainerRequest(BaseModel):
    # Client-computed cell model: { "B5": { "value": 11122.22, "formula": "=PMT(...)" } }
    cells: dict[str, dict]


class CellResult(BaseModel):
    cell: str
    correct: bool


class TrainerResult(BaseModel):
    passed: bool
    results: list[CellResult]
