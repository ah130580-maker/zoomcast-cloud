@echo off
title ZoomCast Cloud VIP — SaaS Web Portal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Server.ps1" -Port 8080 -OpenBrowser
