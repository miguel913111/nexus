@echo off
cd /d "%~dp0\..\services\api-gateway"
npx ts-node src/index.ts
