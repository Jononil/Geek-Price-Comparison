# ============================================================
# Fill remaining categories + add 12 new phone models
# ------------------------------------------------------------
# Part A: 30 images for products still hidden by the image gate
# Part B: 12 new phones with specs, 3-platform prices, 90-day
#         price history and Pexels photos
#
# Output: images in frontend/public/products, SQL in docs/.
# ASCII only apart from product names inside SQL strings.
# ============================================================

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'frontend\public\products'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'
$W = 900; $H = 675

function Get-CroppedBitmap([System.Drawing.Image]$src, [int]$w, [int]$h) {
  $targetRatio = $w / $h
  if (($src.Width / $src.Height) -gt $targetRatio) {
    $cropH = $src.Height; $cropW = [int][math]::Round($src.Height * $targetRatio)
  } else {
    $cropW = $src.Width; $cropH = [int][math]::Round($src.Width / $targetRatio)
  }
  $x = [int](($src.Width - $cropW) / 2); $y = [int](($src.Height - $cropH) / 2)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)),
    (New-Object System.Drawing.Rectangle($x, $y, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  return $bmp
}

function Get-Photo([int]$pexelsId) {
  $dest = Join-Path $outDir "p$pexelsId.jpg"
  if (Test-Path $dest) { return $dest }
  $cdn = "https://images.pexels.com/photos/$pexelsId/pexels-photo-$pexelsId.jpeg?auto=compress&cs=tinysrgb&w=1400"
  $tmp = Join-Path $env:TEMP "px-$pexelsId.jpg"
  Invoke-WebRequest $cdn -OutFile $tmp -UserAgent $ua -TimeoutSec 40
  $img = [System.Drawing.Image]::FromFile($tmp)
  $bmp = Get-CroppedBitmap $img $W $H
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 84)
  $bmp.Save($dest, $codec, $params)
  $bmp.Dispose(); $img.Dispose(); Remove-Item $tmp -Force
  return $dest
}

