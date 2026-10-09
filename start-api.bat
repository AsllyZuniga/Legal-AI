@echo off
REM Arranca la API en local. Las variables se leen de apps\api\.env (@nestjs/config).
REM Sin secretos en este script.
cd /d "%~dp0apps\api"
node dist/main.js
