@echo off
set /p msg="Nhập commit message: "
git add .
git commit -m "%msg%"
git push
