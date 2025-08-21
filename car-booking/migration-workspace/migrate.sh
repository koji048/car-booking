#!/bin/bash

# Car Booking System - Monorepo to Multi-repo Migration Script
# This script helps automate the migration process

set -e  # Exit on error

echo "🚀 Car Booking System - Migration Tool"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
GITHUB_ORG="car-booking-system"
PACKAGES=("types" "utils" "ui")
APPS=("api" "web" "mobile")

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for required tools
    command -v git >/dev/null 2>&1 || { print_error "git is required but not installed."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed."; exit 1; }
    command -v gh >/dev/null 2>&1 || print_warning "GitHub CLI (gh) is not installed. Manual repo creation will be needed."
    
    print_success "Prerequisites check passed!"
}

# Function to setup npm registry
setup_registry() {
    print_status "Setting up npm registry..."
    
    echo "Choose registry option:"
    echo "1) GitHub Packages (recommended)"
    echo "2) npm Public Registry"
    echo "3) Skip (already configured)"
    read -p "Select option (1-3): " registry_option
    
    case $registry_option in
        1)
            print_status "Setting up GitHub Packages..."
            read -p "Enter your GitHub Personal Access Token: " github_token
            echo "@car-booking:registry=https://npm.pkg.github.com" >> ~/.npmrc
            echo "//npm.pkg.github.com/:_authToken=${github_token}" >> ~/.npmrc
            print_success "GitHub Packages configured!"
            ;;
        2)
            print_status "Using npm public registry..."
            print_warning "Make sure you have an npm account and are logged in"
            npm login
            ;;
        3)
            print_status "Skipping registry setup..."
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
}

# Function to extract a package
extract_package() {
    local package_name=$1
    local source_path="../packages/${package_name}"
    local target_path="car-booking-${package_name}"
    
    print_status "Extracting ${package_name} package..."
    
    if [ -d "$target_path" ]; then
        print_warning "${target_path} already exists, skipping..."
        return
    fi
    
    # Create directory and copy files
    mkdir -p "$target_path"
    cp -r "$source_path"/* "$target_path/"
    
    # Update package.json for standalone
    cd "$target_path"
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial setup of @car-booking/${package_name} package"
    
    # Create GitHub repo if gh is available
    if command -v gh >/dev/null 2>&1; then
        print_status "Creating GitHub repository..."
        gh repo create "${GITHUB_ORG}/car-booking-${package_name}" --private --source=. --remote=origin --push
    else
        print_warning "Please manually create repository: ${GITHUB_ORG}/car-booking-${package_name}"
    fi
    
    cd ..
    print_success "${package_name} package extracted successfully!"
}

# Function to extract an application
extract_app() {
    local app_name=$1
    local source_path="../apps/${app_name}"
    local target_path="car-booking-${app_name}"
    
    print_status "Extracting ${app_name} application..."
    
    if [ -d "$target_path" ]; then
        print_warning "${target_path} already exists, skipping..."
        return
    fi
    
    # Create directory and copy files
    mkdir -p "$target_path"
    cp -r "$source_path"/* "$target_path/"
    
    # Copy relevant config files
    if [ -f "../.env.example" ]; then
        cp "../.env.example" "$target_path/"
    fi
    
    cd "$target_path"
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial setup of car-booking-${app_name}"
    
    # Create GitHub repo if gh is available
    if command -v gh >/dev/null 2>&1; then
        print_status "Creating GitHub repository..."
        gh repo create "${GITHUB_ORG}/car-booking-${app_name}" --private --source=. --remote=origin --push
    else
        print_warning "Please manually create repository: ${GITHUB_ORG}/car-booking-${app_name}"
    fi
    
    cd ..
    print_success "${app_name} application extracted successfully!"
}

# Function to update dependencies
update_dependencies() {
    print_status "Updating dependencies to use published packages..."
    
    for dir in car-booking-*/; do
        if [ -d "$dir" ]; then
            cd "$dir"
            print_status "Updating dependencies in ${dir}..."
            
            # Update @car-booking/* dependencies to use registry
            if [ -f "package.json" ]; then
                npm install
            fi
            
            cd ..
        fi
    done
}

# Main menu
show_menu() {
    echo ""
    echo "Select migration step:"
    echo "1) Check prerequisites"
    echo "2) Setup npm registry"
    echo "3) Extract all packages"
    echo "4) Extract all applications"
    echo "5) Update all dependencies"
    echo "6) Full migration (all steps)"
    echo "7) Exit"
    read -p "Select option (1-7): " choice
    
    case $choice in
        1)
            check_prerequisites
            show_menu
            ;;
        2)
            setup_registry
            show_menu
            ;;
        3)
            for package in "${PACKAGES[@]}"; do
                extract_package "$package"
            done
            show_menu
            ;;
        4)
            for app in "${APPS[@]}"; do
                extract_app "$app"
            done
            show_menu
            ;;
        5)
            update_dependencies
            show_menu
            ;;
        6)
            check_prerequisites
            setup_registry
            for package in "${PACKAGES[@]}"; do
                extract_package "$package"
            done
            for app in "${APPS[@]}"; do
                extract_app "$app"
            done
            update_dependencies
            print_success "Migration completed!"
            ;;
        7)
            print_status "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            show_menu
            ;;
    esac
}

# Start the script
check_prerequisites
show_menu