# 📋 Development TODO
**BitCraft.Guide Settlement Management System**

Current development priorities and planned features.

---

## 🔥 **High Priority**

### **Settlement System Enhancements**
- [ ] **Profession Avatar Images** - Add 18 profession images to `public/assets/ProfessionAvatars/`
  - Format: `.webp` files, 512x512px recommended
  - Required professions: Alchemy, Artificing, Carpentry, Fishing, Forestry, Hunting, Leatherworking, Magic, Metallurgy, Mining, Ranching, Research, Tailoring, Terraforming, Textiles, Trading, Transportation, Weaponsmithing
  - See `public/assets/ProfessionAvatars/README.md` for details

- [ ] **Member Search & Filtering** - Enhanced member management
  - Search by name, profession, skill level
  - Filter by role, activity status, profession preferences
  - Sort by various criteria (skill levels, join date, activity)

### **Calculator System Improvements**
- [ ] **Recipe Removal Functionality** - Allow users to remove items from calculator
- [ ] **Depth Slider** - Auto-expansion control for recipe trees
- [ ] **Export Features** - Save calculations to image/CSV formats
- [ ] **Material List View** - Tab showing all required materials in list format
- [ ] **Multi-material Checkbox Bug** - Fix selection issues in calculator

---

## 🚀 **Medium Priority**

### **User Experience Enhancements**
- [ ] **Enhanced Profile Customization** - Extended user profile options
  - Custom avatar uploads
  - Biography and settlement role descriptions
  - Timezone and contact preferences
  - Activity and notification settings

- [ ] **Real-time Updates** - WebSocket integration for live data
  - Live settlement member status updates
  - Real-time treasury balance changes
  - Instant project contribution notifications
  - Live member skill level changes

### **Content & SEO**
- [ ] **Individual Item Pages** - Detailed compendium pages for each item
  - Complete item information and statistics
  - Usage examples and crafting recipes
  - Related items and alternative options

- [ ] **Internationalization Completion** - Complete translation coverage
  - Update missing page translations
  - Profession and skill name translations
  - Error message and UI element translations

- [ ] **SEO Optimization** - Improve search engine visibility
  - Update metadata for all pages
  - Add structured data markup
  - Optimize page titles and descriptions

---

## 🔮 **Future Features**

### **Advanced Settlement Features**
- [ ] **Activity Tracking System** - Detailed member activity analytics
  - Login frequency and duration tracking
  - Feature usage analytics
  - Settlement engagement metrics

- [ ] **Project Management Enhancements** - Advanced project tracking
  - Project timelines and milestones
  - Resource requirement tracking
  - Member contribution analytics

- [ ] **Treasury Analytics** - Advanced financial insights
  - Spending patterns and trends
  - Income source analysis
  - Budget planning tools

### **Calculator Enhancements**
- [ ] **Quantity Input with Remaining Materials** - Smart material calculation
  - Input existing material quantities
  - Calculate remaining requirements
  - Optimize crafting order suggestions

- [ ] **Recipe Optimization** - Intelligent crafting suggestions
  - Most efficient crafting paths
  - Material cost optimization
  - Time-based crafting schedules

### **Technical Improvements**
- [ ] **MDX + Rehype Content Workflow** - Enhanced content management
  - Markdown-based content creation
  - Component embedding in content
  - Automated content processing

---

## ✅ **Recently Completed**

### **January 2025**
- ✅ **Complete Documentation Consolidation** - Streamlined developer onboarding
- ✅ **User Data Clearing System** - Testing tools for clean development
- ✅ **Authentication System Fixes** - Resolved SSR cookie issues and auth flow
- ✅ **Character Claiming System** - Fixed profession saving and user linking

### **December 2024**
- ✅ **User Profile System** - localStorage persistence and management
- ✅ **Profession-based Avatar System** - 18 BitCraft profession support
- ✅ **Settlement Connection Flow** - Enhanced loading states and error handling
- ✅ **Skills Analytics Integration** - Real-time data display and tracking
- ✅ **Settlement UI Improvements** - Enhanced navigation and user experience
- ✅ **Authentication & Sign-out** - Complete auth flow with proper session management

### **November 2024**
- ✅ **Settlement Management Core** - Dashboard, members, projects, treasury
- ✅ **BitJita API Integration** - Live settlement data synchronization
- ✅ **Database Schema** - Complete settlement management schema
- ✅ **Role-based Permissions** - In-game hierarchy mirroring
- ✅ **Character Claiming Flow** - Link user accounts to game characters

---

## 🎯 **Current Sprint Focus**

### **This Week**
1. **Profession Avatar Images** - Highest priority for visual completion
2. **Member Search & Filtering** - Improve member management UX
3. **Calculator Recipe Removal** - Address user feedback on calculator functionality

### **Next Week**  
1. **Real-time Updates Planning** - Research WebSocket integration approach
2. **Individual Item Pages** - Design and implement detailed item views
3. **SEO Optimization** - Improve search engine visibility

---

## 🛠️ **Technical Debt**

### **Code Quality**
- [ ] **Component Testing** - Add comprehensive test coverage for settlement components
- [ ] **Error Boundary Implementation** - Improve error handling throughout the app
- [ ] **Performance Optimization** - Bundle size analysis and optimization

### **Database Optimization**
- [ ] **Query Performance** - Optimize slow database queries
- [ ] **Index Analysis** - Review and optimize database indexes
- [ ] **Migration Cleanup** - Consolidate old migration files

### **Documentation**
- [x] **Developer Onboarding** - ✅ Completed comprehensive guide
- [ ] **API Documentation** - Generate automated API documentation
- [ ] **Component Documentation** - Document reusable component props and usage

---

## 📊 **Project Status**

| Category | Status | Completion |
|----------|--------|------------|
| **Core Settlement Features** | 🚀 Production | 95% |
| **Authentication System** | 🚀 Production | 100% |
| **BitJita API Integration** | 🚀 Production | 90% |
| **User Interface** | 🚀 Production | 85% |
| **Calculator System** | 🚀 Production | 80% |
| **Documentation** | 🚀 Complete | 100% |
| **Testing Infrastructure** | 🛠️ In Progress | 70% |
| **Performance Optimization** | 🛠️ In Progress | 60% |

---

## 💡 **Feature Request Process**

### **Submitting Ideas**
1. **Check existing TODO** - Verify idea isn't already planned
2. **Create GitHub Issue** - Use feature request template
3. **Provide Details** - Include use case, expected behavior, and mockups if applicable
4. **Community Discussion** - Allow community feedback and voting

### **Prioritization Criteria**
- **User Impact** - How many users will benefit?
- **Development Effort** - Time and complexity required
- **Strategic Alignment** - Fits project goals and vision
- **Community Demand** - User feedback and requests

---

## 🔄 **Review Schedule**

This TODO list is reviewed and updated:
- **Weekly** - During development sprints
- **Monthly** - For major feature planning
- **Quarterly** - For strategic direction updates

**Last Updated:** January 2025  
**Next Review:** February 2025  
**Status:** 🚀 Active Development