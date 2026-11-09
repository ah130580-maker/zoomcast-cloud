param(
    [int]$Port = 8080,
    [switch]$OpenBrowser
)

$WebRoot = Join-Path $PSScriptRoot "web-portal"
$ConfigPath = Join-Path $PSScriptRoot "config.json"
$SmtpConfigPath = Join-Path $PSScriptRoot "smtp-config.json"
$RunnerScript = Join-Path $PSScriptRoot "Run-ZoomMeeting.ps1"
$SchedScript = Join-Path $PSScriptRoot "Register-ZoomSchedule.ps1"

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ZoomCast CRM - SaaS Web Portal Server Running" -ForegroundColor Green
Write-Host " URL: $Prefix" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if ($OpenBrowser) {
    Start-Process $Prefix
}

try {
    while ($Listener.IsListening) {
        $Context = $Listener.GetContext()
        $Req = $Context.Request
        $Res = $Context.Response
        $Path = $Req.Url.AbsolutePath

        if ($Path -eq "/api/save-config" -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            Set-Content -Path $ConfigPath -Value $Body -Encoding UTF8
            & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $SchedScript -ConfigPath $ConfigPath | Out-Null

            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok"}')
            $Res.ContentType = "application/json"
            $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
            $Res.Close()
            continue
        }

        if ($Path -eq "/api/save-smtp" -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            Set-Content -Path $SmtpConfigPath -Value $Body -Encoding UTF8

            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"ok"}')
            $Res.ContentType = "application/json"
            $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
            $Res.Close()
            continue
        }

        if ($Path -eq "/api/send-otp" -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            $ReqData = $Body | ConvertFrom-Json
            $ToEmail = $ReqData.email
            $OtpCode = $ReqData.otp

            $SentRealEmail = $false
            $ErrorMessage = ""

            if (Test-Path $SmtpConfigPath) {
                try {
                    $SmtpCfg = Get-Content $SmtpConfigPath -Raw | ConvertFrom-Json
                    if (-not [string]::IsNullOrWhiteSpace($SmtpCfg.gmailUser) -and -not [string]::IsNullOrWhiteSpace($SmtpCfg.gmailAppPassword)) {
                        $SmtpClient = New-Object System.Net.Mail.SmtpClient("smtp.gmail.com", 587)
                        $SmtpClient.EnableSsl = $true
                        $SmtpClient.Credentials = New-Object System.Net.NetworkCredential($SmtpCfg.gmailUser, $SmtpCfg.gmailAppPassword)
                        $MailMsg = New-Object System.Net.Mail.MailMessage
                        $MailMsg.From = New-Object System.Net.Mail.MailAddress($SmtpCfg.gmailUser, "ZoomCast CRM Verification")
                        $MailMsg.To.Add($ToEmail)
                        $MailMsg.Subject = "Your ZoomCast CRM Verification Code: $OtpCode"
                        $MailMsg.Body = "Hello,`n`nYour 6-digit verification OTP code for ZoomCast CRM is: $OtpCode`n`nThis code is valid for 10 minutes."
                        $SmtpClient.Send($MailMsg)
                        $SentRealEmail = $true
                    }
                } catch {
                    $ErrorMessage = $_.Exception.Message
                }
            }

            $ResultJson = @{
                status    = "ok"
                sentEmail = $SentRealEmail
                error     = $ErrorMessage
            } | ConvertTo-Json
            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($ResultJson)
            $Res.ContentType = "application/json"
            $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
            $Res.Close()
            continue
        }

        if ($Path -eq "/api/run-now" -and $Req.HttpMethod -eq "POST") {
            $ArgStr = "-NoProfile -ExecutionPolicy Bypass -File `"$RunnerScript`" -ConfigPath `"$ConfigPath`""
            Start-Process powershell.exe -ArgumentList $ArgStr
            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes('{"status":"started"}')
            $Res.ContentType = "application/json"
            $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
            $Res.Close()
            continue
        }

        if ($Path -eq "/" -or $Path -eq "") {
            $Path = "/index.html"
        }

        $LocalFile = Join-Path $WebRoot ($Path.TrimStart('/'))
        if (Test-Path $LocalFile -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($LocalFile).ToLower()
            $Mime = "application/octet-stream"
            if ($Ext -eq ".html") { $Mime = "text/html; charset=utf-8" }
            elseif ($Ext -eq ".js") { $Mime = "application/javascript; charset=utf-8" }
            elseif ($Ext -eq ".json") { $Mime = "application/json; charset=utf-8" }
            elseif ($Ext -eq ".css") { $Mime = "text/css; charset=utf-8" }

            $Bytes = [System.IO.File]::ReadAllBytes($LocalFile)
            $Res.ContentType = $Mime
            $Res.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Res.StatusCode = 404
        }
        $Res.Close()
    }
} finally {
    $Listener.Stop()
}
