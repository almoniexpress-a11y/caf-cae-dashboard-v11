// CAF CAE live configuration
// Local demo: keep API_URL empty or use http://localhost:3000
// Production example: API_URL: "https://api.cafcae.it"
window.CAF_CAE_CONFIG = {
  API_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : "https://caf-cae-dashboard-v11-production.up.railway.app",
  SHOPIFY_DASHBOARD_URL: "https://www.cafcae.it/apps/cae-commercialista",
  LIVE_SYNC: true,
  VERSION_POLL_SECONDS: 25
};
