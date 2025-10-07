#!/bin/bash

# Performance testing script for Sportello Notai Backend
# Esegue test di carico e benchmark

echo "⚡ Sportello Notai - Performance Testing Suite"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo "🔍 Checking if server is running..."
if curl -s http://localhost:8001/health/ > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running!${NC}"
    echo "Start server with: python manage.py runserver 0.0.0.0:8001"
    echo "Or with gunicorn: gunicorn core.wsgi:application -c gunicorn.conf.py"
    exit 1
fi

echo ""

# Health Check
echo "🏥 Running health check..."
health_response=$(curl -s http://localhost:8001/health/)
echo "$health_response" | python -m json.tool
echo ""

# Test 1: Simple load test
echo "📊 Test 1: Simple Load Test (100 users, 1 minute)"
echo "================================================"
locust -f locustfile.py --host http://localhost:8001 \
  --users 100 --spawn-rate 10 --run-time 1m --headless \
  --html reports/load_test_100users.html \
  --csv reports/load_test_100users

echo ""

# Test 2: Stress test
echo "📊 Test 2: Stress Test (500 users, 2 minutes)"
echo "=============================================="
locust -f locustfile.py --host http://localhost:8001 \
  --users 500 --spawn-rate 25 --run-time 2m --headless \
  --html reports/stress_test_500users.html \
  --csv reports/stress_test_500users

echo ""

# Test 3: Spike test
echo "📊 Test 3: Spike Test (1000 users, 30 seconds)"
echo "=============================================="
locust -f locustfile.py --host http://localhost:8001 \
  --users 1000 --spawn-rate 100 --run-time 30s --headless \
  --html reports/spike_test_1000users.html \
  --csv reports/spike_test_1000users

echo ""

# Summary
echo "✅ Testing completed!"
echo ""
echo "📈 Reports generated:"
echo "  - reports/load_test_100users.html"
echo "  - reports/stress_test_500users.html"
echo "  - reports/spike_test_1000users.html"
echo ""
echo "📊 Open reports in browser to see detailed metrics."
echo ""
echo "🎯 Target Metrics:"
echo "  - P50 Latency: < 100ms"
echo "  - P95 Latency: < 500ms"
echo "  - P99 Latency: < 1000ms"
echo "  - Error Rate: < 0.1%"
echo "  - Throughput: > 1000 req/s"
echo ""
echo "Done! 🚀"

