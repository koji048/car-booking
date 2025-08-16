#!/bin/bash

# ============================================
# Secret Detection Script
# Prevents committing sensitive data to git
# ============================================

echo "🔍 Scanning for sensitive data..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any secrets found
SECRETS_FOUND=0

# Function to check for patterns
check_pattern() {
    local pattern=$1
    local description=$2
    local files=$(git diff --cached --name-only | xargs grep -l "$pattern" 2>/dev/null)
    
    if [ ! -z "$files" ]; then
        echo -e "${RED}❌ Found $description in:${NC}"
        echo "$files"
        SECRETS_FOUND=1
    fi
}

# Check for common secret patterns
echo "Checking for API keys and tokens..."
check_pattern "api[_-]?key.*=.*['\"].*['\"]" "API keys"
check_pattern "token.*=.*['\"].*['\"]" "tokens"
check_pattern "secret.*=.*['\"].*['\"]" "secrets"
check_pattern "password.*=.*['\"].*['\"]" "passwords"

# Check for specific patterns
echo "Checking for database credentials..."
check_pattern "postgresql://.*:.*@" "database URLs with credentials"
check_pattern "mysql://.*:.*@" "database URLs with credentials"
check_pattern "mongodb://.*:.*@" "database URLs with credentials"

# Check for IP addresses (internal)
echo "Checking for internal IP addresses..."
check_pattern "192\.168\.[0-9]{1,3}\.[0-9]{1,3}" "internal IP addresses"
check_pattern "10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" "internal IP addresses"
check_pattern "172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}" "internal IP addresses"

# Check for AWS keys
echo "Checking for AWS credentials..."
check_pattern "AKIA[0-9A-Z]{16}" "AWS Access Key IDs"
check_pattern "aws[_-]?secret[_-]?access[_-]?key" "AWS Secret Keys"

# Check for private keys
echo "Checking for private keys..."
check_pattern "-----BEGIN RSA PRIVATE KEY-----" "RSA private keys"
check_pattern "-----BEGIN PRIVATE KEY-----" "private keys"
check_pattern "-----BEGIN OPENSSH PRIVATE KEY-----" "SSH private keys"

# Check if .env files are being committed
echo "Checking for environment files..."
ENV_FILES=$(git diff --cached --name-only | grep -E "\.env$|\.env\.|env\..*\.local$")
if [ ! -z "$ENV_FILES" ]; then
    echo -e "${RED}❌ Attempting to commit environment files:${NC}"
    echo "$ENV_FILES"
    SECRETS_FOUND=1
fi

# Final result
echo ""
if [ $SECRETS_FOUND -eq 1 ]; then
    echo -e "${RED}⚠️  COMMIT BLOCKED: Sensitive data detected!${NC}"
    echo -e "${YELLOW}Please remove sensitive data before committing.${NC}"
    echo -e "${YELLOW}Use environment variables instead of hardcoding secrets.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No sensitive data detected. Safe to commit!${NC}"
    exit 0
fi