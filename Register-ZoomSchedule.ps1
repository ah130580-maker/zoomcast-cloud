param(
    [string]$ConfigPath = "$PSScriptRoot\config.json"
)

if (-not (Test-Path $ConfigPath)) {
    Write-Error "Config file not found: $ConfigPath"
    exit 1
}

$Config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
$RunnerScript = Join-Path $PSScriptRoot "Run-ZoomMeeting.ps1"
$TaskCommand = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Minimized -File `"$RunnerScript`""

$Slots = @(
    @{ Index = 1; Enabled = [bool]$Config.Schedule1Enabled; Time = [string]$Config.Schedule1Time },
    @{ Index = 2; Enabled = [bool]$Config.Schedule2Enabled; Time = [string]$Config.Schedule2Time },
    @{ Index = 3; Enabled = [bool]$Config.Schedule3Enabled; Time = [string]$Config.Schedule3Time }
)

foreach ($Slot in $Slots) {
    $TaskName = "ZoomAutoBroadcaster_Slot$($Slot.Index)"
    if ($Slot.Enabled -and ($Slot.Time -match "^\d{2}:\d{2}$")) {
        Write-Host "Registering Daily Task '$TaskName' at $($Slot.Time)..."
        & schtasks.exe /Create /SC DAILY /TN $TaskName /TR $TaskCommand /ST $Slot.Time /F | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " -> Successfully scheduled '$TaskName' for $($Slot.Time) daily." -ForegroundColor Green
        } else {
            Write-Host " -> Warning: Failed to register '$TaskName' via schtasks." -ForegroundColor Yellow
        }
    } else {
        # Remove task if disabled
        & schtasks.exe /Query /TN $TaskName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Removing disabled task '$TaskName'..."
            & schtasks.exe /Delete /TN $TaskName /F | Out-Null
        }
    }
}
