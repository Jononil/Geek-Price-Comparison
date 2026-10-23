@echo off
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -N -B geek_price < "E:/第三学期/Geek Price Comparison/verification/product-catalog-expansion-20261012/_raw/pn.sql" > "E:/第三学期/Geek Price Comparison/verification/product-catalog-expansion-20261012/_raw/pn.out" 2> "E:/第三学期/Geek Price Comparison/verification/product-catalog-expansion-20261012/_raw/pn.err"
exit /b %ERRORLEVEL%
