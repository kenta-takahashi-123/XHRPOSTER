cd /d %~dp0
cd dojo-src/util/buildscripts
build profile=XHRPOSTER action=release releaseDir="../../../" mini=true cssOptimize=comments
cd ../../../dojo/
rd /s /q dojox
cd ../dijit/themes
rd /s /q tundra
rd /s /q soria
rd /s /q nihilo
pause