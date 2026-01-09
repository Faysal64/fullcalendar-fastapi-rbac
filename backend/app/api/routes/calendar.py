from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_permission
from app.models.job import Run

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

@router.get("/events")
def calendar_events(db: Session = Depends(get_db), _=Depends(require_permission("calendar:read"))):
    runs = db.query(Run).order_by(Run.id.desc()).limit(300).all()
    events = []
    for r in runs:
        if not r.started_at:
            continue
        events.append({
            "id": f"run_{r.id}",
            "title": f"Job {r.job_id} - {r.status}",
            "start": r.started_at.isoformat(),
            "end": (r.finished_at.isoformat() if r.finished_at else None),
        })
    return events
