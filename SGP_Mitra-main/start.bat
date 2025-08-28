@echo off
echo Starting SGP Mitra Application...
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Start backend server in background
echo Starting backend server...
start /b python run.py

REM Wait a moment for the backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend in a new terminal window
echo Starting frontend development server in new terminal...
start "SGP Mitra Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both servers are now running:
echo Backend: Running in this terminal (background)
echo Frontend: Running in new terminal window
echo.
echo Press Ctrl+C to stop both servers and exit
:loop
timeout /t 1 >nul
goto loop
