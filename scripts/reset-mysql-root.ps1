# 以「管理员」身份在 PowerShell 中运行本脚本，将 root 密码重置为 4275
# 用法：右键 PowerShell → 以管理员身份运行 → 执行：
#   Set-ExecutionPolicy -Scope Process Bypass; .\scripts\reset-mysql-root.ps1

$ErrorActionPreference = 'Stop'
$mysqld = 'C:\develop\MySQL Server 8.0\bin\mysqld.exe'
$mysql = 'C:\develop\MySQL Server 8.0\bin\mysql.exe'
$defaults = 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini'
$newPassword = '4275'

Write-Host 'Stopping MySQL80...'
Stop-Service MySQL80 -Force
Start-Sleep -Seconds 3

Write-Host 'Starting temporary mysqld with --skip-grant-tables...'
$proc = Start-Process -FilePath $mysqld -ArgumentList @(
  "--defaults-file=`"$defaults`"",
  '--skip-grant-tables',
  '--shared-memory'
) -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 6

Write-Host 'Updating root password...'
@"
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';
FLUSH PRIVILEGES;
"@ | & $mysql -u root

Write-Host 'Stopping temporary mysqld...'
Stop-Process -Id $proc.Id -Force
Start-Sleep -Seconds 2

Write-Host 'Starting MySQL80 service...'
Start-Service MySQL80
Start-Sleep -Seconds 3

& $mysql -u root "-p$newPassword" -e "SELECT 'password ok' AS result;"
Write-Host 'Done. Then run: npm run db:init'
