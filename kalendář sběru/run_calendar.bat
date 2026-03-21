@echo off
chcp 65001 >nul
cd /d "%~dp0"

REM Na Windows zkus nejdřív "py" (Python Launcher), pak "python"
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    py generate_calendar.py
    goto :done
)
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python generate_calendar.py
    goto :done
)
where python3 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    python3 generate_calendar.py
    goto :done
)

echo.
echo Python nebyl nalezen.
echo.
echo Možnosti:
echo   1. Nainstalujte Python z https://www.python.org/downloads/
echo      a při instalaci zaškrtněte "Add Python to PATH"
echo   2. Nebo spusťte v příkazové řádce: py generate_calendar.py
echo.
pause
exit /b 1

:done
echo.
echo Hotovo. Otevřete kalendar_sberu.html
pause
