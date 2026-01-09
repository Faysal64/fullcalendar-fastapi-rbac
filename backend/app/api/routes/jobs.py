from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.schemas.job import JobCreate, JobOut
from app.models.job import Job
from app.services.scheduler import sync_jobs_from_db

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.get("", response_model=list[JobOut])
def list_jobs(db: Session = Depends(get_db), _=Depends(require_permission("jobs:read"))):
    return db.query(Job).order_by(Job.id.desc()).all()

@router.post("", response_model=JobOut)
def create_job(data: JobCreate, db: Session = Depends(get_db), _=Depends(require_permission("jobs:create"))):
    job = Job(**data.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    sync_jobs_from_db()
    return job
