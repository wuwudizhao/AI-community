param(
  [Parameter(Mandatory = $true)][string]$TestEmail,
  [string]$ApiBaseUrl = 'http://localhost:4000/api'
)

$ErrorActionPreference = 'Stop'
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$body = @{
  email = $TestEmail
  username = "mail_smoke_$stamp"
  displayName = 'Liftoff Mail Smoke'
  password = "MailSmoke-$stamp-Aa1"
} | ConvertTo-Json

$response = Invoke-WebRequest "$ApiBaseUrl/auth/register" -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
if ($response.StatusCode -ne 201) { throw "Registration was not accepted: HTTP $($response.StatusCode)" }
Write-Host 'Provider accepted the verification email request (HTTP 201).'
Write-Host 'Now inspect the controlled inbox, click the Liftoff verification button, and complete login/me/logout checks.'
Write-Host 'This script never prints the verification token, API key, or session secret.'
