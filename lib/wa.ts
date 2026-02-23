/** Server-side WA sender – runs in API Route, no CORS issue */
export async function sendWA(phone: string, message: string): Promise<void> {
  const waUrl = process.env.WA_API_URL;
  const user = process.env.WA_USER;
  const pass = process.env.WA_PASS;

  if (!waUrl || !user || !pass) {
    throw new Error(
      "WA_API_URL / WA_USER / WA_PASS belum diisi di .env.local"
    );
  }

  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(waUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ phone, message }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let detail = body;
      try {
        detail = JSON.parse(body)?.message ?? body;
      } catch {
        /* ignore */
      }
      throw new Error(`WA HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
  } catch (err) {
    clearTimeout(timeout);
    if ((err as Error).name === "AbortError") {
      throw new Error("WA timeout: server tidak merespons dalam 20 detik");
    }
    throw err;
  }
}
