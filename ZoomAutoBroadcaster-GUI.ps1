param(
    [string]$ConfigPath = "$PSScriptRoot\config.json"
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function Load-Config {
    if (Test-Path $ConfigPath) {
        return Get-Content -Path $ConfigPath -Raw | ConvertFrom-Json
    }
    return [PSCustomObject]@{
        ZoomMeetingUrl       = ""
        MeetingId            = ""
        Passcode             = ""
        VideoFilePath        = ""
        VideoDurationSeconds = 0
        JoinWaitSeconds      = 15
        PreVideoDelaySeconds = 5
        PostVideoDelaySeconds= 3
        AutoAdmitEnabled     = $true
        ShareComputerSound   = $true
        OptimizeForVideo     = $true
        MuteHostMic          = $true
        Schedule1Enabled     = $true
        Schedule1Time        = "10:00"
        Schedule2Enabled     = $true
        Schedule2Time        = "15:00"
        Schedule3Enabled     = $true
        Schedule3Time        = "20:00"
    }
}

function Get-VideoDurationFromShell {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return 0 }
    try {
        $Shell = New-Object -ComObject Shell.Application
        $Folder = Split-Path $FilePath -Parent
        $File = Split-Path $FilePath -Leaf
        $ShellFolder = $Shell.Namespace($Folder)
        $ShellFile = $ShellFolder.ParseName($File)
        $DurationStr = $ShellFolder.GetDetailsOf($ShellFile, 27)
        if ($DurationStr -match "(\d+):(\d+):(\d+)") {
            return ([int]$Matches[1] * 3600) + ([int]$Matches[2] * 60) + [int]$Matches[3]
        }
    } catch {}
    return 0
}

$Config = Load-Config

# Create Main Form
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "Zoom Auto-Broadcaster - Control Panel"
$Form.Size = New-Object System.Drawing.Size(640, 650)
$Form.StartPosition = "CenterScreen"
$Form.FormBorderStyle = "FixedDialog"
$Form.MaximizeBox = $false
$Form.BackColor = [System.Drawing.Color]::FromArgb(245, 247, 250)
$Form.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)

$BoldFont = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$TitleFont = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Bold)

# Header
$HeaderLabel = New-Object System.Windows.Forms.Label
$HeaderLabel.Text = "Zoom Auto-Broadcaster & Video Scheduler"
$HeaderLabel.Font = $TitleFont
$HeaderLabel.ForeColor = [System.Drawing.Color]::FromArgb(14, 113, 235)
$HeaderLabel.Location = New-Object System.Drawing.Point(20, 15)
$HeaderLabel.Size = New-Object System.Drawing.Size(580, 30)
$Form.Controls.Add($HeaderLabel)

# ==============================================================================
# 1. Zoom Meeting Settings Group
# ==============================================================================
$GrpZoom = New-Object System.Windows.Forms.GroupBox
$GrpZoom.Text = "1. Zoom Meeting Settings"
$GrpZoom.Font = $BoldFont
$GrpZoom.Location = New-Object System.Drawing.Point(20, 55)
$GrpZoom.Size = New-Object System.Drawing.Size(585, 115)
$Form.Controls.Add($GrpZoom)

$LblUrl = New-Object System.Windows.Forms.Label
$LblUrl.Text = "Zoom Meeting Link:"
$LblUrl.Font = $Form.Font
$LblUrl.Location = New-Object System.Drawing.Point(15, 30)
$LblUrl.Size = New-Object System.Drawing.Size(130, 25)
$GrpZoom.Controls.Add($LblUrl)

$TxtUrl = New-Object System.Windows.Forms.TextBox
$TxtUrl.Font = $Form.Font
$TxtUrl.Location = New-Object System.Drawing.Point(150, 27)
$TxtUrl.Size = New-Object System.Drawing.Size(415, 25)
$TxtUrl.Text = $Config.ZoomMeetingUrl
$GrpZoom.Controls.Add($TxtUrl)

