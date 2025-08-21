# Google Cloud Setup for Phoenix Web

## Prerequisites
- Google Cloud Project (same as Firebase project recommended)
- gcloud CLI installed
- Billing enabled on Google Cloud project

## 1. Enable Required APIs

```bash
# Set your project ID
export PROJECT_ID="phoenix-web-app"
gcloud config set project $PROJECT_ID

# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com

# Enable Cloud Storage API (for image storage)
gcloud services enable storage.googleapis.com

# Enable IAM API
gcloud services enable iam.googleapis.com
```

## 2. Authentication Setup

### Option A: Local Development (Recommended for Dev)

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Verify authentication
gcloud auth application-default print-access-token
```

### Option B: Service Account (Recommended for Production)

```bash
# Create service account
gcloud iam service-accounts create phoenix-web-ai \
  --display-name="Phoenix Web AI Service"

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:phoenix-web-ai@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:phoenix-web-ai@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=phoenix-web-ai@$PROJECT_ID.iam.gserviceaccount.com

# Set environment variable (add to .env.local)
echo "GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json" >> .env.local
```

## 3. Vertex AI Setup

```bash
# List available models
gcloud ai models list --region=us-central1

# Test Gemini access
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello"}]
    }]
  }'
```

## 4. Environment Variables

Add to `.env.local`:

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=phoenix-web-app
VERTEX_AI_LOCATION=us-central1

# For production with service account
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Optional: Specific model versions
GEMINI_MODEL=gemini-1.5-flash
IMAGEN_MODEL=imagegeneration@006
```

## 5. Deployment Configuration

### For Vercel

```json
// vercel.json
{
  "env": {
    "GOOGLE_CLOUD_PROJECT": "@google-cloud-project",
    "VERTEX_AI_LOCATION": "@vertex-ai-location"
  },
  "build": {
    "env": {
      "GOOGLE_APPLICATION_CREDENTIALS": "@google-credentials-base64"
    }
  }
}
```

Then add secrets:
```bash
# Encode service account key as base64
base64 -i service-account-key.json | pbcopy

# Add to Vercel
vercel secrets add google-credentials-base64
vercel secrets add google-cloud-project phoenix-web-app
vercel secrets add vertex-ai-location us-central1
```

### For Google Cloud Run

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

Deploy:
```bash
# Build and deploy to Cloud Run
gcloud run deploy phoenix-web \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=$PROJECT_ID
```

## 6. Testing the Setup

```bash
# Test presentation generation
curl -X POST http://localhost:3001/api/ai/generate-presentation \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Introduction to AI",
    "slideCount": 5,
    "style": "professional",
    "userId": "test-user",
    "idToken": "test-token"
  }'

# Test image generation
curl -X POST http://localhost:3001/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Modern office workspace",
    "style": "professional",
    "userId": "test-user",
    "idToken": "test-token"
  }'
```

## 7. Monitoring and Quotas

### Check API Quotas
```bash
gcloud services quota list --service=aiplatform.googleapis.com
```

### View Logs
```bash
gcloud logging read "resource.type=aiplatform.googleapis.com" --limit 50
```

### Set Budget Alerts
1. Go to [Google Cloud Console](https://console.cloud.google.com/billing)
2. Select your billing account
3. Click "Budgets & alerts"
4. Create budget with alerts at 50%, 75%, 100%

## Troubleshooting

### Authentication Issues
```bash
# Check current authentication
gcloud auth list

# Verify application default credentials
gcloud auth application-default print-access-token

# Reset credentials
gcloud auth application-default revoke
gcloud auth application-default login
```

### API Errors

| Error | Solution |
|-------|----------|
| `403: Permission denied` | Check IAM roles for service account |
| `429: Quota exceeded` | Check quotas or implement backoff |
| `500: Internal error` | Retry with exponential backoff |
| `401: Unauthenticated` | Verify credentials are set correctly |

### Rate Limits

Vertex AI Default Quotas (per minute):
- Gemini 1.5 Flash: 60 requests
- Imagen: 10 requests
- Total tokens: 1,000,000

Request quota increase if needed:
```bash
gcloud services quota update \
  --service=aiplatform.googleapis.com \
  --quota=generate_content_requests_per_minute \
  --value=120
```

## Security Best Practices

1. **Never commit credentials**: Add to `.gitignore`
   ```
   service-account-key.json
   .env.local
   ```

2. **Use least privilege**: Only grant necessary permissions

3. **Rotate keys regularly**: 
   ```bash
   # List existing keys
   gcloud iam service-accounts keys list \
     --iam-account=phoenix-web-ai@$PROJECT_ID.iam.gserviceaccount.com
   
   # Delete old keys
   gcloud iam service-accounts keys delete KEY_ID \
     --iam-account=phoenix-web-ai@$PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Monitor usage**: Set up alerts for unusual activity

5. **Use Secret Manager for production**:
   ```bash
   # Store credentials in Secret Manager
   gcloud secrets create phoenix-web-credentials \
     --data-file=service-account-key.json
   
   # Grant access to Cloud Run service
   gcloud secrets add-iam-policy-binding phoenix-web-credentials \
     --member="serviceAccount:SERVICE_ACCOUNT_EMAIL" \
     --role="roles/secretmanager.secretAccessor"
   ```