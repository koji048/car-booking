#!/bin/bash

# ============================================
# Pre-Push Security Check
# Run this before pushing to remote repository
# ============================================

echo "🔒 Running Security Checks Before Push..."
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES_FOUND=0

# 1. Check for .env files in git
echo -e "${BLUE}1. Checking for tracked .env files...${NC}"
ENV_FILES=$(git ls-files | grep -E "\.env$|\.env\." | grep -v "\.env\.example")
if [ ! -z "$ENV_FILES" ]; then
    echo -e "${RED}❌ Found .env files tracked in git:${NC}"
    echo "$ENV_FILES"
    echo -e "${YELLOW}   Fix: git rm --cached <file> then add to .gitignore${NC}"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No .env files tracked${NC}"
fi

# 2. Check for hardcoded passwords in staged files
echo -e "${BLUE}2. Checking for hardcoded passwords...${NC}"
PASSWORDS=$(git grep -i -E "password\s*=\s*['\"][^'\"]+['\"]" -- '*.ts' '*.tsx' '*.js' '*.jsx' | grep -v ".env.example" | grep -v "password-placeholder")
if [ ! -z "$PASSWORDS" ]; then
    echo -e "${RED}❌ Found potential hardcoded passwords:${NC}"
    echo "$PASSWORDS" | head -5
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No hardcoded passwords found${NC}"
fi

# 3. Check for API keys
echo -e "${BLUE}3. Checking for API keys...${NC}"
API_KEYS=$(git grep -E "(api[_-]?key|apikey|api_secret)" -- '*.ts' '*.tsx' '*.js' '*.jsx' | grep -v ".env.example" | grep -v "process.env")
if [ ! -z "$API_KEYS" ]; then
    echo -e "${YELLOW}⚠️  Found potential API key references:${NC}"
    echo "$API_KEYS" | head -5
    echo -e "${YELLOW}   Make sure these are from environment variables${NC}"
fi

# 4. Check for database URLs with credentials
echo -e "${BLUE}4. Checking for database credentials...${NC}"
DB_URLS=$(git grep -E "(postgresql|mysql|mongodb)://[^:]+:[^@]+@" -- '*.ts' '*.tsx' '*.js' '*.jsx' | grep -v ".env.example")
if [ ! -z "$DB_URLS" ]; then
    echo -e "${RED}❌ Found database URLs with credentials:${NC}"
    echo "$DB_URLS"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No database credentials in code${NC}"
fi

# 5. Check for internal IP addresses
echo -e "${BLUE}5. Checking for internal IP addresses...${NC}"
IPS=$(git grep -E "192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\." -- '*.ts' '*.tsx' '*.js' '*.jsx' | grep -v ".env.example" | grep -v "comments")
if [ ! -z "$IPS" ]; then
    echo -e "${YELLOW}⚠️  Found internal IP addresses:${NC}"
    echo "$IPS" | head -5
    echo -e "${YELLOW}   Consider using environment variables for server addresses${NC}"
fi

# 6. Check .gitignore exists and has proper entries
echo -e "${BLUE}6. Checking .gitignore configuration...${NC}"
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        echo -e "${GREEN}✅ .gitignore properly configured for .env files${NC}"
    else
        echo -e "${YELLOW}⚠️  .gitignore missing .env pattern${NC}"
        ISSUES_FOUND=1
    fi
else
    echo -e "${RED}❌ No .gitignore file found!${NC}"
    ISSUES_FOUND=1
fi

# 7. Check for private keys
echo -e "${BLUE}7. Checking for private keys...${NC}"
PRIVATE_KEYS=$(git grep -l "BEGIN.*PRIVATE KEY" -- '*.pem' '*.key' '*.crt' 2>/dev/null)
if [ ! -z "$PRIVATE_KEYS" ]; then
    echo -e "${RED}❌ Found private key files:${NC}"
    echo "$PRIVATE_KEYS"
    ISSUES_FOUND=1
else
    echo -e "${GREEN}✅ No private keys in repository${NC}"
fi

# Final Report
echo ""
echo "========================================="
if [ $ISSUES_FOUND -eq 1 ]; then
    echo -e "${RED}⚠️  SECURITY ISSUES FOUND!${NC}"
    echo -e "${YELLOW}Please fix the issues above before pushing.${NC}"
    echo ""
    echo "Tips:"
    echo "- Use environment variables for all secrets"
    echo "- Add sensitive files to .gitignore"
    echo "- Remove tracked files with: git rm --cached <file>"
    exit 1
else
    echo -e "${GREEN}✅ ALL SECURITY CHECKS PASSED!${NC}"
    echo -e "${GREEN}Your code is ready to push.${NC}"
    exit 0
fi