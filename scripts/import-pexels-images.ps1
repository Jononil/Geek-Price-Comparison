# ============================================================
# Import Pexels product photos (one-off migration)
# ------------------------------------------------------------
# - Downloads each photo from the Pexels CDN (site itself is 403
#   from this host, the CDN is reachable).
# - Normalises every image to 900x675 (4:3), centre-cropped,
#   so the whole catalogue shares one visual rhythm.
# - Writes docs/pexels-image-attribution.sql to switch the DB
#   rows over (run it with mysql afterwards).
#
# ASCII only on purpose.
# ============================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'frontend\public\products'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# productId = @{ pexelsId; author; page }
$map = @{
  1   = @{ id = 31059294; author = 'Reynaldo Yodia';      page = 'https://www.pexels.com/photo/close-up-of-modern-smartphone-and-laptop-31059294/' }
  2   = @{ id = 18403789; author = 'GENTCREATE';          page = 'https://www.pexels.com/photo/dark-color-iphones-12-13-14-15-pro-pro-max-luxury-fashion-brand-gentcreate-18403789/' }
  3   = @{ id = 33444607; author = 'Andrey Matveev';      page = 'https://www.pexels.com/photo/stylish-smartphone-on-rustic-wooden-surface-33444607/' }
  4   = @{ id = 35147240; author = 'Andrey Matveev';      page = 'https://www.pexels.com/photo/dual-huawei-smartphones-top-view-on-concrete-surface-35147240/' }
  6   = @{ id = 32171260; author = 'Richard L';           page = 'https://www.pexels.com/photo/green-xiaomi-14-smartphone-on-packaging-box-32171260/' }
  7   = @{ id = 20259184; author = 'Rohit Sharma';        page = 'https://www.pexels.com/photo/display-of-electronics-20259184/' }
  10  = @{ id = 29457222; author = 'Sai Pixels';          page = 'https://www.pexels.com/photo/close-up-of-hand-holding-an-orange-smartphone-29457222/' }
  11  = @{ id = 13780425; author = 'DEBRAJ ROY';          page = 'https://www.pexels.com/photo/a-samsung-galaxy-s22-13780425/' }
  13  = @{ id = 6849081;  author = 'Deybson Mallony';     page = 'https://www.pexels.com/photo/close-up-shot-of-an-ipad-6849081/' }
  14  = @{ id = 13570182; author = 'Luis Quintero';       page = 'https://www.pexels.com/photo/a-close-up-shot-of-a-box-of-an-ipad-air-13570182/' }
  15  = @{ id = 32239562; author = 'Andrey Matveev';      page = 'https://www.pexels.com/photo/modern-tablet-with-keyboard-on-yellow-background-32239562/' }
  16  = @{ id = 7987849;  author = 'Mikhail Nilov';       page = 'https://www.pexels.com/photo/black-drawing-tablet-on-a-white-surface-7987849/' }
  18  = @{ id = 106341;   author = 'AS Photography';      page = 'https://www.pexels.com/photo/black-samsung-tablet-on-google-page-106341/' }
  23  = @{ id = 6581378;  author = 'Nadia Dolce';         page = 'https://www.pexels.com/photo/close-up-shot-of-macbook-air-6581378/' }
  29  = @{ id = 29019330; author = 'Andrey Matveev';      page = 'https://www.pexels.com/photo/modern-devices-on-vibrant-yellow-background-29019330/' }
  48  = @{ id = 36625733; author = 'H Clicks';            page = 'https://www.pexels.com/photo/close-up-of-white-wireless-earbuds-in-charging-case-36625733/' }
  54  = @{ id = 14401717; author = 'Furkan Salihoğlu';    page = 'https://www.pexels.com/photo/a-samsung-galaxy-buds-on-a-yellow-surface-14401717/' }
  58  = @{ id = 30836161; author = 'minhphuc .workspace'; page = 'https://www.pexels.com/photo/modern-mechanical-keyboard-on-felt-desk-mat-30836161/' }
  65  = @{ id = 33303045; author = 'Andrey Matveev';      page = 'https://www.pexels.com/photo/ultra-light-wireless-mouse-on-yellow-background-33303045/' }
  67  = @{ id = 7151694;  author = 'Helena Lopes';        page = 'https://www.pexels.com/photo/new-computer-mouse-on-top-of-the-black-box-7151694/' }
  73  = @{ id = 19969452; author = 'Masood Aslami';       page = 'https://www.pexels.com/photo/vintage-digital-camera-19969452/' }
  74  = @{ id = 30550462; author = 'Radu Daniel (MRD)';   page = 'https://www.pexels.com/photo/high-quality-canon-eos-r-mirrorless-camera-30550462/' }
  76  = @{ id = 14998050; author = 'JONATHAN PAGAOA';     page = 'https://www.pexels.com/photo/photo-of-a-camera-body-standing-on-a-tripod-head-14998050/' }
  77  = @{ id = 4083514;  author = 'Robert Nagy';         page = 'https://www.pexels.com/photo/dji-osmo-pocket-on-brown-wooden-table-4083514/' }
  78  = @{ id = 39442512; author = 'Sinan KRIYA';         page = 'https://www.pexels.com/photo/close-up-of-mirrorless-camera-on-table-39442512/' }
  79  = @{ id = 11693599; author = 'Romawi Namaasli';     page = 'https://www.pexels.com/photo/canon-eos-m6-mark-ii-in-black-surface-11693599/' }
  80  = @{ id = 39317397; author = 'Luriko Yamaguchi';    page = 'https://www.pexels.com/photo/close-up-of-lumix-cameras-on-display-table-39317397/' }
  81  = @{ id = 9584702;  author = 'Adrian Regeci';       page = 'https://www.pexels.com/photo/silver-aluminum-case-apple-watch-with-white-sport-band-9584702/' }
  83  = @{ id = 6846257;  author = 'Alfin Auzikri';       page = 'https://www.pexels.com/photo/a-person-wearing-fitness-tracker-accessory-6846257/' }
  84  = @{ id = 12237047; author = 'Vikram Aditya';       page = 'https://www.pexels.com/photo/black-watch-on-coal-12237047/' }
  85  = @{ id = 3999644;  author = 'K';                   page = 'https://www.pexels.com/photo/black-digital-smartwatch-3999644/' }
  88  = @{ id = 13610156; author = 'Jason L.';            page = 'https://www.pexels.com/photo/apple-smart-watch-close-up-photo-13610156/' }
  89  = @{ id = 4523030;  author = 'Polina Tankilevitch'; page = 'https://www.pexels.com/photo/back-of-nintendo-switch-on-marble-surface-4523030/' }
  91  = @{ id = 17622520; author = 'Kamil Cicila';        page = 'https://www.pexels.com/photo/xbox-series-x-gamepad-lying-on-a-desk-17622520/' }
  93  = @{ id = 3702458;  author = 'Mike Esparza';        page = 'https://www.pexels.com/photo/black-nintendo-game-boy-on-black-textile-3702458/' }
  94  = @{ id = 14005916; author = 'Alex Andrews';        page = 'https://www.pexels.com/photo/steam-deck-2-handheld-gaming-computer-on-black-surface-14005916/' }
  100 = @{ id = 6704947;  author = 'Sergei Starostin';    page = 'https://www.pexels.com/photo/close-up-of-computer-part-6704947/' }
  107 = @{ id = 2105927;  author = 'Jimmy Chan';          page = 'https://www.pexels.com/photo/chipset-computer-cyber-hardware-2105927/' }
  122 = @{ id = 7596072;  author = 'IT services EU';      page = 'https://www.pexels.com/photo/motherboards-in-close-up-photography-7596072/' }
  129 = @{ id = 4218546;  author = 'Aditya Singh';        page = 'https://www.pexels.com/photo/wifi-router-on-yellow-background-4218546/' }
  130 = @{ id = 29711663; author = 'Jakub Zerdzicki';     page = 'https://www.pexels.com/photo/modern-wireless-router-with-antennas-29711663/' }
  131 = @{ id = 2881227;  author = 'Brett Sayles';        page = 'https://www.pexels.com/photo/close-up-photo-of-network-switch-2881227/' }
}

