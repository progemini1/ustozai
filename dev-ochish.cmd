@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto :failed
)
start "" http://127.0.0.1:5173/qatnovlar
call npm.cmd run dev
pause
exit /b
:failed
echo Kutubxonalarni o'rnatishda xato. Yuqoridagi xabarni tekshiring.
pause
exit /b 1
