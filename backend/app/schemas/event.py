from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    title: str
    category: Optional[str] = None
    start_at: datetime
    end_at: datetime
    all_day: bool = False

class EventOut(BaseModel):
    id: int
    title: str
    start: datetime
    end: datetime
    category: Optional[str] = None
    allDay: bool = False

    class Config:
        from_attributes = True
