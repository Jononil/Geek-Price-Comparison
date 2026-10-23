# ============================================================
# Import Pexels product photos - batch 2 (fill sparse categories)
# ------------------------------------------------------------
# Fills the categories that had no visible products (台式电脑/
# 显示器/固态硬盘) and tops up 手机/笔记本/显卡/CPU/键盘/鼠标/
# 耳机/内存/平板/手表/游戏机/路由器.
#
# Same pipeline as batch 1: download from Pexels CDN, centre-crop
# to 4:3, resize 900x675, then emit SQL for product_images +
# product_image_license.
#
# ASCII only.
# ============================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'frontend\public\products'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

# productId -> @{ id; author; slug }
$map = @{
  5   = @{ id = 782687;   author = 'Dibyajyoti Kabi';        slug = 'close-up-photography-of-an-iphone-782687' }
  8   = @{ id = 12360229; author = 'Mauricio Mascaro';       slug = 'purple-smartphone-on-black-background-12360229' }
  9   = @{ id = 36768426; author = 'Prashant pacific';       slug = 'close-up-of-smartphone-camera-lens-exploration-36768426' }
  12  = @{ id = 238541;   author = 'Marc Mueller';           slug = 'space-gray-iphone-6-238541' }

  17  = @{ id = 8534239;  author = 'Hanna Pad';              slug = 'a-tablet-with-a-blank-screen-8534239' }
  19  = @{ id = 6372973;  author = 'Katrin Bolovtsova';      slug = 'a-tablet-in-close-up-photography-6372973' }
  20  = @{ id = 6373023;  author = 'Katrin Bolovtsova';      slug = 'tablet-with-mockup-blank-screen-on-marble-tray-6373023' }

  21  = @{ id = 4070215;  author = 'Michael Genio';          slug = 'photo-of-black-laptop-4070215' }
  22  = @{ id = 15977087; author = 'Kawe Rodrigues';         slug = 'a-laptop-camera-and-a-graphic-tablet-with-a-pen-lying-on-a-desk-15977087' }
  24  = @{ id = 40057913; author = 'Wolf Art';               slug = 'modern-workspace-with-laptop-and-tablet-40057913' }
  25  = @{ id = 6968164;  author = 'Mikhail Nilov';          slug = 'black-laptop-on-white-table-6968164' }
  26  = @{ id = 16313508; author = 'Kawe Rodrigues';         slug = 'picture-of-newlyweds-on-laptop-screen-16313508' }

  33  = @{ id = 5861327;  author = 'Athena Sandrini';        slug = 'computer-set-up-on-a-desk-5861327' }
  34  = @{ id = 13071305; author = 'Isabella Mendes';        slug = 'illuminated-interior-of-a-computer-tower-13071305' }
  35  = @{ id = 17489151; author = 'panumas nikhomkhai';     slug = 'line-of-pc-towers-17489151' }
  36  = @{ id = 6804098;  author = 'cottonbro studio';       slug = 'close-up-photo-of-a-desktop-computer-6804098' }
  37  = @{ id = 7859348;  author = 'Ron Lach';               slug = 'man-putting-a-glass-cover-on-a-computer-7859348' }

  39  = @{ id = 39694504; author = 'Jakub Zerdzicki';        slug = 'professional-video-editing-studio-setup-39694504' }
  40  = @{ id = 326512;   author = 'Tranmautritam';          slug = 'silver-imac-turned-on-326512' }
  41  = @{ id = 4174077;  author = 'Darsheel Prajapati';     slug = 'computer-monitor-with-black-screen-near-plant-4174077' }
  42  = @{ id = 6476567;  author = 'Mikael Blomkvist';       slug = 'graphic-flashed-on-a-computer-screenclose-up-6476567' }
  43  = @{ id = 17112932; author = 'Salah Darwish';          slug = 'camera-on-monitor-screen-17112932' }

  47  = @{ id = 24602113; author = 'Hert Niks';              slug = 'black-full-cover-headphones-24602113' }
  49  = @{ id = 210927;   author = 'Aleksandar Spasojevic';  slug = 'headphone-headphones-listening-music-music-210927' }
  50  = @{ id = 20385204; author = 'Paul Seling';            slug = 'headphones-with-wire-20385204' }
  51  = @{ id = 2919003;  author = 'Jessica Lewis';          slug = 'black-headphone-2919003' }
  52  = @{ id = 36357088; author = 'Primitive Spaces';       slug = 'professional-studio-headphones-and-microphone-36357088' }

  57  = @{ id = 9020272;  author = 'Nguyen Son Tung';        slug = 'close-up-photo-of-a-black-computer-keyboard-9020272' }
  59  = @{ id = 3829230;  author = 'FOX';                    slug = 'black-and-red-computer-keyboard-3829230' }
  60  = @{ id = 36169777; author = 'Jakub Pabis';            slug = 'close-up-shot-of-keyboard-with-dust-particles-36169777' }
  61  = @{ id = 39508140; author = 'Ossian Jian';            slug = 'close-up-of-retro-mechanical-keyboard-keys-39508140' }

  66  = @{ id = 31018745; author = 'Polat Eyyup Albayrak';   slug = 'modern-gaming-desk-setup-with-rgb-lighting-31018745' }
  68  = @{ id = 35623108; author = 'Sogi';                   slug = 'futuristic-red-gaming-mouse-on-dark-background-35623108' }
  69  = @{ id = 14401665; author = 'Rafael Quaty';           slug = 'wireless-mouse-and-bluetooth-receiver-14401665' }
  70  = @{ id = 9091100;  author = 'Saeed Khokhar';          slug = 'close-up-shot-of-a-wired-mouse-9091100' }

  82  = @{ id = 5237706;  author = 'kaboompics';             slug = 'a-person-wearing-an-apple-watch-5237706' }
  86  = @{ id = 8217430;  author = 'MART PRODUCTION';        slug = 'person-wearing-silver-aluminum-case-apple-watch-with-white-sport-band-8217430' }
  87  = @{ id = 5083216;  author = 'cottonbro studio';       slug = 'person-holding-black-and-silver-digital-device-5083216' }

  90  = @{ id = 14642107; author = 'lance he';               slug = 'xbox-game-console-pad-14642107' }
  92  = @{ id = 12719135; author = 'Roman Odintsov';         slug = 'a-photo-of-red-and-white-xbox-wireless-controllers-12719135' }

  95  = @{ id = 6974258;  author = 'Ro han';                 slug = 'modern-graphics-cards-on-table-6974258' }
  96  = @{ id = 4581902;  author = 'Nana Dua';               slug = 'black-and-silver-sony-speaker-4581902' }
  97  = @{ id = 34552796; author = 'Matheus Bertelli';       slug = 'close-up-of-geforce-rtx-graphics-card-in-pc-34552796' }
  98  = @{ id = 6704936;  author = 'Sergei Starostin';       slug = 'close-up-of-computer-part-6704936' }

  105 = @{ id = 6636463;  author = 'Sergei Starostin';       slug = 'central-processor-of-a-computer-6636463' }
  106 = @{ id = 1432673;  author = 'Pok Rie';                slug = 'selective-focus-photography-of-motherboard-1432673' }
  108 = @{ id = 1432675;  author = 'Pok Rie';                slug = 'dell-motherboard-and-central-processing-unit-1432675' }
  109 = @{ id = 1432680;  author = 'Pok Rie';                slug = 'closed-up-photo-of-black-dell-central-processing-unit-1432680' }

  113 = @{ id = 11216304; author = 'Keifer Costa';           slug = 'black-samsung-solid-state-drive-on-white-surface-11216304' }
  114 = @{ id = 35984425; author = 'Przemek Lesniewski';     slug = 'close-up-of-lexar-nvme-ssd-on-circuit-board-35984425' }
  115 = @{ id = 4675007;  author = 'Nothing Ahead';          slug = 'close-up-of-a-usb-hard-drive-4675007' }
  116 = @{ id = 5335964;  author = 'thiago japyassu';        slug = 'sandisk-extreme-portable-external-solid-state-drive-5335964' }
  117 = @{ id = 35147150; author = 'Andrey Matveev';         slug = 'modern-and-vintage-data-storage-solutions-35147150' }

  121 = @{ id = 7594824;  author = 'IT services EU';         slug = 'memory-cards-on-a-white-surface-7594824' }
  123 = @{ id = 2588757;  author = 'Valentine Tanasovich';   slug = 'black-and-gray-computer-motherboard-2588757' }
  124 = @{ id = 37113175; author = 'Marta Branco';           slug = 'close-up-of-cpu-and-ram-sticks-on-white-background-37113175' }
  125 = @{ id = 6636474;  author = 'Sergei Starostin';       slug = 'green-and-black-computer-ram-stick-6636474' }

  127 = @{ id = 18071864; author = 'Jaycee300s';             slug = 'a-router-a-monitor-and-incense-sticks-18071864' }
  128 = @{ id = 28348054; author = 'Jakub Zerdzicki';        slug = 'smart-home-wireless-network-router-device-28348054' }
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
    if (-not (Test-Path $dest)) {
      Invoke-WebRequest $cdn -OutFile $tmp -UserAgent $ua -TimeoutSec 40
      $img = [System.Drawing.Image]::FromFile($tmp)
      $bmp = Get-CroppedBitmap $img $W $H
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 84)
      $bmp.Save($dest, $codec, $params)
      $bmp.Dispose(); $img.Dispose(); Remove-Item $tmp -Force
    }
    Write-Host ("[img] product {0,-4} -> p{1}.jpg" -f $prodId, $item.id) -ForegroundColor Green
    $ok++
  } catch {
    Write-Host ("[img] product {0,-4} FAILED: {1}" -f $prodId, $_.Exception.Message) -ForegroundColor Red
    $fail++
  }
}

