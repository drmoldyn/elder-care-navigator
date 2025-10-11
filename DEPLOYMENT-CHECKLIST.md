# SunsetWell Production Deployment Checklist

## ✅ Pre-Deployment

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set in production
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in production
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (KEEP SECRET!)
- [ ] `GOOGLE_GEOCODING_API_KEY` set
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` set

### Database
- [ ] Supabase migrations applied (0008-0013)
- [ ] Database has facility data imported
- [ ] RLS (Row Level Security) policies enabled
- [ ] Database backups enabled

### Build & Test
- [ ] Run `pnpm build` locally - no errors
- [ ] Test all pages load correctly
- [ ] Test navigator flow end-to-end
- [ ] Test lead submission works
- [ ] Test Google Maps integration

### SEO & Analytics
- [ ] Google Tag Manager container ID configured
- [ ] Google Ads conversion tracking tested
- [ ] Landing pages have proper meta tags
- [ ] Sitemap generated
- [ ] robots.txt configured

### Performance
- [ ] Images optimized (hero images exist in `/public/images/hero/`)
- [ ] No console errors in browser
- [ ] Lighthouse score > 90 for performance

### Legal & Compliance
- [ ] Privacy policy page created
- [ ] Terms of service page created
- [ ] HIPAA compliance reviewed (if storing PHI)
- [ ] Cookie consent banner (if needed)

## 🚀 Deployment Steps

### Vercel (Recommended)
1. [ ] Push code to GitHub
2. [ ] Connect Vercel to GitHub repo
3. [ ] Add environment variables in Vercel dashboard
4. [ ] Deploy
5. [ ] Test production URL
6. [ ] Add custom domain (optional)

### Custom Domain Setup
1. [ ] Purchase domain (e.g., sunsetwell.com)
2. [ ] Add domain in Vercel/Netlify
3. [ ] Update DNS records (provided by platform)
4. [ ] Wait for SSL certificate (automatic)
5. [ ] Test HTTPS works

## ✅ Post-Deployment

### Verification
- [ ] Homepage loads at production URL
- [ ] All landing pages accessible
- [ ] Navigator flow works end-to-end
- [ ] Search returns results
- [ ] Google Maps displays correctly
- [ ] Lead forms submit successfully
- [ ] Mobile responsive on real devices

### Monitoring
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure error tracking (Sentry optional)
- [ ] Set up Google Search Console
- [ ] Submit sitemap to Google

### Marketing
- [ ] Google Ads campaigns ready
- [ ] Landing pages linked from ads
- [ ] Conversion tracking verified
- [ ] Analytics dashboard monitoring started

## 🔒 Security

- [ ] Environment variables never committed to git
- [ ] Service role key only on server-side
- [ ] API routes protected appropriately
- [ ] Supabase RLS policies active
- [ ] HTTPS enforced (automatic on Vercel/Netlify)

## 📞 Support Contacts

- Vercel Support: support@vercel.com
- Supabase Support: support@supabase.io
- Google Ads Support: Via Google Ads dashboard

---

**Current Status**: Ready for deployment
**Recommended Platform**: Vercel (best Next.js performance)
**Estimated Deploy Time**: 10-15 minutes
