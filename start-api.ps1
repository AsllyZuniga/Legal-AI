cd "C:\Users\Aslly zuniga\Desktop\legal-ai\apps\api"
$env:DATABASE_URL="postgresql://legal_user:CAMBIAR_POR_SEGURO@localhost:5433/legal_ai"
$env:JWT_SECRET="CAMBIAR_POR_SEGURO"
$env:JWT_EXPIRATION="24h"
$env:JWT_REFRESH_SECRET="CAMBIAR_POR_SEGURO"
node dist/main.js
