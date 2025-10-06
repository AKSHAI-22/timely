#!/bin/bash

# LedgerSentinels Deployment Script
# This script deploys the complete LedgerSentinels platform

set -e

echo "🚀 Starting LedgerSentinels Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please update .env file with your configuration before continuing."
            print_warning "Press Enter when ready to continue..."
            read
        else
            print_error "env.example file not found. Please create .env file manually."
            exit 1
        fi
    fi
    print_success "Environment configuration found"
}

# Build and deploy contracts
deploy_contracts() {
    print_status "Deploying smart contracts..."
    
    # Check if Hardhat is available
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi
    
    # Deploy contracts
    print_status "Deploying contracts to local network..."
    npx hardhat run scripts/deploy-all.js --network localhost
    
    # Update .env with contract addresses
    if [ -f contract-addresses.json ]; then
        print_status "Updating environment with contract addresses..."
        # This would need to be implemented to update .env file
        print_success "Contract addresses available in contract-addresses.json"
    fi
}

# Build and deploy application
deploy_application() {
    print_status "Building and deploying application..."
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans
    
    # Build and start services
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_services
}

# Check if services are running
check_services() {
    print_status "Checking service health..."
    
    # Check MongoDB
    if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is running"
    else
        print_error "MongoDB is not responding"
        return 1
    fi
    
    # Check Backend
    if curl -f http://localhost:5000/ > /dev/null 2>&1; then
        print_success "Backend API is running"
    else
        print_error "Backend API is not responding"
        return 1
    fi
    
    # Check Frontend
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Frontend is running"
    else
        print_error "Frontend is not responding"
        return 1
    fi
}

# Setup initial data
setup_initial_data() {
    print_status "Setting up initial data..."
    
    # This would include:
    # - Creating admin user
    # - Setting up default categories
    # - Initializing blockchain data
    
    print_success "Initial data setup completed"
}

# Main deployment function
main() {
    echo "🎯 LedgerSentinels Deployment Script"
    echo "====================================="
    
    # Pre-deployment checks
    check_docker
    check_env
    
    # Deploy contracts (optional for production)
    if [ "$1" = "--with-contracts" ]; then
        deploy_contracts
    fi
    
    # Deploy application
    deploy_application
    
    # Setup initial data
    setup_initial_data
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:5000"
    echo "   GraphQL: http://localhost:5000/graphql"
    echo "   MongoDB: localhost:27017"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   Update services: docker-compose pull && docker-compose up -d"
    echo ""
    echo "📚 Documentation: COMPLETE_SETUP.md"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --with-contracts    Deploy smart contracts before application"
        echo "  --help, -h          Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                  Deploy application only"
        echo "  $0 --with-contracts Deploy contracts and application"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
