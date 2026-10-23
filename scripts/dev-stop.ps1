# ============================================================
# 极客比价 · 本地开发一键停止
# ------------------------------------------------------------
# 按端口停止：5173 用户端 / 5174 管理后台 / 8080 后端 / 3307 MySQL
# 不会动本机 3306 的 phpStudy 实例。
#
# 特点：
# - MySQL 优先用 mysqladmin shutdown 正常关闭（避免 kill -9 后的
#   InnoDB 崩溃恢复），失败再回退到强制结束进程；
# - 重复执行安全：没在跑的会跳过。
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File scripts\dev-stop.ps1
# ============================================================

$ErrorActionPreference = 'Continue'

$MYSQL_HOME = 'C:\Program Files\MySQL\MySQL Server 8.4'
$MYSQL_PWD = '123456'

$targets = @(
  @{ name = '用户端';   port = 5173; kind = 'app'   },
  @{ name = '管理后台'; port = 5174; kind = 'app'   },
  @{ name = '后端';     port = 8080; kind = 'app'   },
  @{ name = 'MySQL';    port = 3307; kind = 'mysql' }
)

function Test-Port([int]$port) {
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

$stopped = 0

foreach ($t in $targets) {
  if (-not (Test-Port $t.port)) {
    Write-Host "[stop] $($t.name) ($($t.port)) 未运行" -ForegroundColor DarkGray
    continue
  }

  $procId = (Get-NetTCPConnection -State Listen -LocalPort $t.port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -First 1

  if ($t.kind -eq 'mysql') {
    $mysqladmin = Join-Path $MYSQL_HOME 'bin\mysqladmin.exe'
    if (Test-Path $mysqladmin) {
      Write-Host "[stop] 正常关闭 MySQL（mysqladmin shutdown）..." -ForegroundColor Yellow
      & $mysqladmin -h 127.0.0.1 -P $t.port -u root "-p$MYSQL_PWD" shutdown 2>$null | Out-Null
      for ($i = 0; $i -lt 20; $i++) {
        if (-not (Test-Port $t.port)) { break }
        Start-Sleep -Milliseconds 500
      }
    }
    if (Test-Port $t.port) {
      Write-Host '[stop] 正常关闭未生效，回退强制结束' -ForegroundColor Yellow
    }
  }

  if (Test-Port $t.port) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "[stop] 已停止 $($t.name) ($($t.port), pid=$procId)" -ForegroundColor Yellow
      $stopped++
    } catch {
      Write-Host "[stop] 停止 $($t.name) 失败：$($_.Exception.Message)" -ForegroundColor Red
    }
  } else {
    Write-Host "[stop] 已停止 $($t.name) ($($t.port))" -ForegroundColor Yellow
    $stopped++
  }
}

Write-Host ''
if ($stopped -eq 0) {
  Write-Host '[stop] 没有需要停止的服务' -ForegroundColor DarkGray
} else {
  Write-Host "[stop] 完成，共停止 $stopped 个服务" -ForegroundColor Green
}

exit 0
