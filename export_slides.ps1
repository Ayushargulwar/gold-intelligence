$pptApp = New-Object -ComObject PowerPoint.Application
$pptFile = "C:\Users\ayush\.gemini\antigravity\scratch\gold-intelligence\Gold_Intelligence_HackInHills26.pptx"
$outDir = "C:\Users\ayush\.gemini\antigravity\scratch\gold-intelligence\ppt_assets\rendered_slides"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }
$pres = $pptApp.Presentations.Open($pptFile, 1, 0, 0)
$pres.Export($outDir, "PNG", 1920, 1080)
$pres.Close()
$pptApp.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($pptApp) | Out-Null
Write-Host "Slides exported successfully to $outDir"
