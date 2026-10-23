# ============================================================
# 极客比价 · 本地开发一键启动
# ------------------------------------------------------------
# 依次拉起：独立 MySQL 8.4（3307）→ 后端（8080）
#                    → 用户端（5173）→ 管理后台（5174）
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts\dev-start.ps1
#
# 说明：
# - 端口已监听则跳过，不重复启动；
# - 工作区 .tmpbuild 作为 TEMP 目录，规避 esbuild 清理临时文件
#   时的 “Access is denied”；
# - 日志输出到 logs\*.log；
# - 不用 Start-Process：Windows PowerShell 5.1 在同时存在
#   NO_PROXY / no_proxy 时会抛 “Item has already been added”。
#
# 参数：
#   -Open   启动完成后用默认浏览器打开用户端
# ============================================================

param([switch]$Open)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$logs = Join-Path $root 'logs'
$tmp = Join-Path $root '.tmpbuild'
New-Item -ItemType Directory -Force -Path $logs, $tmp | Out-Null

# 让 esbuild / vite 使用工作区临时目录
$env:TEMP = $tmp
$env:TMP = $tmp
$env:TMPDIR = $tmp

$MYSQL_HOME = 'C:\Program Files\MySQL\MySQL Server 8.4'
$DATA_DIR = Join-Path $env:LOCALAPPDATA 'GeekPrice\mysql-data'

