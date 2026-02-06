#!/bin/bash
# Test CORS Configuration
# Usage: ./scripts/test-cors.sh

set -e

API_URL="${API_URL:-http://localhost:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "Testing CORS configuration..."
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Preflight request (OPTIONS)
echo "Test 1: OPTIONS preflight request"
response=$(curl -s -i -X OPTIONS \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$API_URL/health" 2>&1)

if echo "$response" | grep -q "Access-Control-Allow-Origin: $FRONTEND_URL"; then
  echo "✅ CORS headers present"
else
  echo "❌ CORS headers missing"
  echo "$response"
  exit 1
fi

if echo "$response" | grep -q "HTTP/[0-9.]* 204"; then
  echo "✅ OPTIONS returns 204 No Content"
else
  echo "❌ OPTIONS request failed"
  echo "$response"
  exit 1
fi

echo ""

# Test 2: Actual request with Origin header
echo "Test 2: GET request with Origin header"
response=$(curl -s -i -X GET \
  -H "Origin: $FRONTEND_URL" \
  "$API_URL/health" 2>&1)

if echo "$response" | grep -q "Access-Control-Allow-Origin: $FRONTEND_URL"; then
  echo "✅ CORS headers present on GET request"
else
  echo "❌ CORS headers missing on GET request"
  echo "$response"
  exit 1
fi

if echo "$response" | grep -q "Access-Control-Allow-Credentials: true"; then
  echo "✅ Credentials allowed"
else
  echo "❌ Credentials not allowed"
  echo "$response"
  exit 1
fi

echo ""
echo "✅ All CORS tests passed!"
echo ""
echo "Next steps:"
echo "1. Run E2E tests: pnpm --filter=front test:e2e"
echo "2. Verify 7 auth tests now pass"
