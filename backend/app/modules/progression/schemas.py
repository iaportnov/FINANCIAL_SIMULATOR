from pydantic import BaseModel


class StepNode(BaseModel):
    id: int
    title: str
    activity_type: str
    activity_id: int
    status: str  # locked | unlocked | completed


class BlockNode(BaseModel):
    id: int
    title: str
    xp_reward: int
    steps: list[StepNode]


class CourseNode(BaseModel):
    id: int
    slug: str
    title: str
    blocks: list[BlockNode]


class MapResponse(BaseModel):
    level: int
    total_xp: int
    courses: list[CourseNode]


class ProgressSummary(BaseModel):
    level: int
    total_xp: int
