@echo off
set ENVIRONMENT=%1

del .\.env
del .\leita-credentials.json

echo --- CREANDO ARCHIVO DE VARIABLES DE ENTORNO PARA %ENVIRONMENT% ---
if "%ENVIRONMENT%"=="dev" (
  copy .\deploy\environments\.env.dev .\.env
  copy .\deploy\credentials\credentials-dev.json .\leita-credentials.json
  set PROJECT_ID=catalogo-test
)

if "%ENVIRONMENT%"=="prod" (
  copy .\deploy\environments\.env.prod .\.env
  copy .\deploy\credentials\credentials-prod.json .\leita-credentials.json
  set PROJECT_ID=leita-6988e
)

echo. >> app.yaml
echo | set /p="env_variables:" >> app.yaml
echo. >> app.yaml

for /F "tokens=*" %%A in (.\.env) do (
    for /F "tokens=1,2 delims==" %%B in ("%%A") do (
      echo | echo   %%B: %%C  >> app.yaml
  )
)

echo --- CAMBIANDO A PROYECTO %PROJECT_ID% ---
gcloud config set project %PROJECT_ID%

