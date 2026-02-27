# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in DtComb, please report it responsibly.

**DO NOT** create a public GitHub issue for security vulnerabilities.

### How to Report

Send an email to: [your-email@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### For Deployment

1. **Change Default Credentials**
   - Update `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
   - Use strong passwords (min 12 characters)

2. **Use Strong Secret Keys**
   ```bash
   # Generate secure secret key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Enable HTTPS**
   - Use SSL/TLS certificates in production
   - Configure reverse proxy (nginx/Apache) with HTTPS

4. **Database Security**
   - Use proper file permissions for SQLite database
   - Regular backups
   - Consider PostgreSQL/MySQL for production

5. **Environment Variables**
   - Never commit `.env` file
   - Use environment-specific configurations
   - Rotate secrets regularly

6. **Rate Limiting**
   - Enable rate limiting in production
   - Monitor for abuse

7. **Keep Dependencies Updated**
   ```bash
   pip list --outdated
   pip install --upgrade package-name
   ```

8. **Docker Security**
   - Don't run containers as root
   - Scan images for vulnerabilities
   - Use minimal base images

### Known Security Considerations

1. **Session Management**: Currently using cookie-based sessions. Consider JWT tokens for API-only access.

2. **SQL Injection**: Parameterized queries are used, but always validate input.

3. **File Upload**: Validate file types and sizes if implementing file upload features.

4. **R Code Execution**: R scripts execute user data - ensure proper sanitization.

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1).

Subscribe to releases to get notifications of security updates.

## Acknowledgments

We thank the security community for responsible disclosure of vulnerabilities.

