from pydantic import BaseModel

class JobCreate(BaseModel):
    title: str
    cron: str
    script_text: str
    enabled: bool = True

class JobOut(BaseModel):
    id: int
    title: str
    cron: str
    enabled: bool

    class Config:
        from_attributes = True
