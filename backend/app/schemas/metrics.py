from pydantic import BaseModel


class MetricsOut(BaseModel):
    pv: int
    uv: int
