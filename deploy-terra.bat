@echo off
set "MSG=%~1"
if "%MSG%"=="" set "MSG=Actualizacion de Donna Botanica"

cd /d C:\repos\terra-macetas

echo.
echo ========================================================
echo  [1/3] Subiendo cambios a GitHub...
echo ========================================================
git add -A
git commit -m "%MSG%"
git push origin master

echo.
echo ========================================================
echo  [2/3] Actualizando codigo en el Servidor Contabo...
echo ========================================================
ssh -o StrictHostKeyChecking=no nelson@86.48.21.7 "mkdir -p /opt/terra-macetas && cd /opt/terra-macetas && (git pull origin master || (git clone https://github.com/Xbox-hash/terra-macetas.git . && git checkout master))"

echo.
echo ========================================================
echo  [3/3] Reconstruyendo y levantando contenedores en VPS...
echo ========================================================
ssh -o StrictHostKeyChecking=no nelson@86.48.21.7 "cd /opt/terra-macetas && docker compose -f docker-compose.server.yml up -d --build"

echo.
echo ========================================================
echo  DESPLIEGUE FINALIZADO EXITOSAMENTE
echo  Produccion: https://donnabotanica.com.py
echo  Test:       https://test.donnabotanica.com.py
echo ========================================================
