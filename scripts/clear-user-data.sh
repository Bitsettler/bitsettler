#!/bin/bash

# Clear User Data for Testing
# This script clears all user assignments and auth data while preserving BitJita synced data

echo "🧹 Clearing user data for testing..."
echo "⚠️  This will:"
echo "   • Clear all user assignments (supabase_user_id)"
echo "   • Clear all profession choices"
echo "   • Clear all user profiles and settings"
echo "   • Clear all projects, contributions, and saves"
echo "   • Clear all Supabase auth users"
echo ""
echo "✅ This will PRESERVE:"
echo "   • All member records and their BitJita data"
echo "   • All skills and levels"
echo "   • All game permissions and sync data"
echo ""

# Check if running in development
if [ "$NODE_ENV" != "development" ] && [ -z "$FORCE" ]; then
    echo "⚠️  Warning: Not in development environment"
    echo "   Set FORCE=1 to run anyway (not recommended for production)"
    exit 1
fi

# Confirm with user
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Make the API call
echo "Making API call to clear user data..."
response=$(curl -s -X POST http://localhost:3000/api/testing/clear-user-data \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

# Extract HTTP status
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_STATUS:/d')

# Check result
if [ "$http_status" = "200" ]; then
    echo "✅ Success! User data cleared."
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
else
    echo "❌ Failed! HTTP Status: $http_status"
    echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    exit 1
fi

echo ""
echo "🎉 Ready for fresh testing!"
echo "   • All characters are now unclaimed"
echo "   • All user-specific data cleared"
echo "   • BitJita data preserved"