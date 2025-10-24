# AI Server for Play Analysis

## Overview
This server provides AI-powered play analysis using Vertex AI (Google Gemini Vision).

## Setup

### Prerequisites
- Python 3.9+
- Google Cloud Project with Vertex AI enabled
- Service account with Vertex AI permissions

### Installation

```bash
pip install fastapi uvicorn pydantic google-cloud-aiplatform
```

### Configuration

1. Set environment variables:
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

2. Enable Vertex AI API in Google Cloud Console
3. Enable Generative AI for Vision (Gemini 1.5)

### Running Locally

```bash
cd server
uvicorn main:app --reload --port 8000
```

### Deploying to Cloud Run

```bash
gcloud run deploy play-analyzer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=your-project-id
```

## API Endpoint

### POST /api/analyze-image

Analyzes a play diagram image and returns detected positions and routes.

**Request:**
```json
{
  "gcsPath": "gs://bucket/path/to/image.png",
  "calibrated": {
    "losY": 300,
    "yardScale": 15.5,
    "rotationDeg": 2.3
  },
  "perspective": {
    "p": [
      {"x": 10, "y": 10},
      {"x": 790, "y": 10},
      {"x": 790, "y": 440},
      {"x": 10, "y": 440}
    ]
  }
}
```

**Response:**
```json
{
  "formationGuess": "Trips Right",
  "coverageGuess": "Cover 2",
  "confidence": 0.82,
  "tokens": [
    {"id": "QB", "role": "QB", "label": "QB", "x": 360, "y": 330}
  ],
  "routes": [
    {
      "id": "r1",
      "tokenId": "QB",
      "type": "route",
      "points": [{"x": 300, "y": 300}, {"x": 360, "y": 240}]
    }
  ]
}
```

## Vertex AI Integration

The server is stubbed with placeholder data. To enable real AI analysis:

1. Uncomment the Vertex AI code in `main.py`
2. Configure your GCS bucket for image storage
3. Update the prompt to match your specific use case
4. Test with sample images

## Frontend Integration

Update your web app to call this endpoint:

```typescript
const response = await fetch('https://your-cloud-run-url/api/analyze-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gcsPath: draft.sourceImagePath,
    calibrated: draft.calibrated,
    perspective: draft.perspective
  })
})
```
