@echo off
REM Ingesta Corte Constitucional en segundo plano.
REM
REM Ritmo: 1.2 s por providencia. A 0.35 s el sitio de la Corte Constitucional
REM corta la conexion a mitad del recorrido y bloquea la IP, asi que conviene
REM ir despacio: ~4.500 providencias son unas 90 minutos.
REM
REM La redireccion va dentro de este .cmd para que el proceso hijo no herede los
REM descriptores de la consola que lo lanza.

setlocal
cd /d "C:\Users\Aslly zuniga\Desktop\legal-ai\apps\ai"

set "DATABASE_URL=postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
set "SCRAPER_SINCE=2017-01-01"
set "SCRAPER_RATE_LIMIT=1.2"
set "SCRAPER_MAX_METADATA=0"
set "SCRAPER_MAX_HTML=0"
set "SCRAPER_MAX_FALLOS=8"
set "SCRAPER_MAX_RETRIES=3"
set "SCRAPER_RETRY_WAIT=8"
set "PYTHONUNBUFFERED=1"

set "LOGDIR=scripts\logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"

:reintento
echo === intento %date% %time% === >> "%LOGDIR%\cc_forever.log"
venv\Scripts\python.exe scripts\scraper.py >> "%LOGDIR%\cc_forever.log" 2>&1
set "CODIGO=%ERRORLEVEL%"
echo === termino con codigo %CODIGO% === >> "%LOGDIR%\cc_forever.log"

if "%CODIGO%"=="0" goto fin

REM Si el scraper se detuvo por bloqueo, hay que dejar enfriar el sitio.
echo espera de 15 min antes de reintentar >> "%LOGDIR%\cc_forever.log"
timeout /t 900 /nobreak >nul
goto reintento

:fin
echo ingesta completa >> "%LOGDIR%\cc_forever.log"
exit /b 0