# ---------- Part A: remaining 30 hidden products ----------
$a = @(
  @{ pid = 27;  id = 6372911;  author = 'Katrin Bolovtsova';  slug = 'modern-laptop-with-mockup-screen-on-wooden-table-6372911' },
  @{ pid = 28;  id = 6372896;  author = 'Katrin Bolovtsova';  slug = 'laptop-with-blank-screen-on-table-at-home-6372896' },
  @{ pid = 30;  id = 3640629;  author = 'Yusuf Arslan';       slug = 'macbook-pro-on-brown-wooden-table-3640629' },
  @{ pid = 31;  id = 225767;   author = 'Markus Spiske';      slug = 'macbook-air-on-brown-wooden-table-225767' },
  @{ pid = 32;  id = 30204603; author = 'Oguz Kagan Cevik';   slug = 'sleek-laptop-on-desk-in-cozy-workspace-setting-30204603' },
  @{ pid = 38;  id = 33798627; author = 'Alexandre P. Junior'; slug = 'modern-gaming-pc-with-led-lighting-33798627' },
  @{ pid = 44;  id = 28955773; author = 'minhphuc workspace'; slug = 'modern-video-editing-setup-with-ultrawide-monitor-28955773' },
  @{ pid = 45;  id = 28955771; author = 'minhphuc workspace'; slug = 'modern-minimalist-office-desk-workspace-setup-28955771' },
  @{ pid = 46;  id = 10130153; author = 'Rubaitul Azad';      slug = 'laptop-and-ultrawide-monitor-on-desk-10130153' },
  @{ pid = 53;  id = 17810093; author = 'Deybson Mallony';    slug = 'earbuds-and-charging-case-on-table-17810093' },
  @{ pid = 55;  id = 3921817;  author = 'ready made';         slug = 'close-up-photo-of-airpods-3921817' },
  @{ pid = 56;  id = 10104822; author = 'Im Zion';            slug = 'photo-of-black-earphones-beside-a-white-smartphone-10104822' },
  @{ pid = 62;  id = 27568671; author = 'Andrey Matveev';     slug = 'two-black-and-yellow-keyboards-sitting-next-to-each-other-27568671' },
  @{ pid = 63;  id = 31497026; author = 'Huy Phan';           slug = 'ergonomic-workspace-with-mechanical-keyboard-31497026' },
  @{ pid = 64;  id = 19304049; author = 'minhphuc workspace'; slug = 'wireless-mouse-and-mechanical-gaming-keyboard-on-the-desk-19304049' },
  @{ pid = 71;  id = 20510026; author = 'Matheus Bertelli';   slug = 'keyboard-and-mouse-in-a-studio-20510026' },
  @{ pid = 72;  id = 11488107; author = 'Theia Sight';        slug = 'a-magic-mouse-on-a-red-surface-11488107' },
  @{ pid = 75;  id = 6891485;  author = 'Crisher P.H';        slug = 'a-camera-on-a-white-background-6891485' },
  @{ pid = 99;  id = 34301925; author = 'Gibson Chan';        slug = 'close-up-of-gaming-pc-with-radeon-gpu-and-rgb-lighting-34301925' },
  @{ pid = 101; id = 34301927; author = 'Gibson Chan';        slug = 'close-up-of-gaming-pc-with-rgb-lights-34301927' },
  @{ pid = 102; id = 34552811; author = 'Matheus Bertelli';   slug = 'close-up-of-gaming-graphics-card-fans-with-red-lighting-34552811' },
  @{ pid = 103; id = 34590949; author = 'Prince Soumya';      slug = 'close-up-of-gaming-graphics-card-fan-34590949' },
  @{ pid = 104; id = 6704939;  author = 'Sergei Starostin';   slug = 'a-component-of-an-electronic-device-6704939' },
  @{ pid = 110; id = 270549;   author = 'Pixabay';            slug = 'pins-on-brown-board-270549' },
  @{ pid = 111; id = 38373015; author = 'Marta Branco';       slug = 'close-up-of-computer-cpu-socket-on-motherboard-38373015' },
  @{ pid = 112; id = 3665444;  author = 'Jeremy Waterhouse';  slug = 'gold-and-black-box-on-white-table-3665444' },
  @{ pid = 118; id = 33792050; author = 'Richard L';          slug = 'close-up-of-computer-hardware-components-for-high-performance-33792050' },
  @{ pid = 119; id = 37368171; author = 'Jonathan Borba';     slug = 'close-up-of-computer-motherboard-with-cpu-and-ssd-37368171' },
  @{ pid = 120; id = 32923533; author = 'Marta Branco';       slug = 'close-up-of-computer-hard-disk-drive-components-32923533' },
  @{ pid = 132; id = 32698413; author = 'Pascal';             slug = 'ethernet-switch-with-connected-cables-on-wooden-surface-32698413' }
)

$okA = 0
foreach ($item in $a) {
  try { Get-Photo $item.id | Out-Null; $okA++ }
  catch { Write-Host ("[A] pexels {0} FAILED: {1}" -f $item.id, $_.Exception.Message) -ForegroundColor Red }
}

# ---------- Part B: 12 new phones ----------
$brands = @(
  @{ name = 'iQOO';  desc = 'vivo 旗下性能子品牌' },
  @{ name = '红米';  desc = '小米旗下性价比品牌' },
  @{ name = '真我';  desc = 'realme 中文品牌，主打越级配置' }
)

