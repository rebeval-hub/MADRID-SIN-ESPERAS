@echo off
title MADRID SIN ESPERAS 4.0 - Servidor Local
echo ========================================================
echo        INICIANDO MADRID SIN ESPERAS - DATAMAD 2026
echo ========================================================
echo.
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo 1. Abriendo la aplicacion en tu navegador...
start http://localhost:3000

echo 2. Iniciando servidor en http://localhost:3000
echo    (Para cerrar la pagina cuando termines, pulsa Ctrl + C en esta ventana)
echo.
npm run dev
pause