$LblId = New-Object System.Windows.Forms.Label
$LblId.Text = "OR Meeting ID:"
$LblId.Font = $Form.Font
$LblId.Location = New-Object System.Drawing.Point(15, 70)
$LblId.Size = New-Object System.Drawing.Size(130, 25)
$GrpZoom.Controls.Add($LblId)

$TxtId = New-Object System.Windows.Forms.TextBox
$TxtId.Font = $Form.Font
$TxtId.Location = New-Object System.Drawing.Point(150, 67)
$TxtId.Size = New-Object System.Drawing.Size(170, 25)
$TxtId.Text = $Config.MeetingId
$GrpZoom.Controls.Add($TxtId)

$LblPwd = New-Object System.Windows.Forms.Label
$LblPwd.Text = "Passcode:"
$LblPwd.Font = $Form.Font
$LblPwd.Location = New-Object System.Drawing.Point(335, 70)
$LblPwd.Size = New-Object System.Drawing.Size(70, 25)
$GrpZoom.Controls.Add($LblPwd)

$TxtPwd = New-Object System.Windows.Forms.TextBox
$TxtPwd.Font = $Form.Font
$TxtPwd.Location = New-Object System.Drawing.Point(410, 67)
$TxtPwd.Size = New-Object System.Drawing.Size(155, 25)
$TxtPwd.Text = $Config.Passcode
$GrpZoom.Controls.Add($TxtPwd)

# ==============================================================================
# 2. Recorded Video Selection Group
# ==============================================================================
$GrpVideo = New-Object System.Windows.Forms.GroupBox
$GrpVideo.Text = "2. Recorded Video File"
$GrpVideo.Font = $BoldFont
$GrpVideo.Location = New-Object System.Drawing.Point(20, 180)
$GrpVideo.Size = New-Object System.Drawing.Size(585, 110)
$Form.Controls.Add($GrpVideo)

$LblVideo = New-Object System.Windows.Forms.Label
$LblVideo.Text = "Video File (.mp4):"
$LblVideo.Font = $Form.Font
$LblVideo.Location = New-Object System.Drawing.Point(15, 30)
$LblVideo.Size = New-Object System.Drawing.Size(130, 25)
$GrpVideo.Controls.Add($LblVideo)

$TxtVideo = New-Object System.Windows.Forms.TextBox
$TxtVideo.Font = $Form.Font
$TxtVideo.Location = New-Object System.Drawing.Point(150, 27)
$TxtVideo.Size = New-Object System.Drawing.Size(310, 25)
$TxtVideo.Text = $Config.VideoFilePath
$GrpVideo.Controls.Add($TxtVideo)

$BtnBrowse = New-Object System.Windows.Forms.Button
$BtnBrowse.Text = "Browse..."
$BtnBrowse.Font = $Form.Font
$BtnBrowse.Location = New-Object System.Drawing.Point(470, 25)
$BtnBrowse.Size = New-Object System.Drawing.Size(95, 28)
$GrpVideo.Controls.Add($BtnBrowse)

$LblDurationInfo = New-Object System.Windows.Forms.Label
$LblDurationInfo.Text = "Detected Video Length: (Auto-detected on start)"
$LblDurationInfo.Font = $Form.Font
$LblDurationInfo.ForeColor = [System.Drawing.Color]::FromArgb(40, 120, 60)
$LblDurationInfo.Location = New-Object System.Drawing.Point(150, 65)
$LblDurationInfo.Size = New-Object System.Drawing.Size(415, 25)
$GrpVideo.Controls.Add($LblDurationInfo)

function Update-DurationLabel {
    $Sec = Get-VideoDurationFromShell -FilePath $TxtVideo.Text
    if ($Sec -gt 0) {
        $Formatted = [TimeSpan]::FromSeconds($Sec).ToString("hh\:mm\:ss")
        $LblDurationInfo.Text = "Detected Video Length: $Formatted ($Sec seconds) - Auto-ends after finish"
        $LblDurationInfo.ForeColor = [System.Drawing.Color]::FromArgb(25, 135, 84)
    } elseif (Test-Path $TxtVideo.Text) {
        $LblDurationInfo.Text = "Video found! Exact length will be read automatically by player."
        $LblDurationInfo.ForeColor = [System.Drawing.Color]::FromArgb(14, 113, 235)
    } else {
        $LblDurationInfo.Text = "Please select a valid video file (.mp4, .mkv, .mov, .wmv)"
        $LblDurationInfo.ForeColor = [System.Drawing.Color]::FromArgb(180, 60, 60)
    }
}
Update-DurationLabel