function Test-Port([int]$port) {
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

function Wait-Port([int]$port, [int]$seconds = 60) {
  for ($i = 0; $i -lt $seconds; $i++) {
    if (Test-Port $port) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Write-Step($msg) { Write-Host "[dev] $msg" -ForegroundColor Cyan }

# 后台启动，输出重定向到日志（避免 Start-Process 的环境变量字典冲突）
function Start-Background {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [Parameter(Mandatory)][string]$WorkDir,
    [Parameter(Mandatory)][string]$LogFile,
    [string[]]$Args = @()
  )
  # cmd /c 的引号规则：可执行文件路径带空格时，需要最外层再包一对引号
  $cmdLine = '/c ""' + $FilePath + '"'
  if ($Args.Count -gt 0) { $cmdLine += ' ' + ($Args -join ' ') }
  $cmdLine += ' > "' + $LogFile + '" 2>&1"'

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = 'cmd.exe'
  $psi.Arguments = $cmdLine
  $psi.WorkingDirectory = $WorkDir
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  # 重定向到独立管道：避免子进程继承调用方 stdout。
  # 否则在被管道捕获的场景（IDE 终端 / CI）里，父命令等不到 EOF 会一直挂住。
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  [void][System.Diagnostics.Process]::Start($psi)
}

# ---------- 1. MySQL 8.4（3307） ----------
if (Test-Port 3307) {
  Write-Step 'MySQL 3307 已运行，跳过'
} else {
  if (-not (Test-Path $DATA_DIR)) {
    Write-Host "[dev] 未找到数据目录 $DATA_DIR" -ForegroundColor Red
    Write-Host "      先执行：`"$MYSQL_HOME\bin\mysqld.exe`" --initialize-insecure --datadir=`"$DATA_DIR`"" -ForegroundColor Yellow
    exit 1
  }
  Write-Step '启动 MySQL 8.4（3307）...'
  Start-Background -FilePath "$MYSQL_HOME\bin\mysqld.exe" -WorkDir $MYSQL_HOME `
    -LogFile (Join-Path $logs 'mysql.log') `
    -Args @("--datadir=$DATA_DIR", '--port=3307', '--skip-log-bin')
  if (-not (Wait-Port 3307 60)) { Write-Host '[dev] MySQL 启动超时，查看 logs\mysql.log' -ForegroundColor Red; exit 1 }
}

# ---------- 2. 后端（8080，profile=dev） ----------
if (Test-Port 8080) {
  Write-Step '后端 8080 已运行，跳过'
} else {
  Write-Step '启动后端（profile=dev）...'
  $backend = Join-Path $root 'backend'
  $cpFile = Join-Path $backend 'cp.args'

  # 无 Maven 时 target/classes 不会自动同步资源文件，这里补一次 profile 配置
  $resSrc = Join-Path $backend 'src\main\resources\application-dev.yml'
  $resDst = Join-Path $backend 'target\classes\application-dev.yml'
  if ((Test-Path $resSrc) -and (Test-Path (Split-Path $resDst -Parent))) {
    Copy-Item $resSrc $resDst -Force
  }

  # 首次运行时生成 classpath argfile（无 Maven 时用本地 .m2 依赖跑 target/classes）
  if (-not (Test-Path $cpFile)) {
    Write-Step '生成 classpath（首次运行，遍历本地 .m2）...'
    $repo = Join-Path $env:USERPROFILE '.m2\repository'
    $jars = Get-ChildItem $repo -Recurse -Filter *.jar -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -notmatch '-sources|-javadoc' }
    $map = @{}
    foreach ($j in $jars) {
      $art = $j.Directory.Parent.Name
      $ver = $j.Directory.Name
      if ($art -match '^(slf4j-simple|slf4j-nop|log4j-slf4j-impl|commons-logging|slf4j-log4j12)$') { continue }
      $v = $null
      [void][version]::TryParse(($ver -replace '[^0-9.].*$', ''), [ref]$v)
      if (-not $map.ContainsKey($art) -or ($null -ne $v -and ($null -eq $map[$art].v -or $v -gt $map[$art].v))) {
        $map[$art] = @{ v = $v; path = $j.FullName }
      }
    }
    $cp = 'target/classes;' + (($map.Values | ForEach-Object { $_.path.Replace('\', '/') }) -join ';')
    $content = '-cp "' + $cp + '"' + "`r`n" + 'com.geekprice.GeekPriceApplication'
    [System.IO.File]::WriteAllText($cpFile, $content, [System.Text.Encoding]::ASCII)
  }

  Start-Background -FilePath 'java' -WorkDir $backend `
    -LogFile (Join-Path $logs 'backend.log') `
    -Args @('@cp.args', '--spring.profiles.active=dev')
  if (-not (Wait-Port 8080 90)) { Write-Host '[dev] 后端启动超时，查看 logs\backend.log' -ForegroundColor Red; exit 1 }
}

# ---------- 3. 用户端（5173）/ 管理后台（5174） ----------
$apps = @(
  @{ name = '用户端';   port = 5173; dir = 'frontend'; log = 'frontend.log' },
  @{ name = '管理后台'; port = 5174; dir = 'admin';    log = 'admin.log' }
)

foreach ($app in $apps) {
  if (Test-Port $app.port) {
    Write-Step "$($app.name) $($app.port) 已运行，跳过"
    continue
  }
  Write-Step "启动$($app.name)（$($app.port)）..."
  # 直接用本地 vite，绕开 npm.cmd 在不同 shell 下推算 npm-cli 路径的问题
  Start-Background -FilePath 'node' -WorkDir (Join-Path $root $app.dir) `
    -LogFile (Join-Path $logs $app.log) `
    -Args @('node_modules\vite\bin\vite.js', '--port', "$($app.port)")
  if (-not (Wait-Port $app.port 90)) { Write-Host "[dev] $($app.name) 启动超时，查看 logs\$($app.log)" -ForegroundColor Red }
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Green
Write-Host ' 极客比价 本地开发环境已就绪' -ForegroundColor Green
Write-Host '========================================' -ForegroundColor Green
Write-Host ' 用户端     http://localhost:5173'
Write-Host ' 管理后台   http://localhost:5174'
Write-Host ' 后端 API   http://localhost:8080/api'
Write-Host ' Swagger    http://localhost:8080/swagger-ui.html'
Write-Host ' 数据库     127.0.0.1:3307  geek_price (root/123456)'
Write-Host ' 测试账号   admin / editor / user，密码均为 123456'
Write-Host ''

if ($Open) {
  Write-Step '正在打开浏览器...'
  Start-Process 'http://localhost:5173'
}
