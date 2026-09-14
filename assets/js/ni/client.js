import { createClient } from './vendor/insforge-sdk.js';
import { NI_CONFIG } from './config.js';

let client;

/**
 * Single shared InsForge browser client (anon key + JWT session).
 */
export function getClient() {
  if (!client) {
    if (!NI_CONFIG?.baseUrl || !NI_CONFIG?.anonKey || NI_CONFIG.anonKey.includes('your_anon')) {
      throw new Error('NI config missing. Copy assets/js/ni/config.example.js → config.js or run npm run ni:config');
    }
    client = createClient({
      baseUrl: NI_CONFIG.baseUrl,
      anonKey: NI_CONFIG.anonKey,
    });
  }
  return client;
}

export { NI_CONFIG };