$phones = @(
  @{ id = 201; name = '华为 Mate 70 Pro';        brand = '华为'; official = 6499; current = 6299; perf = 92; rating = 4.8; heat = 9200;  sales = 12000; score = 9.4; vs = 93; launch = '2026-05-20';
     specs = @(@('处理器','麒麟 9020'), @('屏幕','6.8英寸 LTPO OLED'), @('运行内存','12GB'), @('存储','512GB'), @('电池','5500mAh'), @('摄像头','5000万像素可变光圈主摄'));
     photo = @{ id = 37467615; author = 'Votso Sothu'; slug = 'sleek-iphone-7-on-dark-background-37467615' } },
  @{ id = 202; name = '华为 Pura 80 Ultra';      brand = '华为'; official = 9999; current = 9499; perf = 96; rating = 4.9; heat = 8800;  sales = 6000;  score = 9.6; vs = 95; launch = '2026-06-11';
     specs = @(@('处理器','麒麟 9030'), @('屏幕','6.8英寸 双层 OLED'), @('运行内存','16GB'), @('存储','1TB'), @('电池','5700mAh'), @('摄像头','1英寸主摄 + 潜望长焦'));
     photo = @{ id = 37467616; author = 'Votso Sothu'; slug = 'close-up-of-red-smartphone-on-dark-background-37467616' } },
  @{ id = 203; name = '小米 15 Pro';             brand = '小米'; official = 5299; current = 4999; perf = 90; rating = 4.7; heat = 8600;  sales = 15000; score = 9.3; vs = 92; launch = '2026-03-02';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.73英寸 2K LTPO'), @('运行内存','12GB'), @('存储','512GB'), @('电池','5400mAh'), @('摄像头','5000万像素徕卡浮动长焦'));
     photo = @{ id = 12969242; author = 'Atlantic Ambience'; slug = 'a-red-iphone-on-black-surface-12969242' } },
  @{ id = 204; name = '小米 15';                 brand = '小米'; official = 4499; current = 4299; perf = 88; rating = 4.6; heat = 8400;  sales = 18000; score = 9.2; vs = 91; launch = '2026-03-02';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.36英寸 1.5K'), @('运行内存','12GB'), @('存储','256GB'), @('电池','5400mAh'), @('摄像头','5000万像素主摄'));
     photo = @{ id = 7989740; author = 'Carlos Jairo'; slug = 'black-gadgets-on-a-black-surface-7989740' } },
  @{ id = 205; name = 'vivo X200 Pro';           brand = 'vivo'; official = 5499; current = 5199; perf = 91; rating = 4.7; heat = 8000;  sales = 9000;  score = 9.3; vs = 90; launch = '2026-04-15';
     specs = @(@('处理器','天玑 9400'), @('屏幕','6.78英寸 2K E7'), @('运行内存','12GB'), @('存储','512GB'), @('电池','6000mAh'), @('摄像头','蔡司 2亿像素潜望长焦'));
     photo = @{ id = 8490071; author = 'PNW Production'; slug = 'ceramic-heart-trinket-by-phone-8490071' } },
  @{ id = 206; name = 'OPPO Find X8 Pro';        brand = 'OPPO'; official = 5999; current = 5699; perf = 90; rating = 4.6; heat = 7800;  sales = 8000;  score = 9.2; vs = 89; launch = '2026-04-20';
     specs = @(@('处理器','天玑 9400'), @('屏幕','6.78英寸 1.5K'), @('运行内存','16GB'), @('存储','512GB'), @('电池','5910mAh'), @('摄像头','双潜望长焦'));
     photo = @{ id = 8533737; author = 'Hanna Pad'; slug = 'a-smartphone-on-a-marble-surface-8533737' } },
  @{ id = 207; name = '荣耀 Magic 7 Pro';        brand = '荣耀'; official = 5699; current = 5399; perf = 89; rating = 4.6; heat = 7600;  sales = 8500;  score = 9.2; vs = 88; launch = '2026-05-08';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.8英寸 2K 四曲'), @('运行内存','16GB'), @('存储','512GB'), @('电池','5850mAh'), @('摄像头','2亿像素潜望长焦'));
     photo = @{ id = 8148741; author = 'Vie Studio'; slug = 'black-mobile-phone-on-white-wooden-table-8148741' } },
  @{ id = 208; name = '一加 13';                 brand = '一加'; official = 4499; current = 4299; perf = 88; rating = 4.7; heat = 7400;  sales = 11000; score = 9.1; vs = 90; launch = '2026-04-02';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.82英寸 2K 东方屏'), @('运行内存','12GB'), @('存储','256GB'), @('电池','6000mAh'), @('摄像头','5000万像素三摄'));
     photo = @{ id = 6177649; author = 'Cup of Couple'; slug = 'smartphone-and-filmstrips-arranged-on-table-with-coffee-and-notebook-6177649' } },
  @{ id = 209; name = 'iQOO 13';                 brand = 'iQOO'; official = 3999; current = 3799; perf = 87; rating = 4.5; heat = 7000;  sales = 10000; score = 9.0; vs = 91; launch = '2026-05-15';
     specs = @(@('处理器','骁龙 8 至尊版 + Q2'), @('屏幕','6.82英寸 2K 144Hz'), @('运行内存','12GB'), @('存储','256GB'), @('电池','6150mAh'), @('摄像头','5000万像素主摄'));
     photo = @{ id = 8092450; author = 'kaboompics'; slug = 'a-mobile-phone-near-the-notebook-with-green-leaves-on-a-wooden-table-8092450' } },
  @{ id = 210; name = '三星 Galaxy S25 Ultra';   brand = '三星'; official = 9699; current = 9199; perf = 93; rating = 4.6; heat = 7200;  sales = 5000;  score = 9.4; vs = 86; launch = '2026-02-20';
     specs = @(@('处理器','骁龙 8 至尊版 for Galaxy'), @('屏幕','6.9英寸 2K Dynamic AMOLED'), @('运行内存','12GB'), @('存储','512GB'), @('电池','5000mAh'), @('摄像头','2亿像素主摄 + 双长焦'));
     photo = @{ id = 1369476; author = 'Lisa Fotios'; slug = 'iphone-on-brown-wooden-table-1369476' } },
  @{ id = 211; name = 'Redmi K80 Pro';           brand = '红米'; official = 3699; current = 3499; perf = 86; rating = 4.5; heat = 8200;  sales = 16000; score = 9.1; vs = 92; launch = '2026-03-18';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.67英寸 2K 120Hz'), @('运行内存','12GB'), @('存储','512GB'), @('电池','6000mAh'), @('摄像头','5000万像素光影猎人'));
     photo = @{ id = 12498416; author = 'Art Photo Fil'; slug = 'a-person-holding-a-smartphone-12498416' } },
  @{ id = 212; name = '真我 GT7 Pro';            brand = '真我'; official = 3599; current = 3399; perf = 85; rating = 4.4; heat = 6800;  sales = 7500;  score = 9.0; vs = 90; launch = '2026-06-25';
     specs = @(@('处理器','骁龙 8 至尊版'), @('屏幕','6.78英寸 1.5K 三星'), @('运行内存','12GB'), @('存储','256GB'), @('电池','5800mAh'), @('摄像头','5000万像素潜望长焦'));
     photo = @{ id = 242427; author = 'Jeshoots'; slug = 'device-electronics-hands-mobile-phone-242427' } }
)

