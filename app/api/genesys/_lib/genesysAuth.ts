
/**
 * Server-side Auth Library for Genesys Cloud
 * Handles OAuth Client Credentials flow using process.env secrets.
 */

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getGenesysToken() {
  const CLIENT_ID = process.env.GENESYS_CLIENT_ID;
  const CLIENT_SECRET = process.env.GENESYS_CLIENT_SECRET;
  const REGION = process.env.GENESYS_REGION || 'mec1.pure.cloud';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('SERVER_CONFIG_ERROR: Genesys credentials not configured in environment.');
  }

  // Check cache (with 1 minute buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return { token: tokenCache.token, region: REGION };
  }

  const authUrl = `https://login.${REGION}/oauth/token`;
  
  // Use btoa (standard in Next.js runtime) for Basic auth header
  const authHeader = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Genesys OAuth Failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };

  return { token: tokenCache.token, region: REGION };
}
