@echo off
echo ============================================
echo   Starting Production Dashboard
echo ============================================
echo.
echo Keep this window open while you use the app.
echo Your browser should open automatically in a few seconds.
echo If it doesn't, go to: http://localhost:3000
echo.
echo To stop the app later: click in this window, press Ctrl+C, then Y.
echo.

start "" cmd /c "timeout /t 4 >nul & start http://localhost:3000"
call npm run dev
pause