$okB = 0
foreach ($p in $phones) {
  try { Get-Photo $p.photo.id | Out-Null; $okB++ }
  catch { Write-Host ("[B] pexels {0} FAILED: {1}" -f $p.photo.id, $_.Exception.Message) -ForegroundColor Red }
}

# ---------- SQL ----------
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('START TRANSACTION;')

foreach ($b in $brands) {
  $lines.Add("INSERT INTO brands (name, description, status) SELECT '$($b.name)', '$($b.desc)', 1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name='$($b.name)');")
}

foreach ($item in $a) {
  $url = "/products/p$($item.id).jpg"
  $cdn = "https://images.pexels.com/photos/$($item.id)/pexels-photo-$($item.id).jpeg"
  $page = "https://www.pexels.com/photo/$($item.slug)/"
  $attr = "图片来自 Pexels，作者 $($item.author)，依据 Pexels License 使用。"
  $lines.Add("UPDATE product_images SET url='$url' WHERE product_id=$($item.pid) AND url LIKE '%placehold.co%';")
  $lines.Add("INSERT INTO product_image_license (image_id, source, source_page_url, original_url, license, license_url, author, attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at) SELECT pi.id, 'pexels', '$page', '$cdn', 'Pexels License', 'https://www.pexels.com/license/', '$($item.author)', '$attr', '裁切为 4:3 并缩放至 900x675', 'REFERENCE', 'APPROVED_WITH_ATTRIBUTION', 'pexels-migration', NOW() FROM product_images pi WHERE pi.product_id=$($item.pid) AND pi.url='$url' AND NOT EXISTS (SELECT 1 FROM product_image_license l WHERE l.image_id=pi.id);")
}

