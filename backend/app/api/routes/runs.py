from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.schemas.run import RunOut
from app.models.job import Run

router = APIRouter(prefix="/api/runs", tags=["runs"])

@router.get("", response_model=list[RunOut])
def list_runs(db: Session = Depends(get_db), _=Depends(require_permission("runs:read"))):
    return db.query(Run).order_by(Run.id.desc()).limit(200).all()
