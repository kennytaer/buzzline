# BuzzLine Development Guide

## 🚀 **Local Development Options**

You have **two ways** to run BuzzLine locally, depending on your needs:

### **Option 1: Quick Development (Recommended for UI work)**
```bash
cd apps/web
npm run dev
```
- ✅ **Fast startup** - Runs on `http://localhost:5173`
- ✅ **Hot reload** - Instant UI updates
- ✅ **Mock KV** - All KV operations are logged but don't persist
- ⚠️ **Data doesn't persist** - Perfect for UI/UX development
- ⚠️ **No real data storage** - Contact/campaign creation won't save

### **Option 2: Full KV Development (For data persistence)**

**Step 1:** Start the Remix dev server
```bash
cd apps/web
npm run dev
```

**Step 2:** In a new terminal, start Wrangler proxy
```bash
cd apps/web  
npm run dev:kv
```

- ✅ **Real KV storage** - Data persists in Wrangler's local KV simulation
- ✅ **Full functionality** - All CRUD operations work
- ✅ **Production-like** - Same environment as Cloudflare Pages
- 🌐 **Access via**: `http://127.0.0.1:8788` (Wrangler proxy)
- 📊 **Wrangler dashboard**: Shows KV operations and data

## 🏗️ **What Works in Each Mode**

### Mock KV Mode (`npm run dev` only)
```
✅ UI Navigation & Layout
✅ Forms & Validation  
✅ Authentication (Clerk)
✅ File Uploads (CSV parsing)
⚠️ No data persistence
⚠️ Empty lists/dashboards
```

### Full KV Mode (Both servers running)
```  
✅ Everything from Mock KV mode
✅ Contact creation & management
✅ Campaign creation
✅ Sales team management
✅ CSV imports with data storage
✅ Organization settings
✅ Real data persistence
```

## 🔧 **Environment Setup**

### Required Environment Variables
Create `.env` file in project root:
```bash
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Optional: Twilio & Mailgun (for future features)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
MAILGUN_API_KEY=your_api_key
MAILGUN_DOMAIN=your_domain.com
```

### Wrangler Setup (First time only)
```bash
# Install Wrangler globally (optional)
npm install -g wrangler

# Login to Cloudflare (if deploying)
wrangler login
```

## 📊 **Development Workflow**

### For UI/UX Work
1. Use **Mock KV mode** - just run `npm run dev`
2. Focus on layout, styling, form validation
3. All interactions work, but data doesn't persist

### For Feature Development  
1. Use **Full KV mode** - run both dev servers
2. Test complete user flows end-to-end
3. Data persists between page reloads
4. See real KV operations in Wrangler logs

### For Testing CSV Imports
1. **Must use Full KV mode**
2. Upload CSV files through UI
3. Verify data appears in contact/sales lists
4. Test with real CSV data

## 🐛 **Troubleshooting**

### "KV operations not working"
- Make sure you're using **Full KV mode** (both servers)
- Check Wrangler logs for KV operations
- Access app via `http://127.0.0.1:8788` (not localhost:5173)

### "Authentication not working"
- Verify Clerk keys in `.env` file
- Make sure `.env` is in project root (not apps/web)
- Restart dev server after changing environment variables

### "Page not loading"
- Try `http://127.0.0.1:8788` instead of `localhost:5173`
- Check terminal for error messages
- Ensure both dev servers are running for Full KV mode

## 🎯 **Recommended Development Flow**

1. **Start with Mock KV** for quick iteration on UI
2. **Switch to Full KV** when testing data operations
3. **Use Full KV** for final testing before deployment

## 🚀 **Ready for Production?**

When you're ready to deploy:
```bash
npm run build    # Verify clean build
npm run deploy   # Deploy to Cloudflare Pages
```

Your app will use the real Cloudflare KV namespaces defined in `wrangler.toml`.

---

**Happy coding!** 🎉