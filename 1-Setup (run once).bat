@echo off
setlocal
echo ============================================
echo   Production Dashboard - First-time setup
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js was not found on your computer.
    echo.
    echo Please install it first:
    echo   1. Go to https://nodejs.org
    echo   2. Download the LTS version and run the installer
    echo   3. Come back here and double-click this file again
    echo.
    pause
    exit /b 1
)

echo Installing the app's pieces - this can take a minute or two...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo Something went wrong during install. Scroll up to see the error.
    pause
    exit /b 1
)

if not exist .env.local (
    copy .env.example .env.local >nul
)

echo.
echo ============================================
echo   One more thing: your Anthropic API key
echo ============================================
echo.
echo Notepad is about to open a settings file.
echo Find the line that says ANTHROPIC_API_KEY=
echo and paste your key right after the equals sign, no spaces.
echo.
echo   Don't have a key yet? Get one at:
echo   https://console.anthropic.com  -^>  API Keys  -^>  Create Key
echo.
echo Then save the file (Ctrl+S) and close Notepad to continue.
echo.
pause
start /wait notepad .env.local

echo.
echo ============================================
echo   Setup complete!
echo ============================================
echo From now on, double-click "2-Start.bat" any time
echo you want to open the app. You don't need this
echo setup file again unless something breaks.
echo.
pause