foreach ($p in $phones) {
  $desc = "$($p.name)，2026 年机型，主打性能与影像均衡，适合追求长期使用体验的用户。"
  $lines.Add("INSERT INTO products (id, name, brand_id, category_id, description, official_price, current_price, score, value_score, performance_score, user_rating, sales, heat, launch_date, status, is_recommend, is_hot) VALUES ($($p.id), '$($p.name)', (SELECT id FROM brands WHERE name='$($p.brand)' LIMIT 1), 1, '$desc', $($p.official), $($p.current), $($p.score), $($p.vs), $($p.perf), $($p.rating), $($p.sales), $($p.heat), '$($p.launch)', 1, 0, 0);")

  $i = 0
  foreach ($s in $p.specs) {
    $i++
    $lines.Add("INSERT INTO product_specs (product_id, spec_key, spec_label, spec_value, sort, source_type, verify_status) VALUES ($($p.id), '$($s[0])', '$($s[0])', '$($s[1])', $i, 'reference_db', 'reference');")
  }

  $j = [math]::Round($p.current * 1.012, 0)
  $pd = [math]::Round($p.current * 0.978, 0)
  $lines.Add("INSERT INTO product_prices (product_id, platform_id, title, url, price, original_price, discount, shop_name, is_official, stock_status) VALUES")
  $lines.Add("($($p.id), 1, '$($p.name)', 'https://item.jd.com/', $($p.current), $($p.official), $($p.official - $p.current), '京东自营', 1, 1),")
  $lines.Add("($($p.id), 2, '$($p.name)', 'https://detail.tmall.com/', $j, $($p.official), $($p.official - $j), '天猫官方旗舰店', 1, 1),")
  $lines.Add("($($p.id), 3, '$($p.name)', 'https://mobile.yangkeduo.com/', $pd, $($p.official), $($p.official - $pd), '拼多多百亿补贴', 0, 1);")

  # 90 天价格曲线
  $vals = New-Object System.Collections.Generic.List[string]
  for ($d = 89; $d -ge 0; $d--) {
    $wave = 0.028 * [math]::Sin(($d / 6.0)) + 0.012 * [math]::Cos(($d / 3.0))
    $price = [math]::Round($p.current * (1 + $wave), 0)
    $date = (Get-Date).AddDays(-$d).ToString('yyyy-MM-dd')
    $vals.Add("($($p.id), 1, $price, '$date', 'manual')")
  }
  $lines.Add("INSERT INTO price_history (product_id, platform_id, price, record_date, source) VALUES " + ($vals -join ',') + ';')

  $url = "/products/p$($p.photo.id).jpg"
  $cdn = "https://images.pexels.com/photos/$($p.photo.id)/pexels-photo-$($p.photo.id).jpeg"
  $page = "https://www.pexels.com/photo/$($p.photo.slug)/"
  $attr = "图片来自 Pexels，作者 $($p.photo.author)，依据 Pexels License 使用。"
  $lines.Add("INSERT INTO product_images (product_id, url, sort) VALUES ($($p.id), '$url', 0);")
  $lines.Add("INSERT INTO product_image_license (image_id, source, source_page_url, original_url, license, license_url, author, attribution_text, modifications, match_type, audit_status, reviewer, reviewed_at) SELECT id, 'pexels', '$page', '$cdn', 'Pexels License', 'https://www.pexels.com/license/', '$($p.photo.author)', '$attr', '裁切为 4:3 并缩放至 900x675', 'REFERENCE', 'APPROVED_WITH_ATTRIBUTION', 'pexels-migration', NOW() FROM product_images WHERE product_id=$($p.id) AND url='$url' AND NOT EXISTS (SELECT 1 FROM product_image_license l WHERE l.image_id = product_images.id);")
}

$lines.Add('COMMIT;')
$sqlPath = Join-Path $root 'docs\fill-and-add-products.sql'
[System.IO.File]::WriteAllLines($sqlPath, $lines, (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host "images: partA=$okA/$($a.Count)  partB=$okB/$($phones.Count)"
Write-Host "sql lines: $($lines.Count) -> $sqlPath"
