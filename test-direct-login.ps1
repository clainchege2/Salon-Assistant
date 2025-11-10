$body = @{
    email = "owner@elegantstyles.com"
    password = "Password123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"

Write-Host "Login successful!"
Write-Host "User: $($response.user.firstName) $($response.user.lastName)"
Write-Host "Role: $($response.user.role)"
Write-Host "Tier: $($response.user.subscriptionTier)"
