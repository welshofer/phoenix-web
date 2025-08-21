# Google Cloud Text-to-Speech Setup Guide

## Overview
The podcast export feature can generate audio files from scripts using Google Cloud Text-to-Speech API.

## Setup Options

### Option 1: Using Service Account (Recommended for Production)

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Text-to-Speech API**
   ```bash
   gcloud services enable texttospeech.googleapis.com
   ```
   Or enable via Console: APIs & Services > Enable APIs

3. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Name: `phoenix-web-tts`
   - Grant role: `Cloud Text-to-Speech User`

4. **Generate Key File**
   - Click on the created service account
   - Go to Keys tab
   - Add Key > Create New Key > JSON
   - Save the downloaded file securely

5. **Set Environment Variable**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```
   
   Or add to `.env.local`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   ```

### Option 2: Using Application Default Credentials (Development)

For local development, you can use your personal Google account:

```bash
gcloud auth application-default login
```

### Option 3: Using API Key (Simpler but Less Secure)

1. Create an API Key in Google Cloud Console
2. Restrict it to Text-to-Speech API
3. Add to `.env.local`:
   ```
   GOOGLE_CLOUD_API_KEY=your-api-key-here
   ```

## Alternative: Client-Side with Firebase Extensions

You can also use Firebase Extensions for Text-to-Speech which handles authentication automatically:

1. Install the extension:
   ```bash
   firebase ext:install googlecloud/text-to-speech --project=phoenix-web-app
   ```

2. Configure the extension with your preferences

## Testing

After setup, test the audio generation:

1. Go to your presentations list
2. Click the menu (three dots) on any presentation
3. Select "Export as Podcast"
4. Generate a script
5. Click the microphone icon to generate audio

## Supported Languages and Voices

The system supports multiple voices for each language. See the voice mapping in `lib/ai/podcast-generator.ts`.

## Troubleshooting

### "Could not load the default credentials"
- Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly
- Check that the service account key file exists and is readable
- Verify the service account has the correct permissions

### "API not enabled"
- Enable the Text-to-Speech API in Google Cloud Console
- Wait a few minutes for the API to activate

### Audio quality issues
- Adjust `speakingRate` (0.25 to 4.0, default 1.0)
- Adjust `pitch` (-20.0 to 20.0, default 0.0)
- Voice quality is already optimized for maximum quality

## Voice Quality - CHIRP ONLY

This implementation uses **CHIRP VOICES EXCLUSIVELY**:

### Chirp Model (Where Available)
- **en-US-Polyglot-1** - Chirp multilingual voice for English/host
- **en-US-Casual-K** - Chirp casual voice for English/expert
- **es-US-Polyglot-1** - Spanish Chirp
- **fr-FR-Polyglot-1** - French Chirp  
- **de-DE-Polyglot-1** - German Chirp

### Why Chirp?
- Google's latest and most advanced TTS model
- Superior naturalness and human-like quality
- Better emotion, prosody, and expressiveness
- Multilingual capabilities
- Significantly better than Journey/Studio/Neural2

Note: For languages where Chirp isn't available yet, we temporarily use the next best option, but will upgrade to Chirp as soon as it's released.

All audio is generated at 24kHz with headphone optimization.

## Cost Considerations

Google Cloud Text-to-Speech pricing (Chirp voices):
- Chirp voices: $16 per 1 million characters
- Approximately $0.016 per 10-minute podcast
- Approximately $0.08 per hour of audio

Free tier includes:
- 1 million characters per month for premium voices
- This equals approximately 100 ten-minute podcasts per month free
- Or about 16 hours of audio content per month free