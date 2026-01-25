from pydantic import BaseModel


class FacetItem(BaseModel):
    value: str
    count: int


class FacetList(BaseModel):
    items: list[FacetItem]
