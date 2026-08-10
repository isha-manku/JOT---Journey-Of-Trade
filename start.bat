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
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop
    echo.
    echo After installing, restart your computer and run this file again.
    pause
    exit /b 1
)

:: 2. Check if Docker Engine is running
echo [INFO] Checking Docker Engine status...
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Docker Engine is not running. Attempting to start Docker Desktop...
    echo.

    :: Try common install paths for Docker Desktop
    set "DOCKER_EXE="
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        set "DOCKER_EXE=C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
        set "DOCKER_EXE=%LOCALAPPDATA%\Docker\Docker Desktop.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe" (
        set "DOCKER_EXE=%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe"
    )


    if defined DOCKER_EXE (
        start "" "!DOCKER_EXE!"
        echo [INFO] Docker Desktop is starting. This may take up to 60 seconds...
    ) else (
        echo [WARN] Could not find Docker Desktop automatically.
        echo [INFO] Please start Docker Desktop manually, then press any key to continue.
        pause >nul
    )

    echo [INFO] Waiting for Docker Engine to become ready...
    :WAIT_DOCKER
    timeout /t 4 /nobreak >nul
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
echo [INFO] Building and starting the CRM application...
echo [INFO] NOTE: The first run will take 5-15 minutes to download and build everything.
echo [INFO] Subsequent startups will be fast (under 30 seconds).
echo.

docker compose up -d --build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start Docker containers.
    echo [INFO] Please check the error messages above.
    echo [INFO] Common fixes:
    echo         - Make sure port 5000 is not used by another app
    echo         - Try running this file as Administrator
    pause
    exit /b 1
)

echo.
echo [INFO] Containers started. Waiting for server to be ready...

:: Wait up to 3 minutes for the server to respond
set /a ATTEMPTS=0
:WAIT_SERVER
set /a ATTEMPTS+=1
if !ATTEMPTS! gtr 60 (
    echo.
    echo [WARN] Server is taking longer than expected.
    echo [INFO] The app may still be initializing. Try opening http://localhost:5000 manually.
    goto DONE
)
timeout /t 3 /nobreak >nul
curl -s -o nul -w "%%{http_code}" http://localhost:5000 >nul 2>nul
if !errorlevel! neq 0 (
    echo [WAIT] Server initializing... (attempt !ATTEMPTS!/60)
    goto WAIT_SERVER
)

:DONE
echo.
echo ========================================================
echo    SUCCESS! CRM JOT is running.
echo ========================================================
echo.
echo    Open your browser and go to:
echo.
echo        http://localhost:5000
echo.
echo    Default login credentials:
echo        Username : admin
echo        Password : 12345
echo.
echo ========================================================
echo.
echo [INFO] Opening browser...
start http://localhost:5000

echo.
echo [INFO] The application will continue running in the background.
echo [INFO] You can safely close this window.
echo.
pause