# productId -> existing product_images.id (from the license backfill)
$imageIds = @{
  1=40527; 2=40528; 3=40529; 4=40530; 6=40552; 7=40531; 10=40532; 11=40533; 13=43058;
  14=40534; 15=40535; 16=40553; 18=40536; 23=43067; 29=40538; 48=43069; 54=40539;
  58=40540; 65=35440; 67=35441; 73=40541; 74=40542; 76=43059; 77=40543; 78=40554;
  79=40544; 80=43060; 81=43061; 83=43070; 84=40545; 85=43062; 88=40546; 89=35442;
  91=43063; 93=40547; 94=40548; 100=40549; 107=43064; 122=43071; 129=43072; 130=43073; 131=43074
}

$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
$W = 900; $H = 675
$ok = 0; $fail = 0

function Get-CroppedBitmap([System.Drawing.Image]$src, [int]$w, [int]$h) {
  $targetRatio = $w / $h
  $srcRatio = $src.Width / $src.Height
  if ($srcRatio -gt $targetRatio) {
    $cropH = $src.Height
    $cropW = [int][math]::Round($src.Height * $targetRatio)
  } else {
    $cropW = $src.Width
    $cropH = [int][math]::Round($src.Width / $targetRatio)
  }
  $x = [int](($src.Width - $cropW) / 2)
  $y = [int](($src.Height - $cropH) / 2)

  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $dest = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
  $source = New-Object System.Drawing.Rectangle($x, $y, $cropW, $cropH)
  $g.DrawImage($src, $dest, $source, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  return $bmp
}

foreach ($prodId in ($map.Keys | Sort-Object)) {
  $item = $map[$prodId]
  $cdn = "https://images.pexels.com/photos/$($item.id)/pexels-photo-$($item.id).jpeg?auto=compress&cs=tinysrgb&w=1400"
  $tmp = Join-Path $env:TEMP "px-$($item.id).jpg"
  $dest = Join-Path $outDir "p$($item.id).jpg"

  try {
    Invoke-WebRequest $cdn -OutFile $tmp -UserAgent $ua -TimeoutSec 40
    $img = [System.Drawing.Image]::FromFile($tmp)
    $bmp = Get-CroppedBitmap $img $W $H
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 84)
    $bmp.Save($dest, $codec, $params)
    $bmp.Dispose(); $img.Dispose()
    Remove-Item $tmp -Force
    $kb = [math]::Round((Get-Item $dest).Length / 1KB, 1)
    Write-Host ("[img] product {0,-3} -> p{1}.jpg  {2} KB" -f $prodId, $item.id, $kb) -ForegroundColor Green
    $ok++
  } catch {
    Write-Host ("[img] product {0,-3} FAILED: {1}" -f $prodId, $_.Exception.Message) -ForegroundColor Red
    $fail++
  }
}

