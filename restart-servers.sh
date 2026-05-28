#!/bin/bash

echo "🛑 Stopping all servers..."

# Kill backend on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null
echo "✅ Backend stopped"

# Kill frontend on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null
echo "✅ Frontend stopped"

echo ""
echo "🚀 Starting backend..."
cd backend && npm run dev &

sleep 3

echo "🚀 Starting frontend..."
cd frontend && npm start &

echo ""
echo "✅ Servers starting..."
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:3000"
echo "Network: http://192.168.1.5:3000"
