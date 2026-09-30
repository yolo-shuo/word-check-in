@echo off
REM ============================================
REM  单词打卡应用 - Windows 安装脚本
REM ============================================

echo.
echo ============================================
echo  单词打卡应用 - 安装脚本
echo ============================================
echo.

REM 检查 Node.js
echo [1/6] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo 错误: 请先安装 Node.js 18+
echo 下载地址: https://nodejs.org/
  pause
  exit /b 1
)
echo Node.js 版本: 
node --version

echo.
REM 检查 pnpm
echo [2/6] 检查 pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
  echo 未找到 pnpm，正在安装...
  corepack enable
  corepack prepare pnpm@latest --activate
)
echo pnpm 版本: 
pnpm --version

echo.
REM 安装依赖
echo [3/6] 安装依赖（可能需要几分钟）...
pnpm install
if %errorlevel% neq 0 (
  echo 依赖安装失败，请检查网络或权限
  pause
  exit /b 1
)

echo.
REM 生成 Prisma 客户端
echo [4/6] 生成 Prisma 客户端...
pnpm prisma generate
if %errorlevel% neq 0 (
  echo Prisma 客户端生成失败
  pause
  exit /b 1
)

echo.
REM 启动数据库
echo [5/6] 启动数据库...
docker compose up -d db redis
if %errorlevel% neq 0 (
  echo Docker 未安装或未运行
echo 请先安装 Docker Desktop: https://docs.docker.com/desktop/
  pause
  exit /b 1
)

echo 等待数据库启动...
timeout /t 5

echo.
REM 运行迁移
echo [6/6] 运行数据库迁移...
pnpm prisma migrate dev
if %errorlevel% neq 0 (
  echo 数据库迁移失败
  pause
  exit /b 1
)

echo.
echo ============================================
echo  安装完成！
echo ============================================
echo.
echo 启动开发服务器: pnpm dev
echo 访问地址: http://localhost:3000
echo.

echo 导入种子数据（词库）: pnpm prisma:seed
echo.
pause
