@echo off
setlocal enabledelayedexpansion

set MAX_RETRIES=40
set RETRY_INTERVAL=3
if "%HOST_BACKEND_PORT%"=="" set HOST_BACKEND_PORT=5000
if "%HOST_CRM_PORT%"=="" set HOST_CRM_PORT=3000
if "%HOST_DOC_PORT%"=="" set HOST_DOC_PORT=5173

call :check_service crm_backend http://localhost:%HOST_BACKEND_PORT%
if !errorlevel! neq 0 exit /b 1

call :check_service crm_frontend http://localhost:%HOST_CRM_PORT%
if !errorlevel! neq 0 exit /b 1

call :check_service crm_doc_frontend http://localhost:%HOST_DOC_PORT%
if !errorlevel! neq 0 exit /b 1

echo [SUCCESS] All services are up and running!
echo CRM Frontend: http://localhost:%HOST_CRM_PORT%
echo Doc Platform: http://localhost:%HOST_DOC_PORT%
exit /b 0

:check_service
set service_name=%1
set url=%2
set retries=0

<nul set /p="Checking %service_name% (%url%)... "

:retry_loop
curl -s -f -m 2 "%url%" >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK]
  exit /b 0
)

set /a retries+=1
if %retries% geq %MAX_RETRIES% (
  echo [FAILED]
  echo --- Logs for %service_name% ---
  docker-compose logs --tail 30 %service_name%
  echo ------------------------------
  exit /b 1
)

:: Sleep for approx RETRY_INTERVAL seconds
ping 127.0.0.1 -n %RETRY_INTERVAL% >nul
goto retry_loop
