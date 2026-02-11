# 📱 Shopify App Store Submission Guide

## Complete Step-by-Step Process for ConvertFlow AI

---

## 🎯 Overview

This guide walks you through submitting ConvertFlow AI to the Shopify App Store, from initial setup to final approval.

**Estimated Timeline**: 2-4 weeks (including Shopify review)

---

## 📋 Pre-Submission Checklist

Before starting the submission process, ensure you have:

- [ ] **App fully functional** on production server
- [ ] **Public URL** with valid SSL certificate (HTTPS)
- [ ] **Shopify Partner Account** (free to create)
- [ ] **Test store** with app installed and working
- [ ] **Privacy Policy** and **Terms of Service** URLs
- [ ] **Support email** or contact page
- [ ] **App screenshots** (at least 3-5 high-quality)
- [ ] **App icon/logo** (512x512px minimum)
- [ ] **Demo video** (optional but recommended)

---

## 🚀 Step 1: Access Shopify Partner Dashboard

### 1.1 Create Partner Account (if you don't have one)
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Click **"Join now"**
3. Fill in your details:
   - Business name
   - Email
   - Password
   - Country
4. Verify your email
5. Complete your profile

### 1.2 Login to Partner Dashboard
- URL: https://partners.shopify.com/organizations
- Use your partner credentials

---

## 🏗️ Step 2: Create Your App in Partner Dashboard

### 2.1 Navigate to Apps
1. In Partner Dashboard, click **"Apps"** in left sidebar
2. Click **"Create app"** button
3. Select **"Public app"** (for App Store listing)

### 2.2 Configure Basic Information
Fill in the app details:

**App Name**:
```
ConvertFlow AI
```

**App URL**:
```
https://yourapp.com
```
*(Your production server URL)*

**Allowed redirection URL(s)**:
```
https://yourapp.com/auth/callback
https://yourapp.com/auth/shopify/callback
```

**App proxy** (if needed):
- Subpath prefix: `apps`
- Subpath: `convertflow-ai`
- Proxy URL: `https://yourapp.com/proxy`

---

## 🔑 Step 3: Configure App Scopes

### 3.1 Set API Access Scopes
In the **"Configuration"** tab, under **"API access scopes"**:

**Required Scopes for ConvertFlow AI**:
```
read_themes
write_themes
read_content
write_content
```

**Optional (for future features)**:
```
read_products
read_customers
read_orders
```