# ---------- attribution SQL ----------
$sqlPath = Join-Path $root 'docs\pexels-image-attribution.sql'
$lines = @('-- Pexels 图片迁移：更新 product_images.url 与授权元数据', '-- 生成时间：' + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), 'START TRANSACTION;')
foreach ($prodId in ($map.Keys | Sort-Object)) {
  $item = $map[$prodId]
  $imgId = $imageIds[$prodId]
  $url = "/products/p$($item.id).jpg"
  $cdn = "https://images.pexels.com/photos/$($item.id)/pexels-photo-$($item.id).jpeg"
  $attr = "图片来自 Pexels，作者 $($item.author)，依据 Pexels License 使用。"
  $lines += "UPDATE product_images SET url='$url' WHERE id=$imgId;"
  $lines += "UPDATE product_image_license SET source='pexels', source_page_url='$($item.page)', original_url='$cdn', license='Pexels License', license_url='https://www.pexels.com/license/', author='$($item.author)', attribution_text='$attr', modifications='裁切为 4:3 并缩放至 900x675', match_type='REFERENCE', risk_notes=NULL, audit_status='APPROVED_WITH_ATTRIBUTION', reviewer='pexels-migration', reviewed_at=NOW() WHERE image_id=$imgId;"
}
$lines += 'COMMIT;'
Set-Content -Path $sqlPath -Value $lines -Encoding UTF8

Write-Host ''
Write-Host "done: ok=$ok fail=$fail" -ForegroundColor Cyan
Write-Host "sql: $sqlPath"
