# PHEDEL Modular Systems - Deployment Guide

This guide provides step-by-step instructions for deploying the PHEDEL Modular Systems website to production.

## 🚀 Pre-Deployment Checklist

### 1. Domain and Hosting Setup
- [ ] Domain name registered and configured
- [ ] Web hosting account with Apache support
- [ ] SSL certificate installed
- [ ] DNS records properly configured

### 2. Analytics and Tracking Setup
- [ ] Google Analytics 4 account created
- [ ] Google Search Console account setup
- [ ] Google My Business listing claimed
- [ ] Analytics tracking codes configured

### 3. Content Review
- [ ] All placeholder content replaced
- [ ] Contact information updated
- [ ] Business hours verified
- [ ] Service descriptions finalized
- [ ] Portfolio projects added

## 📝 Step-by-Step Deployment

### Step 1: Configure Analytics

#### Google Analytics 4 Setup
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new GA4 property for your website
3. Get your Measurement ID (format: G-XXXXXXXXXX)
4. Replace `GA_MEASUREMENT_ID` in all HTML files:
   ```bash
   # Use find and replace in your editor
   Find: GA_MEASUREMENT_ID
   Replace: G-XXXXXXXXXX (your actual ID)
   ```

#### Google Search Console Setup
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your website property
3. Choose "HTML tag" verification method
4. Copy the verification code
5. Replace `YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE` in all HTML files:
   ```bash
   # Use find and replace in your editor
   Find: YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE
   Replace: your-actual-verification-code
   ```

### Step 2: Update Domain References

1. Replace all instances of `https://phedel.pages.dev` with your actual domain:
   ```bash
   # Files to update:
   # - All HTML files (canonical URLs)
   # - sitemap.xml
   # - robots.txt
   
   Find: https://phedel.pages.dev
   Replace: https://yourdomain.com
   ```

### Step 3: Configure Contact Information

1. Update business address in all files:
   ```bash
   Find: No.60, Magadi Main Road, Bangalore, Karnataka
   Replace: Your actual business address
   ```

2. Update phone numbers:
   ```bash
   Find: +91 XXXXXXXXXX
   Replace: Your actual phone number
   ```

3. Update email addresses:
   ```bash
   Find: info@phedel.com
   Replace: your-actual-email@yourdomain.com
   ```

### Step 4: Upload Files to Server

1. **Via FTP/SFTP:**
   ```bash
   # Upload all files to your web server's document root
   # Typical paths:
   # - cPanel: public_html/
   # - Apache: /var/www/html/
   # - Nginx: /var/www/yourdomain.com/
   ```

2. **File Permissions:**
   ```bash
   # Set proper permissions
   chmod 644 *.html *.xml *.txt *.md
   chmod 644 .htaccess
   ```

### Step 5: Configure Server Settings

#### Apache Configuration
1. Ensure `.htaccess` is uploaded and processed
2. Verify mod_rewrite is enabled
3. Check that security headers are working

#### Test .htaccess functionality:
```bash
# Test if .htaccess is working
curl -I https://yourdomain.com
# Should return security headers
```

### Step 6: SSL and HTTPS Setup

1. **Install SSL Certificate:**
   - Use Let's Encrypt (free) or commercial SSL
   - Configure automatic renewal

2. **Force HTTPS Redirect:**
   - Uncomment HTTPS redirect lines in .htaccess:
   ```apache
   # Uncomment these lines in .htaccess:
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

### Step 7: Submit to Search Engines

1. **Google Search Console:**
   - Verify website ownership
   - Submit sitemap: `https://yourdomain.com/sitemap.xml`
   - Request indexing for main pages

2. **Bing Webmaster Tools:**
   - Add and verify your website
   - Submit sitemap

## 🔧 Post-Deployment Configuration

### 1. Form Processing Setup

The contact form needs server-side processing. Options:

