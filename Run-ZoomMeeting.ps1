param(
    [string]$ConfigPath = "$PSScriptRoot\config.json",
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

# Load required .NET Assemblies
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName PresentationCore
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName WindowsBase

# Win32 API Helper for Window Management
$Win32Code = @"
using System;
using System.Runtime.InteropServices;

public class Win32Helper {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);
}
"@
Add-Type -TypeDefinition $Win32Code -ErrorAction SilentlyContinue

# Setup Logging
$LogDir = Join-Path $PSScriptRoot "logs"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
}
$LogFile = Join-Path $LogDir "automation.log"

function Write-AutomationLog {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $Line = "[$Timestamp] [$Level] $Message"
    Write-Host $Line
    Add-Content -Path $LogFile -Value $Line -ErrorAction SilentlyContinue
}

function Get-VideoDurationSeconds {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) {
        return 0
    }
    try {
        $Shell = New-Object -ComObject Shell.Application
        $Folder = Split-Path $FilePath -Parent
        $File = Split-Path $FilePath -Leaf
        $ShellFolder = $Shell.Namespace($Folder)
        $ShellFile = $ShellFolder.ParseName($File)
        # Property index 27 is Length/Duration on Windows
        $DurationStr = $ShellFolder.GetDetailsOf($ShellFile, 27)
        if ($DurationStr -match "(\d+):(\d+):(\d+)") {
            $Hours = [int]$Matches[1]
            $Minutes = [int]$Matches[2]
            $Seconds = [int]$Matches[3]
            return ($Hours * 3600) + ($Minutes * 60) + $Seconds
        }
    } catch {
        Write-AutomationLog "Could not read Shell metadata duration: $_" "WARN"
    }
    return 0
}

function ConvertTo-ZoomProtocolUri {
    param(
        [string]$MeetingUrl,
        [string]$MeetingId,
        [string]$Passcode
    )
    $CleanId = ($MeetingId -replace "\s+", "") -replace "-", ""
    $CleanPwd = $Passcode

    if (-not [string]::IsNullOrWhiteSpace($MeetingUrl)) {
        if ($MeetingUrl -match "^zoommtg://") {
            return $MeetingUrl
        }
        # Extract meeting ID from https://...zoom.us/j/1234567890?pwd=xyz
        if ($MeetingUrl -match "/j/(\d+)") {
            $CleanId = $Matches[1]
        }
        if ($MeetingUrl -match "[?&]pwd=([^&]+)") {
            $CleanPwd = $Matches[1]
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($CleanId)) {
        $Uri = "zoommtg://zoom.us/join?action=join&confno=$CleanId"
        if (-not [string]::IsNullOrWhiteSpace($CleanPwd)) {
            $Uri += "&pwd=$CleanPwd"
        }
        return $Uri
    }

    return $MeetingUrl
}

function Get-ZoomElements {
    $Elements = @()
    $ZoomProcs = Get-Process -Name "Zoom" -ErrorAction SilentlyContinue
    if (-not $ZoomProcs) { return $Elements }

    $Root = [System.Windows.Automation.AutomationElement]::RootElement
    foreach ($Proc in $ZoomProcs) {
        try {
            $Cond = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::ProcessIdProperty,
                $Proc.Id
            )
            $Found = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $Cond)
            foreach ($El in $Found) {
                $Elements += $El
            }
        } catch {}
    }
    return $Elements
}

function Invoke-UiaButtonByName {
    param(
        [string[]]$ButtonNames,
        [switch]$PartialMatch
    )
    $ZoomWindows = Get-ZoomElements
    $BtnCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Button
    )

    foreach ($Win in $ZoomWindows) {
        try {
            $Buttons = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $BtnCondition)
            foreach ($Btn in $Buttons) {
                $Name = $Btn.Current.Name
                if ([string]::IsNullOrWhiteSpace($Name)) { continue }
                foreach ($Target in $ButtonNames) {
                    $Matched = $false
                    if ($PartialMatch) {
                        if ($Name -like "*$Target*") { $Matched = $true }
                    } else {
                        if ($Name -ieq $Target) { $Matched = $true }
                    }
                    if ($Matched) {
                        $PatternObj = $null
                        if ($Btn.TryGetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern, [ref]$PatternObj)) {
                            $PatternObj.Invoke()
                            Write-AutomationLog "Clicked Zoom UI Button: '$Name'"
                            return $true
                        }
                    }
                }
            }
        } catch {}
    }
    return $false
}

