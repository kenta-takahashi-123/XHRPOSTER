cd /d %~dp0
FOR /F %%t IN ('cd') DO SET ROOT_DIR=%%t
C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe --pack-extension=%ROOT_DIR%
pause