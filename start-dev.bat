@echo off
echo ====================================================
echo    SEHATYNET DEVELOPMENT ENVIRONMENT STARTUP
echo ====================================================
echo.

REM Start the peer server in a new window
echo Starting peer server in a new window...
start "PeerJS Server" cmd /k "node peer-server.js"

echo.
echo Waiting for peer server to initialize (3 seconds)...
timeout /t 3 /nobreak > nul
echo.

echo Starting development server...
echo.
echo Note: If you need to stop the peer server, close its window manually.
echo.
npm run dev
