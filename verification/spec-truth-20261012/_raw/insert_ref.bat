@echo off
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -h 127.0.0.1 -u root -p123456 --default-character-set=utf8mb4 -D geek_price -N -B < "E:/第三学期/Geek Price Comparison/verification/spec-truth-20261012/_raw/insert_ref.sql" > "E:/第三学期/Geek Price Comparison/verification/spec-truth-20261012/_raw/insert_ref.out" 2> "E:/第三学期/Geek Price Comparison/verification/spec-truth-20261012/_raw/insert_ref.err"
exit /b %ERRORLEVEL%
