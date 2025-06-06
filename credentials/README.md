# 🔐 Credentials Security Guide

## ⚠️ CRITICAL SECURITY NOTICE ⚠️

**NEVER commit credentials to version control!**

This directory is for storing sensitive credentials securely. The `.gitignore` file ensures these files are never committed to git.

## 🔑 Setting Up GCP Credentials Securely

### Step 1: Create a New Service Account

**DO NOT use the credentials shared in chat - they are compromised!**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to IAM & Admin > Service Accounts
3. Click "Create Service Account"
4. Name: `openphone-tpu-service`
5. Grant these roles:
   - TPU Admin
   - Compute Instance Admin (v1)
   - Monitoring Metric Writer
   - Storage Object Viewer (if using Cloud Storage)

### Step 2: Download Credentials Securely

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose JSON format
5. Download the file

### Step 3: Place Credentials Securely

```bash
# Copy the downloaded file to this directory
cp ~/Downloads/your-project-xxxxx.json ./credentials/gcp-key.json

# Set secure permissions (important!)
chmod 700 ./credentials/
chmod 600 ./credentials/gcp-key.json

# Verify it's not tracked by git
git status  # Should not show gcp-key.json
```

### Step 4: Environment Variables (Alternative)

For even better security, use environment variables:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/credentials.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

## 🛡️ Security Best Practices

### ✅ DO:
- Create dedicated service accounts for each environment
- Use minimum required permissions (principle of least privilege)
- Rotate credentials regularly
- Use Google Cloud Secret Manager in production
- Monitor credential usage in Cloud Console
- Set up billing alerts

### ❌ DON'T:
- Share credentials in chat/email/Slack
- Commit credentials to git repositories
- Use personal Google accounts for services
- Give broad permissions like "Project Owner"
- Store credentials in plain text files on shared systems

## 🔄 Credential Rotation

Rotate credentials every 90 days:

1. Create new service account key
2. Update deployment with new credentials
3. Test functionality
4. Delete old service account key

## 🚨 If Credentials Are Compromised

1. **Immediately disable** the service account in Google Cloud Console
2. **Delete all keys** for the compromised service account
3. **Review audit logs** for unauthorized access
4. **Create new service account** with fresh credentials
5. **Update all deployments** with new credentials

## 📞 Support

If you need help with credentials setup:
- Check Google Cloud Documentation
- Use Google Cloud Support (if you have a support plan)
- Review IAM best practices guide

## 🔍 Verification

After setup, verify your credentials work:

```bash
# Test authentication
gcloud auth activate-service-account --key-file=./credentials/gcp-key.json
gcloud auth list

# Test TPU access
gcloud compute tpus list --zone=us-central1-b
```

Remember: **Security is not optional** - protect your credentials!
