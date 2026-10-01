@echo off
REM ============================================
REM word-check-in 自动备份脚本
REM 用途: 定期将本地仓库推送到备份远程
REM ============================================

echo ============================================
echo  word-check-in 自动备份
echo  时间: %date% %time%
echo ============================================
echo.

cd /d D:\word-check-in

REM 检查 git 是否可用
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 git，请先安装 Git
    exit /b 1
)

REM 获取当前状态
echo [1/3] 获取当前 git 状态...
git status --short

REM 检查是否有未提交的更改
git diff --quiet 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 有未提交的更改，先自动提交...
    git add -A
    git commit -m "chore: 自动备份提交 %date% %time%"
)

git diff --cached --quiet 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 有已暂存但未提交的更改，先自动提交...
    git commit -m "chore: 自动备份提交 %date% %time%"
)

REM 推送到本地备份
echo [2/3] 推送到本地备份...
git push local-backup --all
git push local-backup --tags

REM 尝试推送到 GitHub
echo [3/3] 尝试推送到 GitHub...
git push origin main 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [提示] GitHub 推送失败（网络不可用），代码已安全保存在本地备份
    echo [提示] 网络恢复后可运行: git push origin main
)

echo.
echo ============================================
echo  备份完成
echo  本地备份: D:\word-check-in-backup
echo  GitHub: https://github.com/Yolo/word-check-in.git
echo ============================================