function Set-UiaCheckboxByName {
    param(
        [string[]]$CheckboxNames,
        [bool]$DesiredState = $true
    )
    $ZoomWindows = Get-ZoomElements
    $ChkCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::CheckBox
    )

    foreach ($Win in $ZoomWindows) {
        try {
            $Checkboxes = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $ChkCondition)
            foreach ($Chk in $Checkboxes) {
                $Name = $Chk.Current.Name
                if ([string]::IsNullOrWhiteSpace($Name)) { continue }
                foreach ($Target in $CheckboxNames) {
                    if ($Name -like "*$Target*") {
                        $ToggleObj = $null
                        if ($Chk.TryGetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern, [ref]$ToggleObj)) {
                            $CurrentState = $ToggleObj.Current.ToggleState
                            $IsChecked = ($CurrentState -eq [System.Windows.Automation.ToggleState]::On)
                            if ($IsChecked -ne $DesiredState) {
                                $ToggleObj.Toggle()
                                Write-AutomationLog "Toggled Zoom Checkbox '$Name' to $DesiredState"
                            } else {
                                Write-AutomationLog "Zoom Checkbox '$Name' is already $DesiredState"
                            }
                            return $true
                        }
                    }
                }
            }
        } catch {}
    }
    return $false
}

function Invoke-ZoomAutoAdmit {
    # Clicks 'Admit All' or 'Admit' if any participant is waiting in the Waiting Room
    $Clicked = Invoke-UiaButtonByName -ButtonNames @("Admit All", "Admit all", "Admit")
    return $Clicked
}

$Script:PromotedCoHosts = @{}

function Invoke-ZoomAutoCoHost {
    param([string[]]$VipEmails)
    if (-not $VipEmails -or $VipEmails.Count -eq 0) { return }
    $ZoomWindows = Get-ZoomElements
    foreach ($Email in $VipEmails) {
        if ([string]::IsNullOrWhiteSpace($Email)) { continue }
        $CleanTarget = $Email.Trim()
        if ($Script:PromotedCoHosts.ContainsKey($CleanTarget)) { continue }
        # Also match the prefix before @ in case participant joined with their display name
        $NamePrefix = ($CleanTarget -split "@")[0]

        foreach ($Win in $ZoomWindows) {
            try {
                $AllCondition = [System.Windows.Automation.Condition]::TrueCondition
                $Descendants = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $AllCondition)
                foreach ($El in $Descendants) {
                    $ElName = $El.Current.Name
                    if ([string]::IsNullOrWhiteSpace($ElName)) { continue }
                    if ($ElName -like "*$CleanTarget*" -or ($NamePrefix.Length -ge 3 -and $ElName -like "*$NamePrefix*")) {
                        # Attempt to click 'More' -> 'Make Co-Host' if visible in Participants panel
                        $MadeCoHost = Invoke-UiaButtonByName -ButtonNames @("Make Co-Host", "Make co-host")
                        $Script:PromotedCoHosts[$CleanTarget] = (Get-Date).ToString("HH:mm:ss")
                        Write-AutomationLog "Detected VIP user '$CleanTarget' in meeting -> Triggered Auto Co-Host promotion!"
                        break
                    }
                }
            } catch {}
        }
    }
}

function Focus-ZoomMeetingWindow {
    $ZoomProcs = Get-Process -Name "Zoom" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
    foreach ($Proc in $ZoomProcs) {
        $Title = $Proc.MainWindowTitle
        if ($Title -like "*Zoom Meeting*" -or $Title -like "*Meeting*" -or $Title -like "*Zoom*") {
            $Hwnd = $Proc.MainWindowHandle
            if ([Win32Helper]::IsIconic($Hwnd)) {
                [Win32Helper]::ShowWindow($Hwnd, 9) | Out-Null # SW_RESTORE
            }
            [Win32Helper]::SetForegroundWindow($Hwnd) | Out-Null
            return $true
        }
    }
    return $false
}

# ==============================================================================
# MAIN AUTOMATION FLOW
# ==============================================================================
Write-AutomationLog "=========================================================="
Write-AutomationLog "Starting Zoom Auto-Broadcaster Session"

if (-not (Test-Path $ConfigPath)) {
    Write-AutomationLog "Configuration file not found at: $ConfigPath" "ERROR"
    exit 1
}

$Config = Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json

# 1. Validate Video File & Duration
$VideoPath = $Config.VideoFilePath
if (-not (Test-Path $VideoPath)) {
    Write-AutomationLog "Video file not found at '$VideoPath'. Please select a valid video in Control Panel." "ERROR"
    exit 1
}

