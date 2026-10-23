@echo off
rem ============================================================
rem  GeekPrice - one click local dev launcher
rem  Double-click, or run: scripts\start.cmd
rem  ASCII only on purpose: .cmd under cmd.exe is safest this way.
rem ============================================================
setlocal
cd /d "%~dp0.."
title GeekPrice Dev

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev-start.ps1" -Open

if errorlevel 1 (
  echo.
  echo [ERROR] Startup failed. Check logs\*.log for details.
  pause
  exit /b 1
)

rem Keep the window for a moment so the summary is readable.
rem Note: "timeout" fails when stdin is redirected, so use ping instead.
ping -n 4 127.0.0.1 >nul 2>&1

exit /b 0
