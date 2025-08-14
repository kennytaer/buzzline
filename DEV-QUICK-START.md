# 🚀 BuzzLine Quick Start Guide

## **Development Server Working!** ✅

Your BuzzLine MVP is ready for local development testing.

## **How to Run Locally**

### **Option 1: From Project Root** (Recommended)
```bash
cd /path/to/buzzline
npm run dev
```

### **Option 2: From Web App Directory**
```bash
cd apps/web  
npm run dev
```

Both commands will start the development server on `http://localhost:5173` (or next available port).

## **🧪 What to Test**

### **Authentication Flow**
1. Visit `http://localhost:5173`
2. Click sign up/login
3. Create account or sign in with existing
4. Should redirect to dashboard

### **Contact Management**
1. Go to `/contacts`
2. Click "Add Contact" - test individual contact creation
3. Click "Upload Contacts" - test CSV import (uses mock data in dev mode)

### **Campaign Creation**  
1. Go to `/campaigns`
2. Click "Create Campaign" - build email/SMS campaign
3. Select contact lists, write templates

### **Sales Team**
1. Go to `/sales`
2. Add individual sales members
3. Upload sales team CSV

### **Settings**
1. Go to `/settings`
2. Configure email domain
3. Request phone number

## **💡 Development Notes**

- **Mock KV Mode**: Data operations are logged but don't persist
- **Perfect for**: UI testing, form validation, authentication flow
- **All routes work**: Navigation, forms, file uploads all functional
- **No data persistence**: Contacts/campaigns won't save between reloads

## **🔋 Full Functionality Testing**

For complete data persistence and CRUD operations:

1. **Start dev server**: `npm run dev`
2. **Start Wrangler proxy**: `cd apps/web && npm run dev:kv`  
3. **Access via**: `http://127.0.0.1:8788`

This enables full KV storage with data persistence.

## **✅ Ready for Development**

Your MVP is fully functional and ready for:
- Feature development
- UI/UX improvements  
- Testing user workflows
- Adding Twilio/Mailgun integration
- Preparing for production deployment

**Happy coding!** 🎉