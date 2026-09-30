@echo off
cd /d D:\word-check-in
echo [%date% %time%] dev server starting >> server.log
npm run dev >> server.log 2>&1
echo [%date% %time%] dev server exited >> server.log
