# Arranca la API en local (node dist/main.js).
# Las variables (DATABASE_URL, JWT_SECRET, ...) se leen de apps/api/.env,
# que carga @nestjs/config. Aqui no hay ningun secreto.
Set-Location -LiteralPath "$PSScriptRoot\apps\api"
node dist/main.js