$BtnBrowse.Add_Click({
    $Dlg = New-Object System.Windows.Forms.OpenFileDialog
    $Dlg.Filter = "Video Files (*.mp4;*.mkv;*.mov;*.avi;*.wmv)|*.mp4;*.mkv;*.mov;*.avi;*.wmv|All Files (*.*)|*.*"
    if ($Dlg.ShowDialog() -eq "OK") {
        $TxtVideo.Text = $Dlg.FileName
        Update-DurationLabel
    }
})

# ==============================================================================
# 3. Daily Schedule (2 or 3 Times a Day)
# ==============================================================================
$GrpSched = New-Object System.Windows.Forms.GroupBox
$GrpSched.Text = "3. Daily Schedule (24-Hour Format HH:mm, e.g. 10:00, 15:30, 20:00)"
$GrpSched.Font = $BoldFont
$GrpSched.Location = New-Object System.Drawing.Point(20, 300)
$GrpSched.Size = New-Object System.Drawing.Size(585, 100)
$Form.Controls.Add($GrpSched)

$ChkS1 = New-Object System.Windows.Forms.CheckBox
$ChkS1.Text = "Time 1:"
$ChkS1.Font = $Form.Font
$ChkS1.Checked = [bool]$Config.Schedule1Enabled
$ChkS1.Location = New-Object System.Drawing.Point(20, 35)
$ChkS1.Size = New-Object System.Drawing.Size(75, 25)
$GrpSched.Controls.Add($ChkS1)

$TxtS1 = New-Object System.Windows.Forms.TextBox
$TxtS1.Font = $Form.Font
$TxtS1.Location = New-Object System.Drawing.Point(95, 33)
$TxtS1.Size = New-Object System.Drawing.Size(75, 25)
$TxtS1.Text = $Config.Schedule1Time
$GrpSched.Controls.Add($TxtS1)

$ChkS2 = New-Object System.Windows.Forms.CheckBox
$ChkS2.Text = "Time 2:"
$ChkS2.Font = $Form.Font
$ChkS2.Checked = [bool]$Config.Schedule2Enabled
$ChkS2.Location = New-Object System.Drawing.Point(210, 35)
$ChkS2.Size = New-Object System.Drawing.Size(75, 25)
$GrpSched.Controls.Add($ChkS2)

$TxtS2 = New-Object System.Windows.Forms.TextBox
$TxtS2.Font = $Form.Font
$TxtS2.Location = New-Object System.Drawing.Point(285, 33)
$TxtS2.Size = New-Object System.Drawing.Size(75, 25)
$TxtS2.Text = $Config.Schedule2Time
$GrpSched.Controls.Add($TxtS2)

$ChkS3 = New-Object System.Windows.Forms.CheckBox
$ChkS3.Text = "Time 3:"
$ChkS3.Font = $Form.Font
$ChkS3.Checked = [bool]$Config.Schedule3Enabled
$ChkS3.Location = New-Object System.Drawing.Point(400, 35)
$ChkS3.Size = New-Object System.Drawing.Size(75, 25)
$GrpSched.Controls.Add($ChkS3)

$TxtS3 = New-Object System.Windows.Forms.TextBox
$TxtS3.Font = $Form.Font
$TxtS3.Location = New-Object System.Drawing.Point(475, 33)
$TxtS3.Size = New-Object System.Drawing.Size(75, 25)
$TxtS3.Text = $Config.Schedule3Time
$GrpSched.Controls.Add($TxtS3)

