@echo off
chcp 65001 >nul

:: 杀掉占用 8080 端口的旧进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    echo 杀掉旧进程 PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

:: 启动后端
cd /d "%~dp0server"
echo 启动服务...
go run main.go
