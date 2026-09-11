@echo off
cd /d C:\Users\Aslly zuniga\Desktop\legal-ai\apps\api
set DATABASE_URL=postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai
set JWT_SECRET=CAMBIAR_POR_SEGURO
set JWT_EXPIRATION=24h
set JWT_REFRESH_SECRET=CAMBIAR_POR_SEGURO
node dist/main.js