$DetectedDuration = Get-VideoDurationSeconds -FilePath $VideoPath
$VideoDuration = if ($Config.VideoDurationSeconds -gt 0) { [int]$Config.VideoDurationSeconds } else { $DetectedDuration }
if ($VideoDuration -le 0) {
    Write-AutomationLog "Duration metadata was 0; MediaElement will detect exact duration upon opening." "WARN"
    $VideoDuration = 3600 # Fallback max timeout if metadata is missing
} else {
    Write-AutomationLog "Video File: '$VideoPath' | Duration: $VideoDuration seconds ($([TimeSpan]::FromSeconds($VideoDuration).ToString('hh\:mm\:ss')))"
}

# 2. Launch Zoom Meeting
$ZoomUri = ConvertTo-ZoomProtocolUri -MeetingUrl $Config.ZoomMeetingUrl -MeetingId $Config.MeetingId -Passcode $Config.Passcode
if ([string]::IsNullOrWhiteSpace($ZoomUri)) {
    Write-AutomationLog "No Zoom Meeting URL or Meeting ID configured!" "ERROR"
    exit 1
}

Write-AutomationLog "Launching Zoom Meeting via URI: $ZoomUri"
if (-not $DryRun) {
    Start-Process $ZoomUri
}

# 3. Wait for Zoom Meeting to connect
$JoinWait = if ($Config.JoinWaitSeconds -gt 0) { [int]$Config.JoinWaitSeconds } else { 15 }
Write-AutomationLog "Waiting $JoinWait seconds for Zoom Meeting window to initialize..."
for ($i = 1; $i -le $JoinWait; $i++) {
    Start-Sleep -Seconds 1
    if (-not $DryRun -and ($i % 3 -eq 0)) {
        # Automatically click 'Join with Computer Audio' or 'Launch Meeting' if prompted
        Invoke-UiaButtonByName -ButtonNames @("Join with Computer Audio", "Join Audio") -PartialMatch | Out-Null
    }
}

# 4. Mute Host Microphone if configured (so room noise does not interfere with video audio)
if ($Config.MuteHostMic -and -not $DryRun) {
    Focus-ZoomMeetingWindow | Out-Null
    Start-Sleep -Milliseconds 500
    # Only click if button currently says 'Mute' (meaning mic is currently unmuted)
    Invoke-UiaButtonByName -ButtonNames @("Mute my audio", "Mute") | Out-Null
}

# 5. Start Zoom Screen Share with Computer Sound
if (-not $DryRun) {
    Write-AutomationLog "Initiating Zoom Screen Share..."
    Focus-ZoomMeetingWindow | Out-Null
    Start-Sleep -Milliseconds 800

    # Try clicking Share Screen button or sending Alt+S
    $ShareClicked = Invoke-UiaButtonByName -ButtonNames @("Share Screen", "Share")
    if (-not $ShareClicked) {
        [System.Windows.Forms.SendKeys]::SendWait("%s")
    }
    Start-Sleep -Seconds 2

    # Check 'Share sound' checkbox in the Share dialog
    if ($Config.ShareComputerSound) {
        Set-UiaCheckboxByName -CheckboxNames @("Share sound", "Share computer sound") -DesiredState $true | Out-Null
    }
    if ($Config.OptimizeForVideo) {
        Set-UiaCheckboxByName -CheckboxNames @("Optimize for video clip", "Optimize for full screen video clip") -DesiredState $true | Out-Null
    }
    Start-Sleep -Milliseconds 600

    # Confirm Screen Share (Press Enter or click 'Share' inside the dialog)
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    Write-AutomationLog "Screen Share started."
}

$PreDelay = if ($Config.PreVideoDelaySeconds -ge 0) { [int]$Config.PreVideoDelaySeconds } else { 3 }
if ($PreDelay -gt 0) {
    Write-AutomationLog "Waiting $PreDelay seconds before starting video playback..."
    Start-Sleep -Seconds $PreDelay
}

# 6. Open Fullscreen Borderless Video Player & Run Auto-Admit Loop
Write-AutomationLog "Starting Fullscreen Video Playback: $VideoPath"

