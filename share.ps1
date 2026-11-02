# DP Hire - Share Tool for PowerShell
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  DP HIRE - AI Recruitment Platform (DataPage)" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Server in background if not running
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[1/2] Starting DP Hire Server on port 5000..." -ForegroundColor Yellow
    Start-Process -FilePath "node" -ArgumentList "server/standaloneServer.js" -WindowStyle Normal
    Start-Sleep -Seconds 2
} else {
    Write-Host "[1/2] DP Hire Server is already running on port 5000." -ForegroundColor Green
}

# 2. Print Local LAN links
Write-Host ""
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "OPTION A: Local Wi-Fi Link (If colleague is on the same office Wi-Fi)" -ForegroundColor Green
Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp,Manual -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*") {
        Write-Host "  http://$($_.IPAddress):5000" -ForegroundColor White
    }
}
Write-Host "---------------------------------------------------------------" -ForegroundColor DarkGray

# 3. Create Public Internet Tunnel
Write-Host ""
Write-Host "OPTION B: Generating Public Internet HTTPS Link..." -ForegroundColor Green
Write-Host "(Please wait 5-10 seconds for the URL to generate)" -ForegroundColor DarkGray
Write-Host ""

& npx.cmd -y untun tunnel --port 5000
