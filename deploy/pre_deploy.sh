#!/bin/bash
ENVIRONMENT=$1

rm ./.env
rm ./leita-credentials.json

echo --- CREANDO ARCHIVO DE VARIABLES DE ENTORNO PARA $ENVIRONMENT ---
if [[ $ENVIRONMENT = "dev" ]]; then  cp ./deploy/environments/.env.dev ./.env;fi;
if [[ $ENVIRONMENT = "dev" ]]; then  cp ./deploy/credentials/credentials-dev.json ./leita-credentials.json;fi;
if [[ $ENVIRONMENT = "dev" ]]; then PROJECT_ID=catalogo-test;fi;
if [[ $ENVIRONMENT = "prod" ]]; then cp ./deploy/environments/.env.prod ./.env;fi;
if [[ $ENVIRONMENT = "prod" ]]; then  cp ./deploy/credentials/credentials-prod.json ./leita-credentials.json;fi;
if [[ $ENVIRONMENT = "prod" ]]; then PROJECT_ID=leita-6988e;fi;

echo -e "\nenv_variables:" >> app.yaml
while IFS= read -r line
do  echo -e "  $line" | sed 's/=/: /g' >> app.yaml
done < .env

echo --- CAMBIANDO A PROYECTO $PROJECT_ID ---
gcloud config set project $PROJECT_ID;
