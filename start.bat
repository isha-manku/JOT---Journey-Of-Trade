@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        CRM JOT - Enterprise Application Startup
echo ========================================================
echo.

:: 1. Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in your PATH.
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 2. Check if Docker is running
echo [INFO] Checking Docker Engine...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Docker is not running. Attempting to start Docker Desktop...
    
    :: Attempt to start Docker Desktop on Windows
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo [INFO] Waiting for Docker Engine to initialize...
    :WAIT_DOCKER
    timeout /t 3 /nobreak >nul
    docker info >nul 2>nul
    if !errorlevel! neq 0 (
        echo [WAIT] Docker is still starting. Please wait...
        goto WAIT_DOCKER
    )
    echo [INFO] Docker Engine is now running!
) else (
    echo [INFO] Docker Engine is already running.
)

echo.
echo [INFO] Building and starting the CRM application container...
echo [INFO] This may take several minutes if this is the first run.
echo.

docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start Docker containers.
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo [INFO] Application containers are starting up.
echo [INFO] Waiting for backend server to become healthy...

:WAIT_SERVER
timeout /t 3 /nobreak >nul
curl -s http://localhost:5000 >nul 2>nul
if !errorlevel! neq 0 (
    echo [WAIT] Server is still initializing. Please wait...
    goto WAIT_SERVER
)

echo.
echo ========================================================
echo    SUCCESS! CRM JOT is running.
echo ========================================================
echo.
echo Access the application at: http://localhost:5000
echo.
echo Default login credentials:
echo Username: admin
echo Password: 12345
echo.
echo Opening browser...

start http://localhost:5000

echo.
echo [INFO] Setup complete. You may close this window.
pause
