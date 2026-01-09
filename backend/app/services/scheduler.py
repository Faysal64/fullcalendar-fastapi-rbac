from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import SessionLocal
from app.models.job import Job, Run
from app.services.runner import run_python_script

scheduler = BackgroundScheduler()

def execute_job(job_id: int):
    db: Session = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id, Job.enabled == True).first()
        if not job:
            return

        run = Run(job_id=job.id, status="running", started_at=datetime.utcnow())
        db.add(run)
        db.commit()
        db.refresh(run)

        try:
            code, logs = run_python_script(job.script_text)
            run.logs = logs
            run.status = "success" if code == 0 else "failed"
        except Exception as e:
            run.status = "failed"
            run.logs = (run.logs or "") + f"\nERROR: {e}"

        run.finished_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()

def sync_jobs_from_db():
    db: Session = SessionLocal()
    try:
        scheduler.remove_all_jobs()
        jobs = db.query(Job).filter(Job.enabled == True).all()
        for j in jobs:
            trigger = CronTrigger.from_crontab(j.cron)
            scheduler.add_job(execute_job, trigger=trigger, args=[j.id], id=f"job_{j.id}", replace_existing=True)
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
    sync_jobs_from_db()
