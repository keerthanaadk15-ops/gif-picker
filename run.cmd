@echo off
rem Runs npm/npx commands using the portable Node.js, without changing the system PATH.
rem Usage:  run.cmd install | dev | test | build | start | <any npm args>
set "NODE_HOME=C:\Users\prakass5\tools\node-v24.22.2-win-x64"
set "PATH=%NODE_HOME%;%PATH%"
cd /d "%~dp0"
if "%~1"=="" (
  echo Usage: run.cmd install ^| dev ^| test ^| build ^| start
  exit /b 1
)
if /i "%~1"=="install" ( call npm install & exit /b %errorlevel% )
if /i "%~1"=="dev"     ( call npm run dev & exit /b %errorlevel% )
if /i "%~1"=="test"    ( call npm test & exit /b %errorlevel% )
if /i "%~1"=="build"   ( call npm run build & exit /b %errorlevel% )
if /i "%~1"=="start"   ( call npm start & exit /b %errorlevel% )
if /i "%~1"=="npx"  ( call %* & exit /b %errorlevel% )
if /i "%~1"=="node" ( call %* & exit /b %errorlevel% )
if /i "%~1"=="npm"  ( call %* & exit /b %errorlevel% )
call npm %*
