# Rebuild the PNG-backed ICO and Apple icon from the same geometry as public/favicon.svg.
# Uses the Windows drawing library; no external packages or asset downloads.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
[System.IO.Directory]::CreateDirectory($assetDirectory) | Out-Null

function New-BrandBitmap([int] $size) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.ScaleTransform(($size / 64.0), ($size / 64.0))
    $green = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#294c3d'))
    $leafBrush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#a9bb82'))
    $gold = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#e7b65e'))
    $outline = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $outline.AddArc(0, 0, 32, 32, 180, 90)
    $outline.AddArc(32, 0, 32, 32, 270, 90)
    $outline.AddArc(32, 32, 32, 32, 0, 90)
    $outline.AddArc(0, 32, 32, 32, 90, 90)
    $outline.CloseFigure()
    $graphics.FillPath($green, $outline)
    $trail = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $trail.AddBezier(22, 52, 9, 40, 45, 40, 39, 28)
    $trail.AddBezier(39, 28, 36, 22, 25, 23, 29, 14)
    $pen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#f4ebd4'), 7)
    $pen.StartCap = $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawPath($pen, $trail)
    $graphics.FillEllipse($gold, 17, 47, 10, 10)
    $leaf = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $leaf.AddBezier(44, 9, 34, 9, 30, 15, 33, 23)
    $leaf.AddBezier(33, 23, 42, 24, 48, 19, 44, 9)
    $leaf.CloseFigure()
    $graphics.FillPath($leafBrush, $leaf)
    $vein = [System.Drawing.Pen]::new($green.Color, 1.8)
    $vein.StartCap = $vein.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($vein, 34, 22, 41, 14)
    foreach ($resource in @($graphics, $green, $leafBrush, $gold, $outline, $trail, $pen, $leaf, $vein)) { $resource.Dispose() }
    return ,$bitmap
}

$sizes = @(16, 32, 48, 64)
$images = @()
foreach ($size in $sizes) {
    $bitmap = New-BrandBitmap $size
    $stream = [System.IO.MemoryStream]::new()
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += ,$stream.ToArray()
    $bitmap.Dispose()
    $stream.Dispose()
}
$iconStream = [System.IO.MemoryStream]::new()
$writer = [System.IO.BinaryWriter]::new($iconStream)
$writer.Write([uint16]0)
$writer.Write([uint16]1)
$writer.Write([uint16]$sizes.Length)
$offset = 6 + 16 * $sizes.Length
for ($index = 0; $index -lt $sizes.Length; $index++) {
    $writer.Write([byte]$sizes[$index])
    $writer.Write([byte]$sizes[$index])
    $writer.Write([byte]0)
    $writer.Write([byte]0)
    $writer.Write([uint16]1)
    $writer.Write([uint16]32)
    $writer.Write([uint32]$images[$index].Length)
    $writer.Write([uint32]$offset)
    $offset += $images[$index].Length
}
foreach ($bytes in $images) { $writer.Write([byte[]]$bytes) }
$writer.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $assetDirectory 'favicon.ico'), $iconStream.ToArray())
$writer.Dispose()
$iconStream.Dispose()
$apple = New-BrandBitmap 180
$apple.Save((Join-Path $assetDirectory 'apple-touch-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$apple.Dispose()
Write-Output 'Generated favicon.ico (16, 32, 48, 64 px) and apple-touch-icon.png (180 px).'
