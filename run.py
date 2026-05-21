#!/usr/bin/env python3
"""
NestAI One-Click Launcher
Starts both Frontend (React) and Backend (FastAPI)
"""

import subprocess
import sys
import os
import shutil
import time
import urllib.request
import webbrowser
from pathlib import Path
from threading import Thread

class Colors:
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'

def log(service, message, color=Colors.BLUE):
    encoding = sys.stdout.encoding or "utf-8"
    safe_message = str(message).encode(encoding, errors="replace").decode(encoding, errors="replace")
    print(f"{color}[{service}]{Colors.END} {safe_message}")

def unique_paths(paths):
    seen = set()
    result = []
    for path in paths:
        if not path:
            continue
        normalized = str(Path(path)).lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        result.append(str(path))
    return result

def has_backend_dependencies(python_cmd):
    probe = "import fastapi, sqlalchemy, uvicorn"
    try:
        completed = subprocess.run(
            [python_cmd, "-c", probe],
            cwd="python-server",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10,
        )
        return completed.returncode == 0, completed.stderr.strip()
    except Exception as exc:
        return False, str(exc)

def resolve_backend_python():
    candidates = [
        os.environ.get("NESTAI_PYTHON"),
        Path(".venv") / "Scripts" / "python.exe",
        Path("python-server") / ".venv" / "Scripts" / "python.exe",
        Path("E:/Software/Anaconda/python.exe"),
        sys.executable,
        shutil.which("python"),
        shutil.which("python3"),
    ]

    failures = []
    for candidate in unique_paths(candidates):
        path = Path(candidate)
        if path.is_absolute() and not path.exists():
            continue
        ok, error = has_backend_dependencies(candidate)
        if ok:
            log("Backend", f"Using Python: {candidate}", Colors.GREEN)
            return candidate
        failures.append(f"{candidate}: {error or 'missing backend dependencies'}")

    hint = (
        "No Python with backend dependencies was found. "
        "Install them with: python -m pip install -r python-server/requirements.txt "
        "or set NESTAI_PYTHON to the correct python.exe."
    )
    if failures:
        hint += "\nChecked:\n- " + "\n- ".join(failures)
    raise RuntimeError(hint)

def start_backend():
    log("Backend", "Starting FastAPI (python-server)...", Colors.GREEN)
    backend_python = resolve_backend_python()
    return subprocess.Popen(
        [backend_python, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--host", "0.0.0.0"],
        cwd="python-server",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

def start_frontend():
    log("Frontend", "Starting Vite (web)...", Colors.BLUE)
    pnpm_cmd = shutil.which("pnpm") or shutil.which("pnpm.cmd")
    if not pnpm_cmd and os.name == "nt":
        appdata = os.environ.get("APPDATA")
        candidate = Path(appdata or "") / "npm" / "pnpm.cmd"
        if candidate.exists():
            pnpm_cmd = str(candidate)
    if not pnpm_cmd:
        raise RuntimeError("pnpm not found in PATH")
    return subprocess.Popen(
        [pnpm_cmd, "--dir", "web", "dev"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
    )

def stream_output(process, service_name, color):
    for line in iter(process.stdout.readline, ''):
        if line:
            log(service_name, line.strip(), color)

def wait_for_url(url, timeout_seconds=30):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status < 500:
                    return True
        except Exception:
            time.sleep(0.5)
    return False

def open_frontend_when_ready():
    url = "http://localhost:5000"
    if wait_for_url(url, timeout_seconds=30):
        log("System", f"Opening {url}", Colors.YELLOW)
        webbrowser.open(url)
    else:
        log("System", f"Frontend did not respond within 30s. Open manually: {url}", Colors.RED)

def main():
    print(f"{Colors.YELLOW}NestAI Launcher{Colors.END}")
    print("=" * 50)

    if not Path("python-server").exists():
        log("Error", "python-server not found", Colors.RED)
        sys.exit(1)

    if not Path("web").exists():
        log("Error", "web not found", Colors.RED)
        sys.exit(1)

    processes = []

    try:
        backend = start_backend()
        processes.append((backend, "Backend", Colors.GREEN))
        time.sleep(3)

        frontend = start_frontend()
        processes.append((frontend, "Frontend", Colors.BLUE))

        print("\n" + "=" * 50)
        log("System", "All services started!", Colors.YELLOW)
        log("System", "Frontend: http://localhost:5000", Colors.YELLOW)
        log("System", "Backend:  http://localhost:8000", Colors.YELLOW)
        log("System", "API Docs: http://localhost:8000/docs", Colors.YELLOW)
        print("=" * 50 + "\n")

        threads = []
        for process, name, color in processes:
            t = Thread(target=stream_output, args=(process, name, color))
            t.daemon = True
            t.start()
            threads.append(t)

        opener = Thread(target=open_frontend_when_ready)
        opener.daemon = True
        opener.start()

        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n")
        log("System", "Shutting down...", Colors.YELLOW)

        for process, name, _ in processes:
            log(name, "Stopping...", Colors.RED)
            process.terminate()
            process.wait(timeout=5)

        log("System", "All stopped", Colors.GREEN)

    except Exception as e:
        log("Error", str(e), Colors.RED)
        sys.exit(1)

if __name__ == "__main__":
    main()
