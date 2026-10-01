@echo off
title Young Thinkers Society (UByTeS) Attendance System
echo ===================================================
echo Starting Young Thinkers Society Attendance System...
echo ===================================================
cd /d "%~dp0"
start http://localhost:5173
npm run dev
pause