#### Option A: PHP Processing
```php
<?php
// contact-process.php
if ($_POST) {
    // Validate and sanitize input
    $name = filter_var($_POST['firstName'] . ' ' . $_POST['lastName'], FILTER_SANITIZE_STRING);
    $email = filter_var($_POST['email'], FILTER_VALIDATE_EMAIL);
    $phone = filter_var($_POST['phone'], FILTER_SANITIZE_STRING);
    $message = filter_var($_POST['message'], FILTER_SANITIZE_STRING);
    
    // Check honeypot
    if (!empty($_POST['website'])) {
        exit('Spam detected');
    }
    
    // Send email
    $to = 'your-email@yourdomain.com';
    $subject = 'New Contact Form Submission';
    $body = "Name: $name\nEmail: $email\nPhone: $phone\nMessage: $message";
    
    if (mail($to, $subject, $body)) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}
?>
```

#### Option B: Third-party Services
- Formspree
- Netlify Forms
- EmailJS

### 2. Performance Optimization

#### Enable Compression
Verify GZIP compression is working:
```bash
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com
# Should return: Content-Encoding: gzip
```

#### Image Optimization
1. Compress all images using tools like:
   - TinyPNG
   - ImageOptim
   - WebP conversion

2. Implement responsive images:
```html
<img src="image.webp" 
     srcset="image-320.webp 320w, image-640.webp 640w, image-1024.webp 1024w"
     sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1024px"
     alt="Description" 
     loading="lazy">
```

### 3. Security Hardening

#### Additional Security Headers
Add to .htaccess if not already present:
```apache
# Additional security headers
Header set Permissions-Policy "geolocation=(), microphone=(), camera=()"
Header set Cross-Origin-Embedder-Policy "require-corp"
Header set Cross-Origin-Opener-Policy "same-origin"
```

#### Regular Security Updates
- Keep server software updated
- Monitor for security vulnerabilities
- Regular backup schedule

## 📊 Monitoring and Analytics

### 1. Set Up Monitoring

#### Google Analytics Goals
1. Contact form submissions
2. Phone number clicks
3. Email link clicks
4. Service page visits

#### Search Console Monitoring
- Monitor search performance
- Check for crawl errors
- Review mobile usability
- Track Core Web Vitals

### 2. Performance Monitoring

#### Tools to Use
- Google PageSpeed Insights
- GTmetrix
- Pingdom
- WebPageTest

#### Key Metrics to Monitor
- Page load time
- Core Web Vitals (LCP, FID, CLS)
- Mobile performance
- Server response time

## 🔄 Maintenance Schedule

### Daily
- [ ] Monitor website uptime
- [ ] Check contact form functionality

### Weekly
- [ ] Review Google Analytics data
- [ ] Check Search Console for errors
- [ ] Monitor website performance

### Monthly
- [ ] Update content as needed
- [ ] Review and respond to customer inquiries
- [ ] Check for broken links
- [ ] Update portfolio with new projects

### Quarterly
- [ ] Review and update SEO strategy
- [ ] Analyze competitor websites
- [ ] Update business information
- [ ] Review and improve page content

## 🚨 Troubleshooting

### Common Issues

#### 1. .htaccess Not Working
```bash
# Check if mod_rewrite is enabled
apache2ctl -M | grep rewrite

# Check .htaccess syntax
apachectl configtest
```

#### 2. SSL Certificate Issues
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443

# Check certificate expiration
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

#### 3. Analytics Not Tracking
- Verify Measurement ID is correct
- Check browser console for JavaScript errors
- Use Google Analytics Debugger extension

#### 4. Form Not Submitting
- Check server-side processing script
- Verify form action URL
- Check server error logs

### Emergency Contacts
- Hosting Provider Support
- Domain Registrar Support
- SSL Certificate Provider

## 📞 Support Resources

### Documentation
- [Google Analytics Help](https://support.google.com/analytics)
- [Google Search Console Help](https://support.google.com/webmasters)
- [Apache Documentation](https://httpd.apache.org/docs/)

### Tools
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Google Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)

---

**Need Help?**  
For technical support with this deployment, contact your web development team or hosting provider.

**PHEDEL Modular Systems**  
Website: https://yourdomain.com  
Email: info@yourdomain.com