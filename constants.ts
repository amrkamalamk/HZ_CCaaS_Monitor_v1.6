
import { Region } from './types';

export const GENESYS_ORG_DEFAULT = 'horizonscope-cx2';
export const GENESYS_REGION_DEFAULT = Region.UAE;
export const MOS_THRESHOLD_DEFAULT = 4.5;
export const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const QUEUE_NAME_DEFAULT = 'Super Chicken';

/**
 * Detection logic for Preview/Local environments.
 */
export const isLocalOrPreview = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname.includes('webcontainer') || 
   window.location.hostname.includes('stackblitz') ||
   window.location.hostname.includes('preview') ||
   window.location.hostname.includes('ext-preview') ||
   window.location.protocol === 'file:');

/**
 * Note: Secrets (Client ID/Secret) are now stored exclusively in 
 * server-side environment variables and are never sent to the client.
 */
