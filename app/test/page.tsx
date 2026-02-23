"use client";

import { useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LogEntry { time: string; msg: string; type: "ok" | "err" | "inf" | "dim"; }

// ─── Test data defaults ───────────────────────────────────────────────────────
const DEFAULTS = {
  nama: "Cecep Saeful Azhar Hidayat, ST",
  komunitas: "HIPMI OTOMOTIF JAWA BARAT",
  whatsapp: "6285220696117",
  status: "Hadir",
  alasan: "InsyaAllah Hadir Donk",
};

export default function TestPage() {
  const [nama, setNama] = useState(DEFAULTS.nama);
  const [komunitas, setKomunitas] = useState(DEFAULTS.komunitas);
  const [whatsapp, setWhatsapp] = useState(DEFAULTS.whatsapp);
  const [status, setStatus] = useState(DEFAULTS.status);
  const [alasan, setAlasan] = useState(DEFAULTS.alasan);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [raw, setRaw] = useState("");
  const [running, setRunning] = useState(false);

  const now = () => new Date().toLocaleTimeString("id-ID");

  const log = (msg: string, type: LogEntry["type"] = "inf") =>
    setLogs((prev) => [...prev, { time: now(), msg, type }]);

  const clearLog = () => { setLogs([]); setRaw(""); };

  // ── 1. Ping DB ───────────────────────────────────────────────────────────────
  const pingDB = async () => {
    log("=== TEST: PING DB ===");
    try {
      const res = await fetch("/api/counter");
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      if (res.ok) {
        log(`✅ DB OK – total: ${data.total}, hadir: ${data.hadir}`, "ok");
      } else {
        log(`❌ DB error: ${data.error}`, "err");
      }
    } catch (e) { log(`❌ Network error: ${(e as Error).message}`, "err"); }
  };

  // ── 2. Cek Duplikat WA ───────────────────────────────────────────────────────
  const cekDuplikat = async () => {
    log("=== TEST: CEK DUPLIKAT WA ===");
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      const dup = (data.data ?? []).find((r: { whatsapp: string }) => r.whatsapp === whatsapp);
      if (dup) {
        log(`⚠️ Duplikat ditemukan: ${dup.nama} (ID: ${dup.id})`, "err");
      } else {
        log(`✅ Nomor ${whatsapp} belum terdaftar`, "ok");
      }
    } catch (e) { log(`❌ ${(e as Error).message}`, "err"); }
  };

  // ── 3. INSERT Data ───────────────────────────────────────────────────────────
  const insertData = async () => {
    log("=== TEST: INSERT DATA ===");
    log(`→ POST /api/rsvp  nama="${nama}"  wa=${whatsapp}`, "dim");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, komunitas, whatsapp, status, alasan }),
      });
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      if (res.ok) {
        log(`✅ Insert berhasil! Token: ${data.token?.slice(0, 20)}...`, "ok");
        log(`   WA terkirim: ${data.waSent ? "✅ Ya" : "❌ Tidak"}`, data.waSent ? "ok" : "err");
        if (data.waError) log(`   WA error: ${data.waError}`, "err");
      } else if (res.status === 409) {
        log(`⚠️ Duplikat: ${data.error}`, "err");
      } else {
        log(`❌ Error: ${data.error}`, "err");
      }
    } catch (e) { log(`❌ ${(e as Error).message}`, "err"); }
  };

  // ── 4. SELECT Semua ──────────────────────────────────────────────────────────
  const selectSemua = async () => {
    log("=== TEST: SELECT SEMUA ===");
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      const rows = data.data ?? [];
      log(`✅ Ditemukan ${rows.length} data`, "ok");
      rows.slice(0, 5).forEach((r: { id: number; nama: string; status: string }, i: number) =>
        log(`   ${i + 1}. [${r.id}] ${r.nama} – ${r.status}`, "dim")
      );
      if (rows.length > 5) log(`   ... dan ${rows.length - 5} lainnya`, "dim");
    } catch (e) { log(`❌ ${(e as Error).message}`, "err"); }
  };

  // ── 5. Hapus Data Terakhir ───────────────────────────────────────────────────
  const hapusDataTerakhir = async () => {
    log("=== TEST: HAPUS DATA TERAKHIR ===");
    try {
      const res = await fetch("/api/attendance");
      const data = await res.json();
      const rows = data.data ?? [];
      if (rows.length === 0) { log("⚠️ Tidak ada data", "err"); return; }
      const last = rows[0]; // ordered by id DESC
      log(`→ DELETE /api/attendance/${last.id}  (${last.nama})`, "dim");
      const del = await fetch(`/api/attendance/${last.id}`, { method: "DELETE" });
      const delData = await del.json();
      setRaw(JSON.stringify(delData, null, 2));
      if (del.ok) log(`✅ Data "${last.nama}" berhasil dihapus`, "ok");
      else log(`❌ Gagal hapus: ${delData.error}`, "err");
    } catch (e) { log(`❌ ${(e as Error).message}`, "err"); }
  };

  // ── 6. Test Kirim WA ─────────────────────────────────────────────────────────
  const testKirimWA = async () => {
    log("=== TEST: KIRIM WA ===");
    log(`→ POST /api/wa  ke ${whatsapp}`, "dim");
    try {
      const res = await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp, nama, komunitas, status }),
      });
      const data = await res.json();
      setRaw(JSON.stringify(data, null, 2));
      if (res.ok) {
        log(`✅ WA berhasil dikirim ke ${whatsapp}! Cek HP Anda.`, "ok");
      } else {
        log(`❌ WA gagal: ${data.error}`, "err");
      }
    } catch (e) { log(`❌ ${(e as Error).message}`, "err"); }
  };

  // ── Jalankan Semua ───────────────────────────────────────────────────────────
  const jalankanSemua = async () => {
    setRunning(true);
    clearLog();
    for (const [label, fn] of [
      ["1. Ping DB", pingDB],
      ["2. Cek Duplikat WA", cekDuplikat],
      ["3. INSERT Data", insertData],
      ["4. SELECT Semua", selectSemua],
    ] as [string, () => Promise<void>][]) {
      log(`\n▶ ${label}`, "inf");
      await fn();
      await new Promise((r) => setTimeout(r, 400));
    }
    setRunning(false);
  };

  const logColors: Record<LogEntry["type"], string> = {
    ok: "#4ade80", err: "#f87171", inf: "#a78bfa", dim: "#6b7280",
  };

  // ─── Input style ─────────────────────────────────────────────────────────────
  const inp = "bg-black border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 w-full focus:border-yellow-700 outline-none";

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Cinzel', serif" }}>
          🧪 HALAMAN TEST
        </h1>
        <p className="text-xs text-gray-500">
          Test via API Routes Next.js — WA dikirim server-side (no CORS issue!)
        </p>
      </div>

      {/* Data Uji */}
      <div className="card-bg rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold uppercase text-yellow-600 tracking-wide">Data Uji</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nama Lengkap</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Komunitas / Instansi</label>
            <input value={komunitas} onChange={(e) => setKomunitas(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nomor WhatsApp</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inp} style={{ background: "#000" }}>
              <option value="Hadir">✅ Hadir</option>
              <option value="Tidak Hadir">❌ Tidak Hadir</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Alasan / Pesan</label>
            <input value={alasan} onChange={(e) => setAlasan(e.target.value)} className={inp} />
          </div>
        </div>
      </div>

      {/* Tombol Test */}
      <div className="card-bg rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase text-yellow-600 tracking-wide">Pilih Test</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "1. Ping DB", fn: pingDB, color: "#1d4ed8" },
            { label: "2. Cek Duplikat WA", fn: cekDuplikat, color: "#7c3aed" },
            { label: "3. INSERT Data", fn: insertData, color: "#ea580c" },
            { label: "4. SELECT Semua", fn: selectSemua, color: "#0369a1" },
            { label: "5. Hapus Data Terakhir", fn: hapusDataTerakhir, color: "#b91c1c" },
          ].map(({ label, fn, color }) => (
            <button key={label} onClick={fn} disabled={running}
              className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition hover:brightness-110"
              style={{ background: color }}>
              {label}
            </button>
          ))}
          <button onClick={jalankanSemua} disabled={running}
            className="px-4 py-2 rounded-lg text-black text-sm font-bold disabled:opacity-50 btn-gold">
            {running ? "⏳ Running..." : "▶ Jalankan Semua (1-4)"}
          </button>
          <button onClick={testKirimWA} disabled={running}
            className="px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            style={{ background: "#16a34a" }}>
            7. Test Kirim WA
          </button>
        </div>
        <button onClick={clearLog} className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: "#7f1d1d" }}>
          🗑 Clear Log
        </button>
      </div>

      {/* Log Output */}
      <div className="card-bg rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold uppercase text-yellow-600 tracking-wide">Log Output</p>
        <div className="bg-black rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-0.5">
          {logs.length === 0
            ? <p className="text-gray-700">Log akan muncul di sini setelah menjalankan test...</p>
            : logs.map((l, i) => (
              <p key={i} style={{ color: logColors[l.type] }}>
                [{l.time}] {l.msg}
              </p>
            ))}
        </div>
      </div>

      {/* Raw Response */}
      {raw && (
        <div className="card-bg rounded-2xl p-5 space-y-3">
          <p className="text-xs font-semibold uppercase text-yellow-600 tracking-wide">Raw Response Terakhir</p>
          <pre className="bg-black rounded-xl p-4 text-xs text-gray-400 overflow-x-auto whitespace-pre-wrap">{raw}</pre>
        </div>
      )}

      <p className="text-xs text-gray-700 text-center pb-4">
        Halaman ini hanya untuk development — jangan share URL-nya
      </p>
    </main>
  );
}
