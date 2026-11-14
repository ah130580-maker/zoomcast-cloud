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
$Prefix = "http://+:$Port/"
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
        try {
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

        if (($Path -eq "/api/send-otp" -or $Path -eq "/api/send-otp.php" -or $Path -eq "/.netlify/functions/send-otp") -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            $ReqData = $Body | ConvertFrom-Json
            $ToEmail = $ReqData.email
            $OtpCode = $ReqData.otp

            $SentRealEmail = $false
            $ErrorMessage = ""

            # 1. Try Resend High-Speed Email API (from resend-secret.php or $env:RESEND_API_KEY)
            $ResendApiKey = $env:RESEND_API_KEY
            $ResendFrom = "ZoomCast CRM <noreply@aamiq.online>"
            $SecretPhpPath = Join-Path $WebRoot "api\resend-secret.php"
            if (Test-Path $SecretPhpPath) {
                $PhpRaw = Get-Content $SecretPhpPath -Raw
                if ($PhpRaw -match "'api_key'\s*=>\s*'([^']+)'") {
                    $ResendApiKey = $Matches[1]
                }
                if ($PhpRaw -match "'from_email'\s*=>\s*'([^']+)'") {
                    $ResendFrom = $Matches[1]
                }
            }

            if (-not [string]::IsNullOrWhiteSpace($ResendApiKey) -and $ResendApiKey -ne "re_YOUR_RESEND_API_KEY") {
                try {
                    $Headers = @{
                        "Authorization"   = "Bearer $ResendApiKey"
                        "Content-Type"    = "application/json"
                        "Idempotency-Key" = [guid]::NewGuid().ToString()
                    }
                    $HtmlContent = "<div style='font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:28px;background:#0e0d0a;color:#f8fafc;border-radius:16px;border:1px solid rgba(245,183,0,0.35);'><h2 style='color:#f5b700;margin-top:0;'>ZoomCast CRM Verification</h2><p style='color:#cbd5e1;font-size:14px;'>Use the 4-digit security code below to verify your email address:</p><div style='background:#181611;border:1px solid #f5b700;border-radius:12px;padding:18px;text-align:center;margin:20px 0;'><span style='font-size:32px;font-weight:800;letter-spacing:8px;color:#f5b700;'>$OtpCode</span></div><p style='color:#94a3b8;font-size:12px;'>This code expires in 10 minutes.</p></div>"
                    $ResendPayload = @{
                        from    = $ResendFrom
                        to      = @($ToEmail)
                        subject = "ZoomCast CRM — 4-Digit Security OTP ($OtpCode)"
                        html    = $HtmlContent
                    } | ConvertTo-Json -Depth 4

                    $ResendResp = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $Headers -Body $ResendPayload -TimeoutSec 10
                    if ($ResendResp.id) {
                        $SentRealEmail = $true
                    }
                } catch {
                    $ErrorMessage = $_.Exception.Message
                }
            }

            # 2. Fallback to Local SMTP if Resend did not send
            if (-not $SentRealEmail -and (Test-Path $SmtpConfigPath)) {
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
                        $MailMsg.Body = "Hello,`n`nYour 4-digit verification OTP code for ZoomCast CRM is: $OtpCode`n`nThis code is valid for 10 minutes."
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

        if (($Path -eq "/api/create-checkout" -or $Path -eq "/api/create-checkout.php" -or $Path -eq "/.netlify/functions/create-checkout") -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            $ReqData = $Body | ConvertFrom-Json
            $PlanId = if ($ReqData.planId) { "$($ReqData.planId)".Trim().ToLower() } else { "pro" }
            $Currency = if ($ReqData.currency) { "$($ReqData.currency)".Trim().ToUpper() } else { "PKR" }
            $Amount = if ($ReqData.amount) { [int][Math]::Round([double]$ReqData.amount) } else { 35 }
            $SuccessUrl = "https://zoomcast.aamiq.online/?payment_status=success&plan=$PlanId&currency=$Currency"
            $CancelUrl = "https://zoomcast.aamiq.online/?payment_status=cancelled&plan=$PlanId"

            $CheckoutResp = @{ ok = $false; pendingApproval = $true; message = "Payment gateway activation is pending Safepay/LemonSqueezy approval." }
            if ($Currency -eq "PKR") {
                $SpKey = [Environment]::GetEnvironmentVariable("SAFEPAY_API_KEY", "Machine")
                $SpEnv = [Environment]::GetEnvironmentVariable("SAFEPAY_ENV", "Machine")
                if ([string]::IsNullOrWhiteSpace($SpEnv)) { $SpEnv = "production" }
                if (-not [string]::IsNullOrWhiteSpace($SpKey)) {
                    try {
                        $SpApiBase = if ($SpEnv -eq "sandbox") { "https://sandbox.api.getsafepay.com" } else { "https://api.getsafepay.com" }
                        $SpBody = @{ client = $SpKey; amount = $Amount; currency = "PKR"; environment = $SpEnv } | ConvertTo-Json
                        $SpInit = Invoke-RestMethod -Uri "$SpApiBase/order/v1/init" -Method Post -ContentType "application/json" -Body $SpBody -TimeoutSec 10
                        if ($SpInit.data.token) {
                            $SpCkBase = if ($SpEnv -eq "sandbox") { "https://sandbox.api.getsafepay.com/components" } else { "https://getsafepay.com/checkout/pay" }
                            $OrderId = "ZC-" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
                            $RedirectUrl = "$SpCkBase?env=$SpEnv&beacon=$($SpInit.data.token)&source=custom&order_id=$OrderId&redirect_url=$([Uri]::EscapeDataString($SuccessUrl))&cancel_url=$([Uri]::EscapeDataString($CancelUrl))"
                            $CheckoutResp = @{ ok = $true; checkoutUrl = $RedirectUrl; gateway = "safepay" }
                        }
                    } catch {
                        $CheckoutResp = @{ ok = $false; error = $_.Exception.Message }
                    }
                }
            } else {
                $LsEnvName = "LEMONSQUEEZY_" + $PlanId.ToUpper() + "_URL"
                $LsUrl = [Environment]::GetEnvironmentVariable($LsEnvName, "Machine")
                if (-not [string]::IsNullOrWhiteSpace($LsUrl)) {
                    $CheckoutResp = @{ ok = $true; checkoutUrl = $LsUrl; gateway = "lemonsqueezy" }
                }
            }

            $JsonOut = $CheckoutResp | ConvertTo-Json -Depth 4
            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonOut)
            $Res.ContentType = "application/json; charset=utf-8"
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

        if ($Path -eq "/api/sessions" -and $Req.HttpMethod -eq "GET") {
            $SessionsFile = Join-Path $PSScriptRoot "logs\sessions.json"
            $JsonOut = "[]"
            if (Test-Path $SessionsFile) {
                $JsonOut = Get-Content $SessionsFile -Raw
            }
            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonOut)
            $Res.ContentType = "application/json"
            $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
            $Res.Close()
            continue
        }

        if ($Path -eq "/api/service-status") {
            $StatusFile = Join-Path $PSScriptRoot "service-status.json"
            if ($Req.HttpMethod -eq "GET") {
                $JsonOut = '{"mode":"operational","message":"","updatedAt":""}'
                if (Test-Path $StatusFile) {
                    $JsonOut = Get-Content $StatusFile -Raw
                }
                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($JsonOut)
                $Res.ContentType = "application/json; charset=utf-8"
                if ($Req.HttpMethod -ne "HEAD") {
                    $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                }
                $Res.Close()
                continue
            }
            if ($Req.HttpMethod -eq "POST") {
                $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
                $Body = $Reader.ReadToEnd()
                $Reader.Close()
                $ReqData = $Body | ConvertFrom-Json
                $Mode = if ($ReqData.mode) { "$($ReqData.mode)" } else { "operational" }
                $Msg = if ($ReqData.message) { "$($ReqData.message)" } else { "" }
                $UpdatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                $StatusObj = @{ mode = $Mode; message = $Msg; updatedAt = $UpdatedAt }
                $StatusJson = $StatusObj | ConvertTo-Json -Depth 3
                Set-Content -Path $StatusFile -Value $StatusJson -Encoding UTF8

                $EmailedCount = 0
                if ($ReqData.notifyClients -and $ReqData.emails -and $Mode -ne "operational") {
                    $ResendApiKey = $env:RESEND_API_KEY
                    $ResendFrom = "ZoomCast by Aamiq <noreply@aamiq.online>"
                    $SecretPhpPath = Join-Path $WebRoot "api\resend-secret.php"
                    if (Test-Path $SecretPhpPath) {
                        $PhpRaw = Get-Content $SecretPhpPath -Raw
                        if ($PhpRaw -match "'api_key'\s*=>\s*'([^']+)'") { $ResendApiKey = $Matches[1] }
                        if ($PhpRaw -match "'from_email'\s*=>\s*'([^']+)'") { $ResendFrom = $Matches[1] }
                    }
                    if (-not [string]::IsNullOrWhiteSpace($ResendApiKey)) {
                        $Label = if ($Mode -eq "issue") { "Service Issue Notice" } else { "Scheduled Maintenance Notice" }
                        $Subj = "ZoomCast by Aamiq — $Label"
                        $HtmlAlert = "<div style='font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0e0d0a;color:#f8fafc;border-radius:14px;border:1px solid rgba(245,183,0,0.35);'><h3 style='color:#f5b700;margin-top:0;'>$Label</h3><p style='color:#cbd5e1;font-size:14px;line-height:1.6;'>$Msg</p><p style='color:#94a3b8;font-size:12px;margin-top:16px;'>Our engineering team is actively monitoring and resolving this. Thank you for your patience.</p></div>"
                        foreach ($TargetEmail in $ReqData.emails) {
                            if (-not [string]::IsNullOrWhiteSpace($TargetEmail)) {
                                try {
                                    $Headers = @{ "Authorization" = "Bearer $ResendApiKey"; "Content-Type" = "application/json" }
                                    $Payload = @{ from = $ResendFrom; to = @("$TargetEmail"); subject = $Subj; html = $HtmlAlert } | ConvertTo-Json -Depth 4
                                    Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $Headers -Body $Payload -TimeoutSec 8 | Out-Null
                                    $EmailedCount++
                                } catch {}
                            }
                        }
                    }
                }

                $RespObj = @{ ok = $true; status = $StatusObj; emailedCount = $EmailedCount } | ConvertTo-Json -Depth 4
                $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($RespObj)
                $Res.ContentType = "application/json; charset=utf-8"
                $Res.OutputStream.Write($RespBytes, 0, $RespBytes.Length)
                $Res.Close()
                continue
            }
        }

        if ($Path -eq "/api/zoom-session-alert" -and $Req.HttpMethod -eq "POST") {
            $Reader = New-Object System.IO.StreamReader($Req.InputStream, $Req.ContentEncoding)
            $Body = $Reader.ReadToEnd()
            $Reader.Close()
            $ReqData = $Body | ConvertFrom-Json
            $TargetEmail = "$($ReqData.email)"
            $ClientName = if ($ReqData.name) { "$($ReqData.name)" } else { "Workspace Owner" }
            $Reason = if ($ReqData.reason) { "$($ReqData.reason)" } else { "Your Zoom session expired or disconnected." }

            $EmailSent = $false
            if (-not [string]::IsNullOrWhiteSpace($TargetEmail)) {
                $ResendApiKey = $env:RESEND_API_KEY
                $ResendFrom = "ZoomCast by Aamiq <noreply@aamiq.online>"
                $SecretPhpPath = Join-Path $WebRoot "api\resend-secret.php"
                if (Test-Path $SecretPhpPath) {
                    $PhpRaw = Get-Content $SecretPhpPath -Raw
                    if ($PhpRaw -match "'api_key'\s*=>\s*'([^']+)'") { $ResendApiKey = $Matches[1] }
                    if ($PhpRaw -match "'from_email'\s*=>\s*'([^']+)'") { $ResendFrom = $Matches[1] }
                }
                if (-not [string]::IsNullOrWhiteSpace($ResendApiKey)) {
                    $Subj = "Action Required: Zoom Connection Issue Detected — ZoomCast by Aamiq"
                    $HtmlAlert = "<div style='font-family:Inter,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#0e0d0a;color:#f8fafc;border-radius:14px;border:1px solid rgba(245,183,0,0.35);'><h3 style='color:#f5b700;margin-top:0;'>Zoom Connection Attention Needed</h3><p style='color:#cbd5e1;font-size:14px;line-height:1.6;'>Hi $ClientName,</p><p style='color:#cbd5e1;font-size:14px;line-height:1.6;'>$Reason</p><p style='color:#cbd5e1;font-size:14px;line-height:1.6;'>Please sign in to <a href='https://zoomcast.aamiq.online' style='color:#f5b700;'>https://zoomcast.aamiq.online</a> and go to <strong>Security &amp; Integrations</strong> to reconnect your Zoom account so your scheduled broadcasts continue uninterrupted.</p><p style='color:#94a3b8;font-size:12px;margin-top:16px;'>Need help? Contact support@aamiq.online</p></div>"
                    try {
                        $Headers = @{ "Authorization" = "Bearer $ResendApiKey"; "Content-Type" = "application/json" }
                        $Payload = @{ from = $ResendFrom; to = @($TargetEmail); subject = $Subj; html = $HtmlAlert } | ConvertTo-Json -Depth 4
                        Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers $Headers -Body $Payload -TimeoutSec 8 | Out-Null
                        $EmailSent = $true
                    } catch {}
                }
            }

            $RespObj = @{ ok = $true; emailSent = $EmailSent } | ConvertTo-Json -Depth 3
            $RespBytes = [System.Text.Encoding]::UTF8.GetBytes($RespObj)
            $Res.ContentType = "application/json; charset=utf-8"
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
            elseif ($Ext -eq ".png") { $Mime = "image/png" }
            elseif ($Ext -eq ".jpg" -or $Ext -eq ".jpeg") { $Mime = "image/jpeg" }
            elseif ($Ext -eq ".svg") { $Mime = "image/svg+xml" }
            elseif ($Ext -eq ".ico") { $Mime = "image/x-icon" }
            elseif ($Ext -eq ".webp") { $Mime = "image/webp" }

            $Bytes = [System.IO.File]::ReadAllBytes($LocalFile)
            $Res.ContentType = $Mime
            if ($Req.HttpMethod -ne "HEAD") {
                $Res.OutputStream.Write($Bytes, 0, $Bytes.Length)
            }
        } else {
            $Res.StatusCode = 404
        }
        $Res.Close()
        } catch {
            try { $Context.Response.StatusCode = 500; $Context.Response.Close() } catch {}
        }
    }
} finally {
    $Listener.Stop()
}