$LblSchedNote = New-Object System.Windows.Forms.Label
$LblSchedNote.Text = "Note: Registers in Windows Task Scheduler so it runs automatically at these times every day."
$LblSchedNote.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$LblSchedNote.ForeColor = [System.Drawing.Color]::DimGray
$LblSchedNote.Location = New-Object System.Drawing.Point(20, 68)
$LblSchedNote.Size = New-Object System.Drawing.Size(540, 20)
$GrpSched.Controls.Add($LblSchedNote)

# ==============================================================================
# 4. Automation Options Group
# ==============================================================================
$GrpOpts = New-Object System.Windows.Forms.GroupBox
$GrpOpts.Text = "4. Smart Automation Options"
$GrpOpts.Font = $BoldFont
$GrpOpts.Location = New-Object System.Drawing.Point(20, 410)
$GrpOpts.Size = New-Object System.Drawing.Size(585, 100)
$Form.Controls.Add($GrpOpts)

$ChkAdmit = New-Object System.Windows.Forms.CheckBox
$ChkAdmit.Text = "Auto-Admit Participants (Clicks 'Admit All' automatically)"
$ChkAdmit.Font = $Form.Font
$ChkAdmit.Checked = [bool]$Config.AutoAdmitEnabled
$ChkAdmit.Location = New-Object System.Drawing.Point(20, 30)
$ChkAdmit.Size = New-Object System.Drawing.Size(290, 25)
$GrpOpts.Controls.Add($ChkAdmit)

$ChkSound = New-Object System.Windows.Forms.CheckBox
$ChkSound.Text = "Share Computer Audio (Video sound in Zoom)"
$ChkSound.Font = $Form.Font
$ChkSound.Checked = [bool]$Config.ShareComputerSound
$ChkSound.Location = New-Object System.Drawing.Point(320, 30)
$ChkSound.Size = New-Object System.Drawing.Size(250, 25)
$GrpOpts.Controls.Add($ChkSound)

$ChkMute = New-Object System.Windows.Forms.CheckBox
$ChkMute.Text = "Auto-Mute Host Microphone during video"
$ChkMute.Font = $Form.Font
$ChkMute.Checked = [bool]$Config.MuteHostMic
$ChkMute.Location = New-Object System.Drawing.Point(20, 62)
$ChkMute.Size = New-Object System.Drawing.Size(290, 25)
$GrpOpts.Controls.Add($ChkMute)

$ChkOptVideo = New-Object System.Windows.Forms.CheckBox
$ChkOptVideo.Text = "Optimize Screen Share for Video Clip"
$ChkOptVideo.Font = $Form.Font
$ChkOptVideo.Checked = [bool]$Config.OptimizeForVideo
$ChkOptVideo.Location = New-Object System.Drawing.Point(320, 62)
$ChkOptVideo.Size = New-Object System.Drawing.Size(250, 25)
$GrpOpts.Controls.Add($ChkOptVideo)

# ==============================================================================
# 5. Buttons & Status Bar
# ==============================================================================
$LblStatus = New-Object System.Windows.Forms.Label
$LblStatus.Text = "Status: Ready. Configure settings above and click 'Save & Activate Schedule'."
$LblStatus.Font = $Form.Font
$LblStatus.ForeColor = [System.Drawing.Color]::FromArgb(50, 50, 50)
$LblStatus.Location = New-Object System.Drawing.Point(22, 520)
$LblStatus.Size = New-Object System.Drawing.Size(580, 25)
$Form.Controls.Add($LblStatus)

