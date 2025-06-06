#!/bin/bash

echo "🔧 Running pre-commit checks..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Validating Docker build..."
    
    # Test Docker build syntax
    if docker build --dry-run . > /dev/null 2>&1; then
        echo "✅ Docker build syntax validation passed"
    else
        echo "❌ Docker build syntax validation failed"
        echo "🔧 Testing with docker-compose config..."
        if command -v docker-compose &> /dev/null; then
            docker-compose config > /dev/null 2>&1 || echo "⚠️ docker-compose.yml may have issues"
        fi
    fi
    
    # Validate Dockerfile content
    echo "🔍 Checking Dockerfile content..."
    if [ -f "Dockerfile" ]; then
        # Check for common issues
        if grep -q "COPY.*package.*json" Dockerfile; then
            echo "✅ Package files copied before npm install"
        else
            echo "⚠️ Consider copying package files before npm install for better caching"
        fi
        
        if grep -q "npm install.*--production\|npm ci" Dockerfile; then
            echo "✅ Production npm install detected"
        else
            echo "⚠️ Consider using npm ci or npm install --production for faster builds"
        fi
        
        # Check if EXPOSE directive exists
        if grep -q "EXPOSE" Dockerfile; then
            echo "✅ EXPOSE directive found"
        else
            echo "⚠️ No EXPOSE directive found - consider adding port exposure"
        fi
        
        # Check for health check
        if grep -q "HEALTHCHECK\|healthcheck" Dockerfile; then
            echo "✅ Health check configuration found"
        else
            echo "ℹ️ Consider adding HEALTHCHECK for better monitoring"
        fi
    fi
else
    echo "⚠️ Docker not available, skipping build validation"
fi

# Validate frontend build
if [ -d "frontend" ]; then
    echo "⚛️ Checking frontend build..."
    cd frontend
    if [ -f "package.json" ]; then
        # Check if build directory exists and is recent
        if [ -d "build" ] && [ "build" -nt "src" ]; then
            echo "✅ Frontend build is up to date"
        else
            echo "🔄 Frontend build may be outdated"
        fi
    fi
    cd ..
fi

# Validate backend dependencies
if [ -d "backend" ]; then
    echo "🚀 Checking backend..."
    cd backend
    if [ -f "package.json" ]; then
        if [ -d "node_modules" ]; then
            echo "✅ Backend dependencies installed"
        else
            echo "⚠️ Backend dependencies may need installation"
        fi
    fi
    cd ..
fi

# Check for common issues
echo "🔍 Checking for common issues..."

# Check for large files that shouldn't be committed
find . -type f -size +10M -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | while read file; do
    echo "⚠️ Large file detected: $file"
done

# Check for sensitive information patterns
if command -v grep &> /dev/null; then
    if grep -r "password\|secret\|api_key\|private_key" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" . 2>/dev/null | grep -v node_modules | grep -v "secrets.GITHUB_TOKEN" | head -5; then
        echo "⚠️ Potential sensitive information found (review above)"
    fi
fi

# Check GitHub Actions workflow files
echo "🔍 Checking GitHub Actions workflows..."
if [ -d ".github/workflows" ]; then
    for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
        if [ -f "$workflow" ]; then
            echo "📋 Checking $workflow..."
            
            # Check for deprecated CodeQL action versions
            if grep -q "github/codeql-action.*@v[12]" "$workflow"; then
                echo "⚠️ Deprecated CodeQL action version found in $workflow (use @v3)"
            fi
            
            # Check for proper Docker build dependencies
            if grep -q "trivy-action" "$workflow"; then
                if ! grep -q "docker/build-push-action" "$workflow"; then
                    echo "⚠️ Trivy scan without Docker build in $workflow"
                fi
            fi
            
            # Check for proper image references in security scans
            if grep -q "image-ref.*test" "$workflow"; then
                echo "ℹ️ Test image reference found - ensure image exists for scanning"
            fi
        fi
    done
fi

echo "✅ Pre-commit checks completed"
