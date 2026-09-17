<#
  יוצר אייקוני PWA פשוטים (טופס טופסי כלב על רקע חום) עם System.Drawing.
  להריץ פעם אחת; אפשר להחליף באייקונים מעוצבים בהמשך.
#>
Add-Type -AssemblyName System.Drawing

function New-PawIcon {
    param(
        [int]$Size,
        [string]$OutPath,
        [bool]$FullBleed = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 189, 100, 68)) # #bd6444

    if ($FullBleed) {
        $g.FillRectangle($bgBrush, 0, 0, $Size, $Size)
    } else {
        $radius = [int]($Size * 0.22)
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $d = $radius * 2
        $path.AddArc(0, 0, $d, $d, 180, 90)
        $path.AddArc($Size - $d, 0, $d, $d, 270, 90)
        $path.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
        $path.AddArc(0, $Size - $d, $d, $d, 90, 90)
        $path.CloseFigure()
        $g.FillPath($bgBrush, $path)
    }

    $pawBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 250, 245, 238)) # #faf5ee
    $cx = $Size / 2
    $cy = $Size * 0.58
    $padW = $Size * 0.34
    $padH = $Size * 0.26
    $g.FillEllipse($pawBrush, $cx - $padW / 2, $cy - $padH / 2, $padW, $padH)

    $toeR = $Size * 0.12
    $toeOffsetX = $Size * 0.20
    $toeY = $Size * 0.24
    $g.FillEllipse($pawBrush, $cx - $toeOffsetX - $toeR / 2, $toeY, $toeR, $toeR)
    $g.FillEllipse($pawBrush, $cx - $toeOffsetX * 0.35 - $toeR / 2, $toeY - $Size * 0.05, $toeR, $toeR)
    $g.FillEllipse($pawBrush, $cx + $toeOffsetX * 0.35 - $toeR / 2, $toeY - $Size * 0.05, $toeR, $toeR)
    $g.FillEllipse($pawBrush, $cx + $toeOffsetX - $toeR / 2, $toeY, $toeR, $toeR)

    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$iconsDir = Join-Path $PSScriptRoot 'icons'
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

New-PawIcon -Size 192 -OutPath (Join-Path $iconsDir 'icon-192.png') -FullBleed $false
New-PawIcon -Size 512 -OutPath (Join-Path $iconsDir 'icon-512.png') -FullBleed $false
New-PawIcon -Size 512 -OutPath (Join-Path $iconsDir 'icon-maskable-512.png') -FullBleed $true

Write-Output "Icons generated in $iconsDir"