if (-not $DryRun) {
    $Window = New-Object System.Windows.Window
    $Window.Title = "Zoom Auto-Broadcaster Video Player"
    $Window.WindowStyle = [System.Windows.WindowStyle]::None
    $Window.ResizeMode = [System.Windows.ResizeMode]::NoResize
    $Window.WindowState = [System.Windows.WindowState]::Maximized
    $Window.Background = [System.Windows.Media.Brushes]::Black
    $Window.Topmost = $false

    $Grid = New-Object System.Windows.Controls.Grid
    $MediaElement = New-Object System.Windows.Controls.MediaElement
    $MediaElement.LoadedBehavior = [System.Windows.Controls.MediaState]::Manual
    $MediaElement.UnloadedBehavior = [System.Windows.Controls.MediaState]::Close
    $MediaElement.Stretch = [System.Windows.Media.Stretch]::Uniform
    $MediaElement.Volume = 1.0
    $MediaElement.Source = New-Object System.Uri($VideoPath)

    $Grid.Children.Add($MediaElement) | Out-Null
    $Window.Content = $Grid

    # Allow pressing ESC to manually abort playback if needed
    $Window.Add_KeyDown({
        param($sender, $e)
        if ($e.Key -eq [System.Windows.Input.Key]::Escape) {
            Write-AutomationLog "User pressed ESC to stop video playback early." "WARN"
            $MediaElement.Stop()
            $Window.Close()
        }
    })

    $Script:PlaybackFinished = $false
    $Script:StartTime = Get-Date
    $Script:MaxSeconds = $VideoDuration + 5

    $MediaElement.Add_MediaOpened({
        if ($MediaElement.NaturalDuration.HasTimeSpan) {
            $ExactSec = [math]::Ceiling($MediaElement.NaturalDuration.TimeSpan.TotalSeconds)
            if ($ExactSec -gt 0) {
                $Script:MaxSeconds = $ExactSec + 3
                Write-AutomationLog "MediaElement confirmed exact video length: $ExactSec seconds."
            }
        }
    })

    $MediaElement.Add_MediaEnded({
        Write-AutomationLog "Video playback reached the end naturally."
        $Script:PlaybackFinished = $true
        $Window.Close()
    })

    $MediaElement.Add_MediaFailed({
        param($sender, $e)
        Write-AutomationLog "MediaElement encountered an error: $($e.ErrorException.Message)" "ERROR"
        $Script:PlaybackFinished = $true
        $Window.Close()
    })

    # Timer runs every 3 seconds to:
    # 1. Check Auto-Admit for any Waiting Room participants
    # 2. Enforce max duration timeout
    $Timer = New-Object System.Windows.Threading.DispatcherTimer
    $Timer.Interval = [TimeSpan]::FromSeconds(3)
    $Timer.Add_Tick({
        $Elapsed = ((Get-Date) - $Script:StartTime).TotalSeconds
        if ($Config.AutoAdmitEnabled) {
            Invoke-ZoomAutoAdmit | Out-Null
        }
        $VipList = @($Config.CoHostEmail1, $Config.CoHostEmail2) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        if ($VipList.Count -gt 0) {
            Invoke-ZoomAutoCoHost -VipEmails $VipList
        }
        if ($Elapsed -ge $Script:MaxSeconds) {
            Write-AutomationLog "Video duration timer ($($Script:MaxSeconds)s) completed. Closing player."
            $Timer.Stop()
            $MediaElement.Stop()
            $Window.Close()
        }
    })

    $Window.Add_Loaded({
        $MediaElement.Play()
        $Timer.Start()
    })

    $Window.Add_Closed({
        $Timer.Stop()
    })

    $Window.ShowDialog() | Out-Null
}

# 7. Post-Video Delay & End Zoom Meeting Automatically
$PostDelay = if ($Config.PostVideoDelaySeconds -ge 0) { [int]$Config.PostVideoDelaySeconds } else { 3 }
Write-AutomationLog "Video playback complete. Waiting $PostDelay seconds before ending Zoom meeting..."
Start-Sleep -Seconds $PostDelay

if (-not $DryRun) {
    Write-AutomationLog "Stopping Screen Share and Ending Zoom Meeting for All..."
    Focus-ZoomMeetingWindow | Out-Null
    Start-Sleep -Milliseconds 600

    # Send Alt+Q to End/Leave Meeting
    [System.Windows.Forms.SendKeys]::SendWait("%q")
    Start-Sleep -Seconds 1

    # Click 'End Meeting for All' or 'End' button via UIAutomation, plus Enter fallback
    $Ended = Invoke-UiaButtonByName -ButtonNames @("End Meeting for All", "End meeting for all", "End", "Leave Meeting")
    if (-not $Ended) {
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    }
    Start-Sleep -Seconds 2
}

Write-AutomationLog "Zoom Meeting ended successfully. Session complete!"
Write-AutomationLog "=========================================================="
