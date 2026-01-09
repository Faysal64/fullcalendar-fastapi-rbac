from pydantic import BaseModel
from datetime import datetime

class RunOut(BaseModel):
    id: int
    job_id: int
    status: str
    logs: str
    started_at: datetime | None
    finished_at: datetime | None

    class Config:
        from_attributes = True
