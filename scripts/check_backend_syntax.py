"""Syntax-check backend Python files without writing __pycache__ files."""

from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("backend/app")
    failures: list[str] = []

    for path in sorted(root.rglob("*.py")):
        try:
            compile(path.read_text(encoding="utf-8"), str(path), "exec")
        except Exception as exc:
            failures.append(f"{path}: {type(exc).__name__}: {exc}")

    if failures:
        print("\n".join(failures))
        return 1

    print(f"python syntax ok: {root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
