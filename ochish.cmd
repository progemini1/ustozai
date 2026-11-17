@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto :failed
)
call npm.cmd run build
if errorlevel 1 goto :failed
start "" http://127.0.0.1:3000
node server.mjs
pause
exit /b
:failed
echo Ishga tushirishda xato. Yuqoridagi xabarni tekshiring.
pause
exit /b 1
