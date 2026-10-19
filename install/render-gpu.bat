@echo off
rem Renderiza os reels na placa de video deste PC. Roda de dentro da pasta do repositorio tamocriando.
cd /d "%~dp0.."
where node >nul 2>nul || (echo Falta o Node.js: https://nodejs.org & pause & exit /b 1)
where ffmpeg >nul 2>nul || (echo Falta o ffmpeg no PATH. & pause & exit /b 1)
echo [1/3] instalando dependencias...
call npm install --no-audit --no-fund || (pause & exit /b 1)
call npx playwright install chromium || (pause & exit /b 1)
set ENC=
nvidia-smi >nul 2>nul && set ENC=--nvenc
echo [2/3] teste de 4 segundos (confere se a placa de video esta sendo usada)...
node tools\estudio\produzir.mjs estudio\producoes\o-contrato\roteiro.json --ate 4 --gpu --scale 1 %ENC%
echo.
echo Se apareceu "SwiftShader" na linha "placa:", a GPU nao foi usada. Feche e me avise.
pause
echo [3/3] renderizando os 5 reels...
for %%d in (o-contrato o-cara-lotado o-preco o-cliente-emprestado quem-ensina-a-vender) do (
  node tools\estudio\produzir.mjs estudio\producoes\%%d\roteiro.json --gpu --scale 1 %ENC%
)
echo Pronto. Os videos estao em estudio\producoes\^<reel^>\final.mp4
pause
