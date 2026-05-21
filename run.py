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

def start_backend():
    log("Backend", "Starting FastAPI (python-server)...", Colors.GREEN)
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--host", "0.0.0.0"],
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
