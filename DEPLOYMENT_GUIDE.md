# 🚀 Production Deployment Guide v2.0.0

**Ready to deploy the complete Supabase Auth migration with role-based permissions!**

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### ✅ **Environment Setup**
- [ ] Production Supabase project configured
- [ ] OAuth providers (Google, Discord, GitHub) set up for production domain
- [ ] Environment variables ready for production
- [ ] Production database accessible

### ✅ **Code Readiness**
- [ ] All changes committed to Git
- [ ] Local testing completed successfully
- [ ] No console errors in development
- [ ] Authentication flows tested

## 🔧 **DEPLOYMENT STEPS**

### **Step 1: Database Migration**
```bash
# Apply all migrations to production database
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Verify migrations applied successfully
# Check for: "Finished supabase db push."
```

### **Step 2: Environment Variables (Production)**
```env
# Set these in your production environment (Vercel, etc.)
NEXT_PUBLIC_SUPABASE_URL=https://hnoiuyjdlecajbsjslwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### **Step 3: OAuth Configuration**
In Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://your-production-domain.com
Redirect URLs: 
- https://your-production-domain.com/auth/callback
- https://your-production-domain.com/en/auth/signin
```

### **Step 4: Deploy Application**
```bash
# If using Vercel
vercel --prod

# If using other platforms, follow their deployment process
```

### **Step 5: Post-Deployment Verification**
```bash
# Test authentication endpoint
curl https://your-domain.com/api/user/current-member

# Should return 401 (Unauthorized) - this is correct behavior
```

## 🧪 **PRODUCTION TESTING CHECKLIST**

### **Authentication Testing**
- [ ] Visit: `https://your-domain.com/en/auth/signin`
- [ ] Test Google OAuth login
- [ ] Test Discord OAuth login  
- [ ] Test GitHub OAuth login
- [ ] Test email/password authentication
- [ ] Verify no console errors during auth

### **Character Claiming Testing**
- [ ] After login, character claiming page appears
- [ ] Can select and claim a settlement character
- [ ] Character successfully linked to user account
- [ ] Navigation updates with role-based permissions

### **Role-Based Features Testing**
- [ ] User navigation shows appropriate role badge
- [ ] "Manage" badges appear for elevated permissions
- [ ] Settlement pages load correctly
- [ ] Treasury, Members, Projects accessible based on role
- [ ] Settlement Admin page restricted to Officers/Co-Owners

### **Security Testing**
- [ ] API endpoints require authentication
- [ ] Users can only see their settlement data
- [ ] Permission-based access working correctly
- [ ] Sign-out clears session completely

## 🎯 **SUCCESS CRITERIA**

### **Must Have (Deployment Blocking)**
- ✅ All OAuth providers working
- ✅ Character claiming process functional
- ✅ Role-based navigation displaying correctly
- ✅ No authentication errors in console
- ✅ Settlement features accessible with proper permissions

### **Should Have (High Priority)**
- ✅ Fast authentication response times
- ✅ Smooth user experience throughout
- ✅ Clear error messages if issues occur
- ✅ All settlement data loading correctly

## 🚨 **POTENTIAL ISSUES & SOLUTIONS**

### **OAuth Not Working**
**Symptoms**: OAuth providers redirect but don't complete authentication
**Solution**: Check redirect URLs in Supabase Dashboard match production domain exactly

### **Character Claiming Fails** 
**Symptoms**: Users can't claim characters after authentication
**Solution**: Verify database migrations applied and RLS policies are active

### **Permission Denied Errors**
**Symptoms**: Users can't access settlement features
**Solution**: Ensure character claiming completed and check user's settlement role

### **API 500 Errors**
**Symptoms**: Internal server errors on API calls
**Solution**: Verify environment variables set correctly and database accessible

## 📊 **MONITORING POST-DEPLOYMENT**

### **What to Watch**
- Authentication success/failure rates
- API response times
- Console error rates
- User session persistence
- Settlement feature usage

### **Key Metrics**
- **Authentication**: >95% success rate
- **API Responses**: <2s average response time
- **Error Rate**: <1% of requests
- **User Retention**: Sessions persist across page loads

## 🔙 **ROLLBACK PROCEDURE (Emergency)**

If critical issues arise:

### **Immediate Rollback**
```bash
# 1. Revert to previous Git commit
git revert HEAD --no-edit

# 2. Redeploy previous version
vercel --prod

# 3. Monitor for stability
```

### **Database Rollback (If Needed)**
```sql
-- Only if database issues - this will clear all auth data
UPDATE settlement_members SET auth_user_id = NULL;
-- Then restore NextAuth system
```

**⚠️ Warning**: Rollback will require all users to re-authenticate

## 📞 **SUPPORT CONTACTS**

### **During Deployment**
- **Development Team**: Available for immediate issues
- **Documentation**: [Authentication Guide](./docs/AUTHENTICATION.md)
- **Emergency Procedures**: [Deployment Changelog](./DEPLOYMENT_CHANGELOG.md)

### **Post-Deployment**
- **User Issues**: Guide users to re-authenticate and claim characters
- **Technical Issues**: Check logs and follow troubleshooting guides
- **Performance Issues**: Monitor metrics and optimize as needed

---

## 🎉 **DEPLOYMENT COMPLETE**

Once all tests pass:

1. **Announce to Users**: Authentication system has been upgraded
2. **User Action Required**: All users must sign in again and claim characters
3. **New Features**: Role-based navigation and improved security
4. **Support Ready**: Documentation and troubleshooting guides available

---

**🎯 Ready to deploy a production-grade settlement management system with enterprise authentication and security!**