/**
 * Example public InsForge config. Copy to config.js and fill values from:
 *   npx -y @insforge/cli secrets get ANON_KEY
 *   .insforge/project.json → oss_host
 * Or run: npm run ni:config
 */
export const NI_CONFIG = {
  baseUrl: 'https://YOUR_APPKEY.REGION.insforge.app',
  anonKey: 'your_anon_key_here',
};
