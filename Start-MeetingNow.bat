@echo off
title Zoom Auto-Broadcaster - Running Session
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-ZoomMeeting.ps1"
pause
