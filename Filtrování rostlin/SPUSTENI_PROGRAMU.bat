@echo off
chcp 65001 >nul
echo ========================================
echo  Excel to HTML Bylinky Generator
echo ========================================
echo.
echo Kontroluji soubory...
echo.

if not exist "Finální.xlsx" (
    echo CHYBA: Soubor Finální.xlsx nebyl nalezen!
    echo Ujistěte se, že jste ve správném adresáři.
    pause
    exit /b 1
)

if not exist "Hotovo4.html" (
    echo CHYBA: Soubor Hotovo4.html nebyl nalezen!
    echo Ujistěte se, že jste ve správném adresáři.
    pause
    exit /b 1
)

if not exist "generate_html.py" (
    echo CHYBA: Soubor generate_html.py nebyl nalezen!
    echo Ujistěte se, že jste ve správném adresáři.
    pause
    exit /b 1
)

echo Všechny soubory nalezeny!
echo.
echo Spouštím program...
echo.

python generate_html.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  HOTOVO! Soubor output.html byl vytvořen.
    echo ========================================
    echo.
    echo Chcete otevřít output.html v prohlížeči? (A/N)
    set /p odpoved=
    if /i "%odpoved%"=="A" (
        start output.html
    )
) else (
    echo.
    echo ========================================
    echo  CHYBA při spouštění programu!
    echo ========================================
    echo.
    echo Zkontrolujte výše uvedené chybové hlášky.
)

echo.
pause
