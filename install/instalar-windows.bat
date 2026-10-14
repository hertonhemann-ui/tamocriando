@echo off
chcp 65001 >nul
title Tamo Criando Motion - instalador
echo.
echo  Instalando o painel Tamo Criando Motion no Premiere Pro...
echo.

set "SRC=%~dp0..\plugin\tamocriando-motion"
set "DEST=%APPDATA%\Adobe\CEP\extensions\tamocriando-motion"

if not exist "%SRC%\CSXS\manifest.xml" (
  echo  Nao achei a pasta do plugin em:
  echo  %SRC%
  echo  Roda este arquivo de dentro da pasta "install" do pacote.
  pause
  exit /b 1
)

rem Libera extensoes nao assinadas (CEP 9 a 13 = Premiere 2020 em diante)
for %%v in (9 10 11 12 13) do reg add "HKCU\Software\Adobe\CSXS.%%v" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul

if exist "%DEST%" rmdir /s /q "%DEST%"
xcopy "%SRC%" "%DEST%\" /e /i /y /q >nul

echo  Pronto! Instalado em:
echo  %DEST%
echo.
echo  1. Fecha o Premiere (se estiver aberto) e abre de novo.
echo  2. Menu Janela ^> Extensoes ^> Tamo Criando Motion
echo.
pause
