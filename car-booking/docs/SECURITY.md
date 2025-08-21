# 🔒 Security Guidelines - GS Battery Car Booking System

## Overview
This document outlines security best practices and procedures for the GS Battery Car Booking System.

## 🚨 Critical Security Rules

### Never Commit These Files
- `.env` files (use `.env.example` as template)
- Private keys (`*.pem`, `*.key`)
- Certificates with private data
- Any file containing passwords or API keys

### Always Use Environment Variables For
- Database credentials
- API keys and secrets
- LDAP/AD passwords
- OAuth client secrets
- Server URLs and IPs
- Any sensitive configuration

## 🛡️ Pre-Push Security Checklist

Before pushing code to the repository, run:

```bash
# Run comprehensive security check
npm run security:check

# Scan for secrets in staged files
npm run security:scan
```

## 🔑 Environment Configuration

### Setting Up Environment Files

1. Copy the example file:
```bash
cp apps/server/.env.example apps/server/.env
```

2. Fill in your actual values (never commit the actual .env file)

3. Generate secure secrets:
```bash
# Generate authentication secret
openssl rand -base64 32

# Generate random password
openssl rand -base64 16
```

### Required Environment Variables

#### Server Application (`apps/server/.env`)
- `BETTER_AUTH_SECRET` - Authentication secret (min 32 chars)
- `DATABASE_URL` - PostgreSQL connection string
- `LDAP_URL` - Active Directory server URL
- `LDAP_ADMIN_PASSWORD` - Service account password
- `MICROSOFT_CLIENT_SECRET` - Azure OAuth secret

#### Web Application (`apps/web/.env`)
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend application URL

## 🔐 Authentication & Authorization

### LDAP/Active Directory
- Use service accounts, not personal accounts
- Rotate service account passwords regularly
- Use LDAPS (LDAP over SSL) in production
- Never hardcode server IPs or credentials

### Microsoft 365 OAuth
- Register app in Azure AD portal
- Use proper redirect URIs
- Keep client secrets secure
- Implement proper token validation

## 🚀 Deployment Security

### Production Checklist
- [ ] All secrets in environment variables
- [ ] HTTPS enabled for all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] Database connections use SSL
- [ ] Logs don't contain sensitive data

### Secret Management
- Use secret management services (Azure Key Vault, AWS Secrets Manager)
- Rotate secrets regularly
- Use different secrets for each environment
- Never use production secrets in development

## 🐛 Security Testing

### Regular Security Audits
```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for secrets in git history
git log -p | grep -i "password\|secret\|key\|token"
```

### Dependency Management
- Review dependencies regularly
- Update packages with security patches
- Remove unused dependencies
- Use `npm audit` before each deployment

## 📝 Incident Response

### If Secrets Are Exposed

1. **Immediately rotate the exposed credential**
2. **Check logs for unauthorized access**
3. **Remove from git history if needed:**
```bash
# Use git filter-branch or BFG Repo-Cleaner
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file' \
  --prune-empty --tag-name-filter cat -- --all
```
4. **Force push to remote (coordinate with team)**
5. **Document the incident**

## 🎯 Security Contacts

For security issues or questions:
- IT Security Team: security@gsbattery.co.th
- System Administrator: admin@siamgs.co.th

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Remember:** Security is everyone's responsibility. When in doubt, ask for help!