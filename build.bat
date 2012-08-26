cd /d %~dp0
cd
copy /y dojo-src\XHRPOSTER.profile.js dojo-src\util\profiles\
dojo-src\util\buildscripts\build profile=XHRPOSTER action=release releaseDir="../../../" mini=true cssOptimize=comments