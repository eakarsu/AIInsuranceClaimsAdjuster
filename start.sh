#!/bin/bash

#############################################
# AI Insurance Claims Adjuster - Start Script
# Cleans ports, sets up DB, seeds data, and
# starts backend + frontend with hot reload
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  AI Insurance Claims Adjuster${NC}"
echo -e "${CYAN}  Starting Application...${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# ---- Step 1: Clean up used ports ----
echo -e "${YELLOW}[1/6] Cleaning up ports 3001 and 3000...${NC}"

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    else
        echo -e "  ${GREEN}Port $port is available${NC}"
    fi
}

cleanup_port 3001
cleanup_port 3000

# ---- Step 2: Check PostgreSQL ----
echo ""
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
    if pg_isready -q 2>/dev/null; then
        echo -e "  ${GREEN}PostgreSQL is running${NC}"
    else
        echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
        if command -v brew &> /dev/null; then
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
        fi
        sleep 2
        if pg_isready -q 2>/dev/null; then
            echo -e "  ${GREEN}PostgreSQL started${NC}"
        else
            echo -e "  ${RED}Could not start PostgreSQL. Please start it manually.${NC}"
            exit 1
        fi
    fi
else
    echo -e "  ${YELLOW}pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ---- Step 3: Create database ----
echo ""
echo -e "${YELLOW}[3/6] Setting up database...${NC}"

# Load env vars
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | grep -v '^$' | xargs)
fi

DB_NAME=${DB_NAME:-insurance_claims_db}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Create database if it doesn't exist
if command -v createdb &> /dev/null; then
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null && \
        echo -e "  ${GREEN}Database '$DB_NAME' created${NC}" || \
        echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"
else
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME" 2>/dev/null
    echo -e "  ${GREEN}Database ready${NC}"
fi

# ---- Step 4: Install dependencies ----
echo ""
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing backend dependencies...${NC}"
cd "$BACKEND_DIR"
npm install --silent 2>&1 | tail -1

echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install --silent 2>&1 | tail -1

echo -e "  ${GREEN}Dependencies installed${NC}"

# ---- Step 5: Seed database ----
echo ""
echo -e "${YELLOW}[5/6] Seeding database...${NC}"

cd "$BACKEND_DIR"
node seed.js
echo -e "  ${GREEN}Database seeded successfully${NC}"

# ---- Step 6: Start servers ----
echo ""
echo -e "${YELLOW}[6/6] Starting servers...${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    echo -e "${GREEN}Application stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon (hot reload)
echo -e "  ${BLUE}Starting backend on port 3001 (with hot reload)...${NC}"
cd "$BACKEND_DIR"
npx nodemon server.js &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend with Vite (hot reload built-in)
echo -e "  ${BLUE}Starting frontend on port 5173 (with hot reload)...${NC}"
cd "$FRONTEND_DIR"
npx vite --host &
FRONTEND_PID=$!

sleep 3

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Application is running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  ${CYAN}Frontend:${NC}  http://localhost:3000"
echo -e "  ${CYAN}Backend:${NC}   http://localhost:3001"
echo ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "    Email:    admin@insurance.com"
echo -e "    Password: password123"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Wait for background processes
wait