### 3.2 Save Configuration
- Click **"Save"** at the top right
- Note down your **API Key** and **API Secret** (you'll need these for `.env`)

---

## 💳 Step 4: Setup App Charges (Subscription Billing)

### 4.1 Navigate to Billing
- In your app settings, go to **"Pricing"** tab
- Click **"Create pricing plan"**

### 4.2 Configure Subscription
**Plan Details**:
- **Plan name**: Premium Plan
- **Pricing type**: Recurring charge
- **Price**: $20.00 USD
- **Billing interval**: Every 30 days
- **Trial period**: 7 days (optional, recommended)

**Features to highlight**:
```
✓ 100+ Conversion-Optimized Sections
✓ Advanced Visual Editor
✓ One-Click Theme Installation
✓ Zero Theme Conflicts
✓ Premium Support
```

### 4.3 Save Pricing
- Click **"Save pricing"**
- Make sure the plan is set to **"Active"**

---

## 📝 Step 5: Create App Store Listing

### 5.1 Navigate to App Listing
- In Partner Dashboard → **Apps** → Select your app
- Click **"Distribution"** tab
- Click **"Create listing"**

### 5.2 Fill in Listing Information

#### **App Name & Tagline**
```
Name: ConvertFlow AI
Tagline: 100+ Premium Sections to Boost Your Conversions
```

#### **Key Benefits** (3-4 bullet points)
```
🎨 Advanced Visual Editor - Customize colors, fonts, and layouts with live preview
🚀 100+ Premium Sections - Hero banners, CTAs, trust badges, and more
⚡ Zero Theme Conflicts - Uses Shopify OS 2.0 App Blocks
💰 Boost Conversions - Professionally designed, high-converting sections
```

#### **Description** (Main pitch)
```markdown
# Transform Your Shopify Store with ConvertFlow AI

ConvertFlow AI is the ultimate conversion toolkit for Shopify merchants. Access 100+ premium, professionally designed sections that install seamlessly into your store with zero theme conflicts.

## 🎯 What You Get

### Advanced Visual Editor
- Real-time live preview
- Custom color picker with gradient support
- 15+ Google Fonts integration
- Drag-and-drop image uploader
- Desktop & mobile preview modes

### 100+ Premium Sections
- Hero Sections (10 variations)
- Announcement Bars (10 variations)
- Header & Navigation (10 variations)
- Product Pages & Trust Badges (20 variations)
- Urgency & Retention Tools (20 variations)
- Footer & CTA Sections (20 variations)
- And 20+ more specialized sections

### Zero Theme Conflicts
Built with Shopify Online Store 2.0 standards, our sections are App Blocks that install safely without modifying your theme code. Uninstall anytime with zero remnants.

### One-Click Installation
Customize your section, preview it live, and install to your theme with a single click. No coding required.

## 💎 Perfect For

- Merchants looking to boost conversions
- Stores wanting professional design without hiring developers
- Businesses needing flexible, customizable sections
- Anyone who values beautiful, high-performing storefronts

## 🚀 Getting Started

1. Install ConvertFlow AI
2. Browse our section library
3. Customize to match your brand
4. Install to your theme
5. Watch your conversions grow!

## 💰 Pricing

$20/month for unlimited access to all 100+ sections and future updates.
7-day free trial included.

## 🆘 Support

Our team is here to help! Reach out via:
- Email: support@convertflowai.com
- Live chat (in-app)
- Comprehensive documentation

---

Start your free trial today!
```

#### **App Category** (Select 1-2)
- **Primary**: Marketing & Conversion
- **Secondary**: Theme Builder

#### **Value Proposition** (Short summary)
```
ConvertFlow AI provides 100+ premium, conversion-optimized sections with an advanced visual editor. Install beautiful, high-performing sections to your Shopify store with zero theme conflicts.
```

---

## 🖼️ Step 6: Upload Media Assets

### 6.1 App Icon
**Requirements**:
- Size: 1200x1200px minimum
- Format: PNG or JPG
- No transparency
- High quality, recognizable at small sizes

**Design Tips**:
- Use your brand colors (Blue/Purple gradient)
- Simple, memorable icon
- Looks good in both light and dark mode

### 6.2 Screenshots (Minimum 3, Maximum 5)
**Required Screenshots**:

1. **Dashboard Overview** (1920x1080px)
   - Show the main dashboard with category grid
   - Highlight subscription status and stats

2. **Customization Editor** (1920x1080px)
   - Split-screen view (controls + live preview)
   - Show color picker, font selector in action

3. **Section Library** (1920x1080px)
   - Category browser with multiple sections
   - Show variety and quality

4. **Live Preview** (1920x1080px)
   - Desktop and mobile preview toggle
   - Real-time customization

5. **Installed Section** (1920x1080px)
   - Show a section live on a Shopify store
   - Demonstrate final result

**Screenshot Tips**:
- Use high-quality test data (real product images, professional copy)
- Clean, uncluttered UI
- Annotate with text overlays if helpful
- Show the app in action, not just static screens

### 6.3 Demo Video (Optional but Recommended)
**Video Guidelines**:
- Length: 30-90 seconds
- Format: MP4 or WebM
- Resolution: 1920x1080px (1080p)
- Max file size: 100MB

**Video Script**:
1. Show problem (boring, low-converting store)
2. Introduce ConvertFlow AI
3. Quick demo: Browse → Customize → Install
4. Show beautiful result
5. Call to action (Start free trial)

**Where to host**:
- YouTube (set to "Unlisted")
- Vimeo
- Wistia

Paste the video URL in the listing form.

---

## 📄 Step 7: Legal & Support Information

### 7.1 Privacy Policy
Create a privacy policy that covers:
- What data you collect (shop domain, customization settings)
- How you use it (app functionality, analytics)
- Data retention (stored in database)
- Third-party sharing (none, or specify if using analytics)
- User rights (access, deletion)

**Host at**: `https://yourapp.com/privacy-policy`

**Template Resources**:
- [Shopify's Privacy Generator](https://www.shopify.com/tools/policy-generator/privacy-policy)
- [Termly.io](https://termly.io)

### 7.2 Terms of Service
Create terms that include:
- Subscription terms ($20/month, cancellation policy)
- Acceptable use policy
- Liability limitations
- Intellectual property rights

**Host at**: `https://yourapp.com/terms-of-service`

### 7.3 Support Information
Provide:
```
Support Email: support@convertflowai.com
Support URL: https://yourapp.com/support
Documentation: https://docs.convertflowai.com (or in-app help)
```

---

## 🧪 Step 8: Test Your App Thoroughly

### 8.1 Install on Development Store
1. Create a Shopify development store (free via Partner Dashboard)
2. Install your app
3. Test complete user flow:
   - OAuth installation
   - Dashboard loads
   - Subscription activation
   - Section customization
   - Section installation
   - Uninstallation (leaves no remnants)

### 8.2 Test Edge Cases
- [ ] Subscription cancellation
- [ ] Multiple sections installed
- [ ] Theme editor integration
- [ ] Mobile responsiveness
- [ ] Error handling (network failures)
- [ ] Different browsers (Chrome, Firefox, Safari)

### 8.3 Performance Check
- [ ] Lighthouse score 90+ on all pages
- [ ] Page load under 3 seconds
- [ ] No console errors
- [ ] Database queries optimized

---

## 📤 Step 9: Submit for Review

### 9.1 Final Checklist
Before submitting, verify:
- [x] App fully functional on production
- [x] All listing information complete
- [x] 3-5 high-quality screenshots uploaded
- [x] App icon uploaded
- [x] Privacy policy live and linked
- [x] Terms of service live and linked
- [x] Support email working
- [x] Pricing configured ($20/month)
- [x] Tested on development store
- [x] No critical bugs

### 9.2 Submit to Shopify
1. In Partner Dashboard → Your App → **Distribution** tab
2. Review all information
3. Click **"Submit for review"** button
4. Confirm submission

**You'll see**:
```
✅ App submitted successfully!
Your app is now pending review by Shopify.
```

---

## ⏳ Step 10: Review Process

### 10.1 What Shopify Reviews
Shopify will check:
- **Functionality**: Does the app work as described?
- **Quality**: Is it well-built and bug-free?
- **Compliance**: Does it follow Shopify policies?
- **Performance**: Is it fast and reliable?
- **Security**: Does it protect merchant data?
- **Design**: Is the UI professional and user-friendly?

### 10.2 Review Timeline
- **Standard**: 2-4 weeks
- **Expedited** (if applicable): 1 week

### 10.3 Possible Outcomes

**✅ Approved**:
- Your app goes live on the App Store immediately
- You'll receive a confirmation email
- Monitor installations and reviews

**📝 Needs Changes**:
- Shopify requests modifications
- Review their feedback carefully
- Make required changes
- Resubmit for review

**❌ Rejected**:
- Rare if you follow guidelines
- Review rejection reasons
- Fix issues
- Reapply after 30 days

---

## 🎉 Step 11: Post-Approval

### 11.1 Optimize Your Listing
After approval, you can still:
- Update screenshots
- Improve description
- Add more features
- Respond to reviews

### 11.2 Monitor Performance
Track:
- Installation rate
- Conversion to paid (free trial → subscription)
- Churn rate
- User reviews and ratings
- Support tickets

### 11.3 Iterate & Improve
- Respond to user feedback
- Fix bugs quickly
- Add requested features
- Update section library
- Keep app current with Shopify updates

---

## 🔧 Common Issues & Solutions

### Issue: App rejected for performance
**Solution**: 
- Run Lighthouse audits
- Optimize database queries
- Enable caching
- Reduce bundle sizes

### Issue: Privacy policy not compliant
**Solution**:
- Use Shopify's generator
- Be specific about data usage
- Include GDPR compliance (if applicable)

### Issue: OAuth flow failing
**Solution**:
- Check redirect URLs match exactly
- Verify API scopes are correct
- Test with fresh development store

### Issue: Billing not working
**Solution**:
- Ensure Shopify Billing API configured
- Check pricing plan is active
- Verify subscription creation code

---

## 📊 Success Metrics to Track

After launch, monitor:
- **Installations**: Target 100+ in first month
- **Paid Conversions**: Aim for 30%+ trial-to-paid
- **Rating**: Maintain 4.5+ stars
- **Churn**: Keep below 5% monthly
- **Support Tickets**: Response time under 24 hours

---

## 📚 Resources

### Shopify Documentation
- [App Store Requirements](https://shopify.dev/apps/store/requirements)
- [Listing Guidelines](https://shopify.dev/apps/store/listing-guidelines)
- [App Review Checklist](https://shopify.dev/apps/store/review)

### Partner Dashboard
- [partners.shopify.com](https://partners.shopify.com)

### Support
- [Shopify Partner Support](https://help.shopify.com/en/partners)
- [Community Forums](https://community.shopify.com/c/app-developers/bd-p/app-developers)

---

## ✅ Quick Reference Checklist

```
PRE-SUBMISSION
□ App deployed to production with HTTPS
□ Test store installation successful
□ Privacy policy & terms live
□ Support email configured

PARTNER DASHBOARD
□ Partner account created
□ App created (Public app)
□ API scopes configured
□ Redirect URLs set
□ Pricing plan created ($20/month)

LISTING
□ App name & tagline written
□ Full description complete
□ Key benefits listed
□ Category selected
□ App icon uploaded (1200x1200px)
□ 3-5 screenshots uploaded
□ Demo video (optional)
□ Privacy policy URL added
□ Terms of service URL added
□ Support email added

TESTING
□ Full user flow tested
□ Performance optimized (Lighthouse 90+)
□ Cross-browser tested
□ Mobile responsive
□ No critical bugs

SUBMIT
□ Final review of listing
□ Submit for Shopify review
□ Monitor email for feedback
```

---

**Good luck with your submission! 🚀**

Your app is world-class and ready for the Shopify App Store. Follow this guide step-by-step, and you'll have a successful launch!