# ---------- SQL ----------
$sqlPath = Join-Path $root 'docs\pexels-image-batch2.sql'
$lines = @('START TRANSACTION;')
foreach ($prodId in ($map.Keys | Sort-Object)) {
  $item = $map[$prodId]
  $url = "/products/p$($item.id).jpg"
  $cdn = "https://images.pexels.com/photos/$($item.id)/pexels-photo-$($item.id).jpeg"
  $page = "https://www.pexels.com/photo/$($item.slug)/"
  $attr = "图片来自 Pexels，作者 $($item.author)，依据 Pexels License 使用。"

  $lines += "UPDATE product_images SET url='$url' WHERE product_id=$prodId AND url LIKE '%placehold.co%';"
  $lines += "INSERT INTO product_image_license (image_id, source, source_page_url, original_url, license, license_url, author, attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at)" +
            " SELECT pi.id, 'pexels', '$page', '$cdn', 'Pexels License', 'https://www.pexels.com/license/', '$($item.author)', '$attr', '裁切为 4:3 并缩放至 900x675', 'REFERENCE', 'APPROVED_WITH_ATTRIBUTION', 'pexels-migration', NOW()" +
            " FROM product_images pi WHERE pi.product_id=$prodId AND pi.url='$url'" +
            " AND NOT EXISTS (SELECT 1 FROM product_image_license l WHERE l.image_id=pi.id);"
}
$lines += 'COMMIT;'
Set-Content -Path $sqlPath -Value $lines -Encoding UTF8

Write-Host ''
Write-Host "done: ok=$ok fail=$fail"
Write-Host "sql: $sqlPath"
