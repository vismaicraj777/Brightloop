@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\flask.exe" (
  echo Brightloop dependencies are not installed yet.
  echo First run: py -m venv .venv ^&^& .venv\Scripts\python -m pip install -r requirements.txt
  pause
  exit /b 1
)
if not exist ".env" (
  echo Please copy .env.example to .env and set a private SECRET_KEY first.
  pause
  exit /b 1
)
start "Brightloop" http://127.0.0.1:5000
".venv\Scripts\flask.exe" --app backend.app run
