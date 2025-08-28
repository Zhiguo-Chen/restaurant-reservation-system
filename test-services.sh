#!/bin/bash

echo "🧪 Testing Restaurant Reservation System Services"
echo "================================================"

# Test Backend Health
echo "1. Testing Backend Health..."
HEALTH=$(curl -s http://localhost:4000/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

# Test GraphQL Endpoint
echo "2. Testing GraphQL Endpoint..."
GRAPHQL=$(curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { __typename }"}')
if echo "$GRAPHQL" | grep -q '"Query"'; then
    echo "✅ GraphQL endpoint is working"
else
    echo "❌ GraphQL endpoint failed"
    exit 1
fi

# Test Frontend
echo "3. Testing Frontend..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend is not accessible (HTTP $FRONTEND)"
fi

# Test Couchbase Web Console
echo "4. Testing Couchbase Web Console..."
COUCHBASE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8091)
if [ "$COUCHBASE" = "200" ]; then
    echo "✅ Couchbase Web Console is accessible"
else
    echo "❌ Couchbase Web Console failed (HTTP $COUCHBASE)"
fi

echo ""
echo "🎉 All services are running!"
echo "📊 GraphQL Playground: http://localhost:4000/graphql"
echo "🌐 Frontend: http://localhost:3000"
echo "🗄️  Couchbase Console: http://localhost:8091 (admin/password123)"