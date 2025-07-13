@echo off
echo ====================================================
echo    SEHATYNET RESTART
echo ====================================================

:: Kill any running processes on the ports we need
echo Stopping services...
npx kill-port 5173 9000 5000
timeout /t 2 /nobreak > nul

:: Clear terminal
cls

:: Start the services using npm start
echo Starting all services...
echo.
echo Remember to check that the PeerJS API key matches between:
echo   - peer-server.js (key: "sehatynet")
echo   - LiveConsultation.tsx (PEER_API_KEY: "sehatynet")
echo.
npm start
