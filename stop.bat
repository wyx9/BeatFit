@echo off
chcp 65001 >nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo 杀掉进程 PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)
echo 已停止
pause
