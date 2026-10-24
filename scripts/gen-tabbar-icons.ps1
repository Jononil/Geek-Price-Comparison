# ============================================================
# Generate tabBar icons for the mini-program (81x81 PNG, transparent)
# ------------------------------------------------------------
# WeChat tabBar 需要两张图：正常态 / 选中态。
# 统一线性风格：5px 线宽、圆角端点，灰色 #9ca3af 与品牌靛蓝 #4f46e5。
# ============================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'mini-program\assets\tabbar'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$COLORS = @{ normal = '#9ca3af'; active = '#4f46e5' }
$SIZE = 81
$STROKE = 5

function New-Canvas {
  $bmp = New-Object System.Drawing.Bitmap($SIZE, $SIZE)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  return @{ bmp = $bmp; g = $g }
}

function New-Pen([string]$hex) {
  $c = [System.Drawing.ColorTranslator]::FromHtml($hex)
  $p = New-Object System.Drawing.Pen($c, $STROKE)
  $p.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $p.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $p.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  return $p
}

function Draw-Home($g, $pen) {
  # 屋顶
  $roof = @(
    (New-Object System.Drawing.PointF(12, 40)),
    (New-Object System.Drawing.PointF(40.5, 14)),
    (New-Object System.Drawing.PointF(69, 40))
  )
  $g.DrawLines($pen, [System.Drawing.PointF[]]$roof)
  # 墙体
  $g.DrawLine($pen, 20, 38, 20, 68)
  $g.DrawLine($pen, 61, 38, 61, 68)
  $g.DrawLine($pen, 20, 68, 61, 68)
  # 门
  $g.DrawRectangle($pen, 34, 50, 13, 18)
}

function Draw-Grid($g, $pen) {
  $rects = @(
    @(13, 13, 23, 23), @(45, 13, 23, 23),
    @(13, 45, 23, 23), @(45, 45, 23, 23)
  )
  foreach ($r in $rects) {
    $g.DrawRectangle($pen, $r[0], $r[1], $r[2], $r[3])
  }
}

function Draw-Compare($g, $pen) {
  # 两根高度不同的柱子 + 基线，读作「对比 / 排行」
  $g.DrawLine($pen, 14, 69, 67, 69)
  $g.DrawLine($pen, 26, 62, 26, 40)
  $g.DrawLine($pen, 40.5, 62, 40.5, 26)
  $g.DrawLine($pen, 55, 62, 55, 48)
}

function Draw-Review($g, $pen) {
  # 文档 + 三条文字行
  $g.DrawRectangle($pen, 18, 12, 45, 57)
  $g.DrawLine($pen, 28, 28, 53, 28)
  $g.DrawLine($pen, 28, 40, 53, 40)
  $g.DrawLine($pen, 28, 52, 45, 52)
}

function Draw-Mine($g, $pen) {
  # 头 + 肩
  $g.DrawEllipse($pen, 29, 12, 23, 23)
  $g.DrawArc($pen, 18, 44, 45, 40, 180, 180)
}

$icons = @(
  @{ name = 'home'; draw = 'Draw-Home' },
  @{ name = 'category'; draw = 'Draw-Grid' },
  @{ name = 'compare'; draw = 'Draw-Compare' },
  @{ name = 'review'; draw = 'Draw-Review' },
  @{ name = 'mine'; draw = 'Draw-Mine' }
)

foreach ($icon in $icons) {
  foreach ($state in @('normal', 'active')) {
    $c = New-Canvas
    $pen = New-Pen $COLORS[$state]
    & $icon.draw $c.g $pen
    $path = Join-Path $outDir ("{0}-{1}.png" -f $icon.name, $state)
    $c.bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $pen.Dispose(); $c.g.Dispose(); $c.bmp.Dispose()
    $kb = [math]::Round((Get-Item $path).Length / 1KB, 1)
    Write-Host ("{0,-18} {1} KB" -f (Split-Path $path -Leaf), $kb)
  }
}
Write-Host "`n输出目录：$outDir"
