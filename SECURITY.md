# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of TabbyMcTabface seriously. If you discover a security vulnerability, please follow these guidelines:

### How to Report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Report via one of these methods:
   - Open a GitHub issue with label `security` (for low-severity issues)
   - Email: [Add your security contact email here]
   - GitHub Security Advisories: https://github.com/Phazzie/tabbymctabface/security/advisories/new

### What to Include

Please provide:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information (if you want credit)

### Response Timeline

- **Critical vulnerabilities**: Response within 24 hours, patch within 72 hours
- **High severity**: Response within 48 hours, patch within 7 days
- **Medium severity**: Response within 7 days, patch within 30 days
- **Low severity**: Response within 14 days, patch as appropriate

### Disclosure Policy

- We will acknowledge receipt of your report within 48 hours
- We will provide regular updates on our progress
- We will notify you when the vulnerability is fixed
- We will credit you in the release notes (unless you prefer to remain anonymous)

### Public Disclosure

We practice **responsible disclosure**:
- Vulnerabilities will not be publicly disclosed until a patch is available
- We will coordinate disclosure timing with the reporter
- Advisories will be published after fix is deployed

## Security Update Process

When security issues are fixed:
1. Version number is bumped
2. Security advisory published on GitHub
3. Chrome Web Store listing updated
4. Users auto-update (Chrome extensions update automatically)
5. Release notes include security fix details (non-sensitive)

## Security Best Practices for Users

To stay secure:
- ✅ Keep the extension updated (Chrome auto-updates)
- ✅ Only install from official Chrome Web Store
- ✅ Review extension permissions before installing
- ✅ Report suspicious behavior

## Out of Scope

The following are **not** security vulnerabilities:
- Feature requests
- UI/UX issues
- Performance problems
- Compatibility issues with specific websites
- Issues already reported

## Bug Bounty

Currently, we do not offer a bug bounty program. However, we deeply appreciate security researchers who responsibly disclose vulnerabilities and will credit them in release notes.

## Security Features

TabbyMcTabface includes these security features:
- ✅ No external network calls (local-only)
- ✅ Zero data collection or tracking
- ✅ Minimal permission scope
- ✅ Open source (auditable)
- ✅ TypeScript strict mode (type safety)
- ✅ Result<T,E> error handling (no exceptions)
- ✅ Safe DOM manipulation (no innerHTML with user data)
- ✅ Comprehensive test suite (384 tests)

## Security Audit

Latest security audit: November 3, 2025  
Status: ✅ PASSED (0 critical/high/medium issues)  
Report: See `SECURITY_AUDIT.md`

## Contact

Security contact: [Add email]  
GitHub: https://github.com/Phazzie/tabbymctabface  
Response time: 48 hours for critical issues

---

**Last Updated**: November 3, 2025
