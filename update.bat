@echo off
cd /d "%~dp0"
echo Rebuilding...
python rebundle.py
echo.
set /p msg=Commit message (e.g. "Update data"):
git add index.html data/ js/
git commit -m "%msg%"
git push
echo.
echo Done! Site will update in ~1 minute.
pause
