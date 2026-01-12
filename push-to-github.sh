#!/bin/bash

# Script to push changes to GitHub repository: https://github.com/agrawalpuran/uds-refactor
# Usage: ./push-to-github.sh [commit-message]
# Example: ./push-to-github.sh "Fix ObjectId casting issues in designation eligibility"

set -e  # Exit on error

# Get commit message from argument or use default
COMMIT_MSG="${1:-Update project files}"

# Remote name for the refactor repository
REMOTE_NAME="refactor"
BRANCH_NAME="main"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Push Script${NC}"
echo -e "${BLUE}Repository: https://github.com/agrawalpuran/uds-refactor${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📋 Checking git status...${NC}"
git status --short

echo -e "\n${YELLOW}📦 Staging all changes...${NC}"
git add .

echo -e "\n${YELLOW}💾 Committing changes with message: '${COMMIT_MSG}'${NC}"
if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
    exit 0
fi

git commit -m "$COMMIT_MSG" || {
    echo -e "${RED}❌ Commit failed.${NC}"
    exit 1
}

echo -e "\n${YELLOW}🚀 Pushing to GitHub (${REMOTE_NAME}/${BRANCH_NAME})...${NC}"
if git push -u ${REMOTE_NAME} ${BRANCH_NAME} 2>&1; then
    echo -e "\n${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo -e "${GREEN}   Repository: https://github.com/agrawalpuran/uds-refactor${NC}"
    echo -e "${GREEN}   Branch: ${BRANCH_NAME}${NC}"
else
    echo -e "${RED}❌ Push failed. Trying alternative method...${NC}"
    git push --set-upstream ${REMOTE_NAME} ${BRANCH_NAME} || {
        echo -e "${RED}❌ Push failed. Please check:${NC}"
        echo -e "${RED}   1. Git configuration${NC}"
        echo -e "${RED}   2. Network connection${NC}"
        echo -e "${RED}   3. Remote repository access${NC}"
        exit 1
    }
    echo -e "\n${GREEN}✅ Successfully pushed to GitHub!${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