function Save-CurrentConfig {
    $Sec = Get-VideoDurationFromShell -FilePath $TxtVideo.Text
    $NewObj = [Ordered]@{
        ZoomMeetingUrl       = $TxtUrl.Text.Trim()
        MeetingId            = $TxtId.Text.Trim()
        Passcode             = $TxtPwd.Text.Trim()
        VideoFilePath        = $TxtVideo.Text.Trim()
        VideoDurationSeconds = $Sec
        JoinWaitSeconds      = 15
        PreVideoDelaySeconds = 5
        PostVideoDelaySeconds= 3
        AutoAdmitEnabled     = [bool]$ChkAdmit.Checked
        ShareComputerSound   = [bool]$ChkSound.Checked
        OptimizeForVideo     = [bool]$ChkOptVideo.Checked
        MuteHostMic          = [bool]$ChkMute.Checked
        Schedule1Enabled     = [bool]$ChkS1.Checked
        Schedule1Time        = $TxtS1.Text.Trim()
        Schedule2Enabled     = [bool]$ChkS2.Checked
        Schedule2Time        = $TxtS2.Text.Trim()
        Schedule3Enabled     = [bool]$ChkS3.Checked
        Schedule3Time        = $TxtS3.Text.Trim()
    }
    $NewObj | ConvertTo-Json -Depth 3 | Set-Content -Path $ConfigPath -Encoding UTF8
    Update-DurationLabel
}

$BtnSave = New-Object System.Windows.Forms.Button
$BtnSave.Text = "Save && Activate Daily Schedule"
$BtnSave.Font = $BoldFont
$BtnSave.BackColor = [System.Drawing.Color]::FromArgb(25, 135, 84)
$BtnSave.ForeColor = [System.Drawing.Color]::White
$BtnSave.FlatStyle = "Flat"
$BtnSave.Location = New-Object System.Drawing.Point(20, 550)
$BtnSave.Size = New-Object System.Drawing.Size(250, 42)
$Form.Controls.Add($BtnSave)

$BtnRunNow = New-Object System.Windows.Forms.Button
$BtnRunNow.Text = "Test / Start Meeting Now"
$BtnRunNow.Font = $BoldFont
$BtnRunNow.BackColor = [System.Drawing.Color]::FromArgb(14, 113, 235)
$BtnRunNow.ForeColor = [System.Drawing.Color]::White
$BtnRunNow.FlatStyle = "Flat"
$BtnRunNow.Location = New-Object System.Drawing.Point(285, 550)
$BtnRunNow.Size = New-Object System.Drawing.Size(210, 42)
$Form.Controls.Add($BtnRunNow)

$BtnLogs = New-Object System.Windows.Forms.Button
$BtnLogs.Text = "Logs"
$BtnLogs.Font = $Form.Font
$BtnLogs.Location = New-Object System.Drawing.Point(510, 550)
$BtnLogs.Size = New-Object System.Drawing.Size(95, 42)
$Form.Controls.Add($BtnLogs)

$BtnSave.Add_Click({
    Save-CurrentConfig
    $SchedScript = Join-Path $PSScriptRoot "Register-ZoomSchedule.ps1"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $SchedScript -ConfigPath $ConfigPath
    $LblStatus.Text = "Status: Saved! Daily schedule is active in Windows Task Scheduler."
    $LblStatus.ForeColor = [System.Drawing.Color]::FromArgb(25, 135, 84)
    [System.Windows.Forms.MessageBox]::Show(
        "Settings saved and Daily Schedule activated successfully!`n`nZoom meetings will automatically start, share your video with sound, auto-admit participants, and end when the video finishes.",
        "Schedule Activated",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    )
})

$BtnRunNow.Add_Click({
    Save-CurrentConfig
    if (-not (Test-Path $TxtVideo.Text.Trim())) {
        [System.Windows.Forms.MessageBox]::Show(
            "Please select a valid video file first using the 'Browse...' button!",
            "Video File Required",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        )
        return
    }
    $RunnerScript = Join-Path $PSScriptRoot "Run-ZoomMeeting.ps1"
    $LblStatus.Text = "Status: Running Zoom Meeting Automation Session now..."
    $LblStatus.ForeColor = [System.Drawing.Color]::FromArgb(14, 113, 235)
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerScript`" -ConfigPath `"$ConfigPath`""
})

$BtnLogs.Add_Click({
    $LogFile = Join-Path $PSScriptRoot "logs\automation.log"
    if (Test-Path $LogFile) {
        Start-Process notepad.exe -ArgumentList "`"$LogFile`""
    } else {
        [System.Windows.Forms.MessageBox]::Show("No logs generated yet. Run a test session first!", "Logs")
    }
})

[void]$Form.ShowDialog()
