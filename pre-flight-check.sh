#!/bin/bash

# TabbyMcTabface Pre-Flight Check
# Run this before switching computers to verify everything is ready

echo "🚀 TabbyMcTabface Pre-Flight Check"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Check function
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 - MISSING: $1"
        ((FAIL++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $2 - MISSING: $1"
        ((FAIL++))
    fi
}

check_optional() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((PASS++))
    else
        echo -e "${YELLOW}⚠${NC} $2 - Not found: $1"
        ((WARN++))
    fi
}

echo "📋 Core Files"
echo "-------------"
check_file "manifest.json" "manifest.json"
check_file "package.json" "package.json"
check_file "tsconfig.build.json" "tsconfig.build.json"
check_file "vitest.config.ts" "vitest.config.ts"
echo ""

echo "📄 Documentation"
echo "----------------"
check_file "README.md" "README.md"
check_file "docs/USER_GUIDE.md" "User Guide"
check_file "docs/EASTER_EGG_GUIDE.md" "Easter Egg Guide"
check_file "BUILD.md" "Build Instructions"
check_file "CHANGELOG.md" "Changelog"
check_file "COMPLETION_SUMMARY.md" "Completion Summary"
check_file "PRE_DEPLOYMENT_CHECKLIST.md" "Pre-Deployment Checklist"
check_file "QUICK_START.md" "Quick Start Guide"
echo ""

echo "💻 Source Code"
echo "--------------"
check_dir "src" "src/ directory"
check_dir "src/contracts" "contracts/"
check_dir "src/impl" "impl/"
check_dir "src/utils" "utils/"
check_file "src/bootstrap.ts" "bootstrap.ts"
check_file "src/background.ts" "background.ts"
echo ""

echo "🎨 UI Files"
echo "-----------"
check_file "popup.html" "popup.html"
check_file "popup.css" "popup.css"
check_file "popup.js" "popup.js"
echo ""

echo "📦 Content Data"
echo "---------------"
check_file "src/impl/quip-data.ts" "quip-data.ts"

# Count quips and easter eggs
if [ -f "src/impl/quip-data.ts" ]; then
    QUIPS=$(grep -c "id: 'PA-" src/impl/quip-data.ts)
    EGGS=$(grep -c "id: 'EE-" src/impl/quip-data.ts)
    echo -e "${GREEN}✓${NC} Found $QUIPS quips"
    echo -e "${GREEN}✓${NC} Found $EGGS easter eggs"
    ((PASS+=2))
fi
echo ""

echo "🧪 Tests"
echo "--------"
TEST_FILES=$(find src -name "*.test.ts" | wc -l | tr -d ' ')
echo -e "${GREEN}✓${NC} Found $TEST_FILES test files"
((PASS++))
echo ""

echo "🎨 Icons"
echo "--------"
check_dir "icons" "icons/ directory"
check_optional "icons/icon16.png" "icon16.png"
check_optional "icons/icon32.png" "icon32.png"
check_optional "icons/icon48.png" "icon48.png"
check_optional "icons/icon128.png" "icon128.png"
echo ""

echo "📊 Summary"
echo "=========="
echo -e "${GREEN}✓ Passed: $PASS${NC}"
if [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠ Warnings: $WARN${NC}"
fi
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}✗ Failed: $FAIL${NC}"
fi
echo ""

# Final verdict
if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
        echo "Ready to switch computers and build!"
    else
        echo -e "${YELLOW}⚠️  WARNINGS DETECTED${NC}"
        echo "Most likely missing icons - create them before building"
    fi
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo "Fix the missing files before proceeding"
    exit 1
fi

echo ""
echo "📝 Next Steps:"
echo "1. Create icons (4 PNG files) if not done"
echo "2. Switch to computer with Node.js"
echo "3. Follow QUICK_START.md"
echo "4. Run: npm install && npm test && npm run build"
echo ""

exit 0
