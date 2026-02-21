#!/bin/bash

# Dozi Frontend Setup Verification Script
# Run this to verify your frontend setup is correct

set -e

echo "🔍 Verifying Dozi Frontend Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check Node.js version
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js installed: $NODE_VERSION"
else
    print_status 1 "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check pnpm
echo ""
echo "Checking pnpm..."
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_status 0 "pnpm installed: $PNPM_VERSION"
else
    print_status 1 "pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

# Check if node_modules exists
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    print_status 1 "Dependencies not installed. Run: pnpm install"
    exit 1
fi

# Check backend connectivity
echo ""
echo "Checking backend connectivity..."
if curl -s -f -o /dev/null http://localhost:8000/health 2>/dev/null; then
    print_status 0 "Backend is reachable at http://localhost:8000"
else
    print_warning "Backend not reachable at http://localhost:8000"
    echo "         Start backend with: uv run uvicorn src.dozi.main:app --reload"
fi

# Check if .env exists
echo ""
echo "Checking environment configuration..."
if [ -f "apps/web/.env" ]; then
    print_status 0 ".env file exists"
else
    print_warning ".env file not found in apps/web/"
    echo "         Copy .env.example: cp apps/web/.env.example apps/web/.env"
fi

# Check TypeScript compilation
echo ""
echo "Checking TypeScript configuration..."
if pnpm type-check &> /dev/null; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation failed. Run: pnpm type-check"
fi

# Check package structure
echo ""
echo "Checking package structure..."
PACKAGES=("packages/shared" "packages/api-client" "packages/ui" "apps/web")
for pkg in "${PACKAGES[@]}"; do
    if [ -d "$pkg" ]; then
        print_status 0 "$pkg exists"
    else
        print_status 1 "$pkg not found"
    fi
done

# Summary
echo ""
echo "================================================"
echo "📋 Verification Summary"
echo "================================================"
echo ""
echo "✅ Setup is complete!"
echo ""
echo "Next steps:"
echo "  1. Start the development server: pnpm dev"
echo "  2. Open browser to: http://localhost:3000"
echo "  3. Create a room and test the flow"
echo ""
echo "For detailed instructions, see QUICKSTART.md"
echo ""
