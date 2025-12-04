#!/bin/bash

echo "🧪 Testing PolyDraft API Endpoints"
echo "=================================="

# Test 1: List leagues (should work even without data)
echo "📋 Test 1: GET /api/leagues"
curl -s -w "\nStatus: %{http_code}\n" -X GET http://localhost:3000/api/leagues || echo "❌ Failed to connect"

echo -e "\n---"

# Test 2: Create league (should validate input)
echo "🏗️  Test 2: POST /api/leagues (invalid data)"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/leagues \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 3: Create league (valid format but will fail without Supabase)
echo "🏗️  Test 3: POST /api/leagues (valid format)"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/leagues \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test League",
    "creator_address": "0x1234567890123456789012345678901234567890",
    "end_time": "2024-12-31T23:59:59Z",
    "max_players": 6
  }' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 4: Get league details (should return 404)
echo "📊 Test 4: GET /api/leagues/[id]"
curl -s -w "\nStatus: %{http_code}\n" -X GET http://localhost:3000/api/leagues/test-id || echo "❌ Failed to connect"

echo -e "\n---"

# Test 5: Join league (should validate input)
echo "👥 Test 5: POST /api/leagues/[id]/join"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/leagues/test-id/join \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890123456789012345678901234567890"}' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 6: Draft start (should validate input)
echo "🎯 Test 6: POST /api/draft/start"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/draft/start \
  -H "Content-Type: application/json" \
  -d '{
    "league_id": "test-id",
    "creator_address": "0x1234567890123456789012345678901234567890"
  }' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 7: Draft pick (should validate input)
echo "🎲 Test 7: POST /api/draft/pick"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/draft/pick \
  -H "Content-Type: application/json" \
  -d '{
    "league_id": "test-id",
    "wallet_address": "0x1234567890123456789012345678901234567890",
    "market_id": "test-market",
    "outcome_side": "YES"
  }' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 8: Scoring calculate (should validate input)
echo "🏆 Test 8: POST /api/scoring/calculate"
curl -s -w "\nStatus: %{http_code}\n" -X POST http://localhost:3000/api/scoring/calculate \
  -H "Content-Type: application/json" \
  -d '{"league_id": "test-id"}' || echo "❌ Failed to connect"

echo -e "\n---"

# Test 9: Get trending markets (should work)
echo "📈 Test 9: GET /api/trending"
curl -s -w "\nStatus: %{http_code}\n" -X GET http://localhost:3000/api/trending || echo "❌ Failed to connect"

echo -e "\n=================================="
echo "✅ API Endpoint Testing Complete!"
echo ""
echo "📝 Summary:"
echo "   - All endpoints should return proper HTTP status codes"
echo "   - Validation should catch missing/invalid fields"
echo "   - CORS headers should be present"
echo "   - Error responses should be in JSON format"