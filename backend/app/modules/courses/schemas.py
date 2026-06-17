from pydantic import BaseModel, ConfigDict


class CoursePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    description: str
    order_index: int


class LessonPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    title: str
    content_md: str
