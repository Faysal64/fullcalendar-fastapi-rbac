from pathlib import Path
import subprocess
from datetime import datetime, timezone

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts_store"
SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

def run_python_script(script_text: str) -> tuple[int, str]:
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    script_path = SCRIPTS_DIR / f"job_{ts}.py"
    script_path.write_text(script_text, encoding="utf-8")

    proc = subprocess.run(
        ["python", str(script_path)],
        capture_output=True,
        text=True,
        timeout=60,
    )
    logs = (proc.stdout or "")
    if proc.stderr:
        logs += ("\n" if logs else "") + proc.stderr
    return proc.returncode, logs
