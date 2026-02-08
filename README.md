
# Mawsool - Telemetry & Planning Dashboard

Mawsool is a specialized monitoring and planning dashboard for Genesys Cloud UAE. It provides real-time MOS (Mean Opinion Score) analysis, traffic insights, and historical-based staffing planning.

## 🚀 Deployment Instructions (Vercel)

### 1. Obtain a Genesys OAuth Token
- Log in to your Genesys Cloud UAE admin console.
- Create a **Client Credentials** grant under Integrations > OAuth.
- Assign the following scopes:
  - `analytics:readonly`
  - `routing:readonly`
- Use the Client ID and Secret to generate a token (e.g., via Postman or cURL).

### 2. Configure Vercel
In your Vercel project settings (Environment Variables), add:
- `GENESYS_CLIENT_ID`: Your OAuth Client ID.
- `GENESYS_CLIENT_SECRET`: Your OAuth Client Secret.
- `API_KEY`: Your Google Gemini API Key (Required for the AI Analyst tab).

### 3. Deploy
Push the project code to your Git provider connected to Vercel.

## 📱 Features
- **Real-time MOS Monitoring**: Visualizes voice quality across the UAE region.
- **AI Analyst**: Uses Gemini 3 Pro to generate forensic hypotheses on quality dips.
- **Staffing Planner**: Historical-based demand modeling for the next 7 days (Baghdad Sync).
- **PWA Support**: Installable on Android and iOS with offline status indicators.

## 🔒 Logic Assumptions
Staffing calculations use the Intensity method: `(Answered Calls * AHT) / 3600`, multiplied by a 1.3 (30%) shrinkage buffer. Operating hours are defined as 09:00 to 03:00 Baghdad time.
