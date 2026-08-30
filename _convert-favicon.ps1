Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot 'Favicon.jpg'
$outPath = Join-Path $PSScriptRoot 'favicon.png'

$img = [System.Drawing.Image]::FromFile($srcPath)
Write-Output "Imagen original: $($img.Width)x$($img.Height) px"

$size = 180
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Escalar manteniendo la proporcion y centrar en lienzo cuadrado
$scale = [Math]::Min($size / $img.Width, $size / $img.Height)
$w = [int][Math]::Round($img.Width * $scale)
$h = [int][Math]::Round($img.Height * $scale)
$x = [int](($size - $w) / 2)
$y = [int](($size - $h) / 2)
$g.DrawImage($img, $x, $y, $w, $h)

$g.Dispose()
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()

Write-Output "Guardado favicon.png (${size}x${size} px)"