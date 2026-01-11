from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_permission
from app.models.event import Event
from app.schemas.event import EventCreate

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

@router.get("/events")
def list_events(
    db: Session = Depends(get_db),
    _=Depends(require_permission("calendar:read")),
):
    events = db.query(Event).order_by(Event.start_at.asc()).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "start": e.start_at.isoformat(),
            "end": e.end_at.isoformat(),
            "allDay": e.all_day,
            "category": e.category,
        }
        for e in events
    ]

@router.post("/events")
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("calendar:write")),
):
    ev = Event(
        title=payload.title,
        category=payload.category,
        start_at=payload.start_at,
        end_at=payload.end_at,
        all_day=payload.all_day,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {
        "id": ev.id,
        "title": ev.title,
        "start": ev.start_at.isoformat(),
        "end": ev.end_at.isoformat(),
        "allDay": ev.all_day,
        "category": ev.category,
    }

@router.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_permission("calendar:write")),
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(ev)
    db.commit()
    return {"ok": True}
