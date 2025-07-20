@echo off
echo ====================================================
echo    SEHATYNET PEER SERVER TEST
echo ====================================================
echo.
echo This script will:
echo 1. Start the peer server
echo 2. Wait for it to initialize
echo 3. Run a test client to verify connectivity
echo.

REM Start the peer server in a new window
echo Starting peer server in a new window...
start "PeerJS Server" cmd /k "node peer-server.js"

echo.
echo Waiting for peer server to initialize (5 seconds)...
timeout /t 5 /nobreak > nul
echo.

echo Running test client to verify peer server connection...
node test-peer-server.js

echo.
echo Test completed. Check the output above for results.
echo.
echo NOTE: The peer server window will remain open for manual inspection.
echo Close it manually when you're done.
echo ====================================================
