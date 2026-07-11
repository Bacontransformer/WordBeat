# 以管理员 PowerShell 运行：
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\scripts\reset-mysql-root.ps1

$ErrorActionPreference = 'Stop'
$mysqld = 'C:\develop\MySQL Server 8.0\bin\mysqld.exe'
$mysql = 'C:\develop\MySQL Server 8.0\bin\mysql.exe'
$defaults = 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini'
$datadir = 'C:\ProgramData\MySQL\MySQL Server 8.0\Data'
$newPassword = '4275'
$tempPort = 3307
$initFile = Join-Path $env:TEMP 'wordbeat-mysql-init.sql'
$errLog = Join-Path $env:TEMP 'wordbeat-mysqld-reset.err'

function Wait-Port {
  param([int]$Port, [int]$TimeoutSec = 30)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($listening) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

Write-Host '==> Stopping MySQL80 service...'
if ((Get-Service MySQL80).Status -ne 'Stopped') {
  Stop-Service MySQL80 -Force
}
$sw = [Diagnostics.Stopwatch]::StartNew()
while ((Get-Service MySQL80).Status -ne 'Stopped' -and $sw.Elapsed.TotalSeconds -lt 30) {
  Start-Sleep -Seconds 1
}
if ((Get-Service MySQL80).Status -ne 'Stopped') {
  throw 'MySQL80 service did not stop in time.'
}

Write-Host '==> Killing leftover mysqld processes...'
Get-Process mysqld -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host ("    kill pid {0}" -f $_.Id)
  Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# init-file approach is more reliable than interactive FLUSH on Windows
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';
FLUSH PRIVILEGES;
"@ | Set-Content -Path $initFile -Encoding ASCII

if (Test-Path $errLog) { Remove-Item $errLog -Force }

Write-Host "==> Starting temporary mysqld on port $tempPort with init-file..."
$argList = @(
  "--defaults-file=`"$defaults`"",
  "--datadir=`"$datadir`"",
  "--port=$tempPort",
  '--bind-address=127.0.0.1',
  '--skip-networking=0',
  "--init-file=`"$initFile`"",
  "--log-error=`"$errLog`"",
  '--console'
)
$proc = Start-Process -FilePath $mysqld -ArgumentList $argList -PassThru -WindowStyle Hidden

if (-not (Wait-Port -Port $tempPort -TimeoutSec 45)) {
  Write-Host 'Temporary mysqld failed to open port. Error log tail:'
  if (Test-Path $errLog) { Get-Content $errLog -Tail 40 }
  Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  throw "mysqld did not listen on $tempPort"
}

Write-Host '==> Waiting for init-file to apply...'
Start-Sleep -Seconds 5

Write-Host '==> Stopping temporary mysqld...'
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host '==> Starting MySQL80 service...'
Start-Service MySQL80
$sw.Restart()
while ((Get-Service MySQL80).Status -ne 'Running' -and $sw.Elapsed.TotalSeconds -lt 45) {
  Start-Sleep -Seconds 1
}
Start-Sleep -Seconds 2

Write-Host '==> Verifying root password...'
& $mysql -u root "-p$newPassword" -h 127.0.0.1 -P 3306 -e "SELECT 'password ok' AS result, USER() AS who;"
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Verify failed. Error log tail:'
  if (Test-Path $errLog) { Get-Content $errLog -Tail 60 }
  throw 'Password reset verification failed.'
}

Remove-Item $initFile -Force -ErrorAction SilentlyContinue
Write-Host 'Done. Password is now 4275. Next: npm run db:init'
