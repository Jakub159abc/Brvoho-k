@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "Finální.xlsx" goto run
echo Soubor Finální.xlsx v této složce chybí.
pause
exit /b 1
:run
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (py fill_bc_s_diakritikou.py & goto end)
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (python fill_bc_s_diakritikou.py & goto end)
where python3 >nul 2>&1
if %ERRORLEVEL% equ 0 (python3 fill_bc_s_diakritikou.py & goto end)
echo Python nebyl nalezen. Nainstalujte Python a přidejte ho do PATH.
pause
exit /b 1
:end
pause
