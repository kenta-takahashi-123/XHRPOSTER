cd /d %~dp0
del ..\_temp.crx
del ..\_temp.pem
mkdir ..\_temp
xcopy . ..\_temp /e /y
rd /s /q ..\_temp\dojo\dojox
rd /s /q ..\_temp\dojo\dijit\themes\tundra
rd /s /q ..\_temp\dojo\dijit\themes\soria
rd /s /q ..\_temp\dojo\dijit\themes\nihilo
rd /s /q ..\_temp\dojo-src
rd /s /q ..\_temp\.git
rd /s /q ..\_temp\.idea
FOR /F %%t IN ('cd') DO SET ROOT_DIR=%%t
C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe --pack-extension=%ROOT_DIR%\..\_temp --no-message-box
rd /s /q ..\_temp
