/**
 * Cloudflare Worker – WA Proxy
 * Deploy di: https://dash.cloudflare.com → Workers & Pages → Create Worker
 * Ganti nama worker bebas, misal: wa-proxy
 * URL worker akan jadi: https://wa-proxy.<subdomain>.workers.dev
 *
 * Cara deploy:
 * 1. Buka https://dash.cloudflare.com → Workers & Pages → Create Worker
 * 2. Klik "Edit Code", paste seluruh isi file ini
 * 3. Klik "Deploy"
 * 4. Salin URL worker (misal https://wa-proxy.xxx.workers.dev)
 * 5. Ganti WA_API_URL di js/config.js dengan URL worker tersebut
 */

const WA_TARGET  = "https://wa.fath.my.id/send/message";
const WA_USER    = "cecep";
const WA_PASS    = "126126";
const BASIC_AUTH = "Basic " + btoa(WA_USER + ":" + WA_PASS);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
    }

    try {
      const body = await request.text();

      const waRes = await fetch(WA_TARGET, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": BASIC_AUTH,
        },
        body: body,
      });

      const resBody = await waRes.text();

      return new Response(resBody, {
        status:  waRes.status,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status:  502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
