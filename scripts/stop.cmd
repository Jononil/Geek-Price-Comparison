@echo off
rem ============================================================
rem  GeekPrice - stop local dev environment
rem  Double-click, or run: scripts\stop.cmd
rem  ASCII only on purpose: .cmd under cmd.exe is safest this way.
rem ============================================================
setlocal
cd /d "%~dp0.."
title GeekPrice Dev - Stop

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-stop.ps1"

if errorlevel 1 (
  echo.
  echo [ERROR] Stop failed. See the messages above.
  pause
  exit /b 1
)

rem Keep the result on screen briefly.
rem Note: "timeout" fails when stdin is redirected, so use ping instead.
ping -n 4 127.0.0.1 >nul 2>&1

exit /b 0
