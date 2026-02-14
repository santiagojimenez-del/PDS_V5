# Test Script for Bulk Operations
# Run this in PowerShell

# First, let's check if we have jobs in the database
# We'll use the existing session cookie if available

# Test 1: Get multiple jobs
Write-Host "`n=== Test 1: GET Bulk Jobs ===" -ForegroundColor Cyan
curl.exe -X GET "http://localhost:3005/api/workflow/bulk/jobs?ids=1,2,3" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json"

# Test 2: Bulk Approve
Write-Host "`n`n=== Test 2: POST Bulk Approve ===" -ForegroundColor Cyan
curl.exe -X POST "http://localhost:3005/api/workflow/bulk/approve" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"jobIds\":[1,2],\"approvedFlight\":\"2026-03-01\"}'

# Test 3: Bulk Schedule
Write-Host "`n`n=== Test 3: POST Bulk Schedule ===" -ForegroundColor Cyan
curl.exe -X POST "http://localhost:3005/api/workflow/bulk/schedule" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"jobIds\":[1,2],\"scheduledDate\":\"2026-03-15\",\"scheduledFlight\":\"2026-03-15\",\"personsAssigned\":[1,2]}'

# Test 4: Bulk Flight Log
Write-Host "`n`n=== Test 4: POST Bulk Flight Log ===" -ForegroundColor Cyan
curl.exe -X POST "http://localhost:3005/api/workflow/bulk/flight-log" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"jobIds\":[1,2],\"flownDate\":\"2026-03-15\",\"flightLog\":{\"duration\":45}}'

# Test 5: Bulk Deliver
Write-Host "`n`n=== Test 5: POST Bulk Deliver ===" -ForegroundColor Cyan
curl.exe -X POST "http://localhost:3005/api/workflow/bulk/deliver" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"jobIds\":[1,2],\"deliveredDate\":\"2026-03-16\"}'

# Test 6: Bulk Bill
Write-Host "`n`n=== Test 6: POST Bulk Bill ===" -ForegroundColor Cyan
curl.exe -X POST "http://localhost:3005/api/workflow/bulk/bill" `
  -H "Cookie: pds_session=YOUR_SESSION_TOKEN_HERE" `
  -H "Content-Type: application/json" `
  -d '{\"jobIds\":[1,2],\"invoiceNumber\":\"INV-2026-001\",\"billedDate\":\"2026-03-17\"}'

Write-Host "`n`n=== Tests Complete ===" -ForegroundColor Green
Write-Host "Note: Replace YOUR_SESSION_TOKEN_HERE with actual session token" -ForegroundColor Yellow
