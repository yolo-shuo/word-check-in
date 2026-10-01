@echo off
REM ============================================
REM word-check-in 恢复脚本
REM 用途: 从备份恢复项目
REM ============================================

echo ============================================
echo  word-check-in 恢复工具
echo ============================================
echo.
echo  选择恢复源:
echo    1. 从本地备份恢复 (D:\word-check-in-backup)
echo    2. 从 GitHub 克隆 (需要网络)
echo.
set /p choice="请输入选项 (1 或 2): "

if "%choice%"=="1" goto LOCAL_RESTORE
if "%choice%"=="2" goto GH_CLONE
echo 无效选项
exit /b 1

:LOCAL_RESTORE
echo.
echo 从本地备份恢复...
if exist "D:\word-check-in" (
    echo [警告] 目标目录已存在，是否覆盖？(Y/N)
    set /p confirm="确认: "
    if /i not "%confirm%"=="Y" exit /b 0
    rd /s /q "D:\word-check-in"
)
git clone "file:///D:/word-check-in-backup" "D:\word-check-in"
echo 恢复完成！
goto END

:GH_CLONE
echo.
echo 从 GitHub 克隆...
if exist "D:\word-check-in" (
    echo [警告] 目标目录已存在，是否覆盖？(Y/N)
    set /p confirm="确认: "
    if /i not "%confirm%"=="Y" exit /b 0
    rd /s /q "D:\word-check-in"
)
git clone "https://github.com/Yolo/word-check-in.git" "D:\word-check-in"
echo 克隆完成！
goto END

:END
echo.
echo 后续步骤:
echo   cd D:\word-check-in
echo   pnpm install
echo   pnpm dev
pause