"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Attendance } from "@/lib/schema";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────
type SortDir = "asc" | "desc";
type SortCol = keyof Attendance;
type ToastType = "error" | "success" | "warning";
interface Toast { show: boolean; title: string; msg: string; type: ToastType; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(str: string | null | undefined) {
  if (!str) return "—";
  try { return new Date(str).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return str; }
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function ToastEl({ toast, onHide }: { toast: Toast; onHide: () => void }) {
  const colors: Record<ToastType, { bg: string; border: string; icon: string }> = {
    error:   { bg: "#2d1a1a", border: "#7f1d1d", icon: "❌" },
    success: { bg: "#1a2d1a", border: "#14532d", icon: "✅" },
    warning: { bg: "#2d2210", border: "#713f12", icon: "⚠️" },
  };
  const c = colors[toast.type];
  useEffect(() => { if (toast.show) { const t = setTimeout(onHide, 4000); return () => clearTimeout(t); } }, [toast.show, onHide]);
  return (
    <div className="fixed bottom-6 left-1/2 z-[99999] min-w-[280px] max-w-[90vw] rounded-xl p-[0.85rem_1.1rem] shadow-2xl"
      style={{ transform: toast.show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(120%)", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)", background: c.bg, border: `1px solid ${c.border}`, color: "#fff" }}>
      <div className="flex items-start gap-3">
        <span>{c.icon}</span>
        <div><p className="text-sm font-semibold">{toast.title}</p><p className="text-xs opacity-80 mt-0.5">{toast.msg}</p></div>
      </div>
    </div>
  );
}

// ─── QR Scanner ───────────────────────────────────────────────────────────────
function QRScannerModal({ open, onClose, onToken }: { open: boolean; onClose: () => void; onToken: (t: string) => void; }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState("Menunggu QR...");
  const [manualToken, setManualToken] = useState("");

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!open) { stop(); return; }
    setStatus("Meminta akses kamera...");
    setManualToken("");
    if (!navigator.mediaDevices?.getUserMedia) { setStatus("⚠️ Browser tidak mendukung kamera. Gunakan input manual."); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setStatus("Arahkan ke QR Code undangan...");
      import("jsqr").then(({ default: jsQR }) => {
        intervalRef.current = setInterval(() => {
          const video = videoRef.current; const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
          canvas.width = video.videoWidth; canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d"); if (!ctx) return;
          ctx.drawImage(video, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) {
            let token = code.data;
            try { const url = new URL(token); token = url.searchParams.get("token") ?? token; } catch { /* raw token */ }
            stop(); onToken(token);
          }
        }, 400);
      });
    }).catch(() => setStatus("⚠️ Akses kamera ditolak. Gunakan input manual di bawah."));
    return stop;
  }, [open, stop, onToken]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.92)" }} onClick={(e) => { if (e.target === e.currentTarget) { stop(); onClose(); } }}>
      <div className="card-bg max-w-sm w-full rounded-2xl overflow-hidden">
        <div className="gold-gradient h-1 w-full" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-yellow-400">📷 Scan QR Tamu</h3>
            <button onClick={() => { stop(); onClose(); }} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
          </div>
          <p className="text-xs text-gray-500">Arahkan kamera ke QR Code pada undangan digital tamu.</p>
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 240 }}>
            <video ref={videoRef} className="w-full rounded-xl" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-2 border-yellow-600/70 rounded-xl pointer-events-none" style={{ animation: "scanPulse 1.5s ease-in-out infinite" }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-gray-600">Atau masukkan token manual:</p>
            <div className="flex gap-2">
              <input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Paste token undangan..."
                className="flex-1 bg-black border border-gray-700 text-white text-xs rounded-lg px-3 py-2 focus:border-yellow-600 outline-none" />
              <button onClick={() => { if (manualToken.trim()) { stop(); onToken(manualToken.trim()); onClose(); } }}
                className="btn-gold px-4 py-2 rounded-lg text-xs whitespace-nowrap">Check-in</button>
            </div>
          </div>
          <p className="text-xs text-center text-gray-600">{status}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Check-in Result Modal ────────────────────────────────────────────────────
function CheckinModal({ state, onClose }: { state: { show: boolean; icon: string; title: string; nama: string; sub: string; time?: string; isWarn?: boolean }; onClose: () => void }) {
  if (!state.show) return null;
  return (
    <div className="fixed inset-0 z-[99995] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.88)" }}>
      <div className="card-bg max-w-sm w-full rounded-2xl overflow-hidden">
        <div className="gold-gradient h-1 w-full" />
        <div className="p-7 space-y-4 text-center">
          <div className="text-6xl">{state.icon}</div>
          <h3 className="text-xl font-bold" style={{ color: state.isWarn ? "#f87171" : "#4ade80" }}>{state.title}</h3>
          <div className="rounded-xl p-4 space-y-2 text-left" style={{ background: "rgba(191,149,63,0.05)", border: "1px solid rgba(191,149,63,0.2)" }}>
            <p className="text-sm font-semibold text-white">{state.nama}</p>
            <p className="text-xs text-gray-400">{state.sub}</p>
            {state.time && <p className="text-xs text-gray-500 mt-2">🕐 Check-in: {state.time}</p>}
          </div>
          <button onClick={onClose} className="btn-gold w-full py-3 rounded-lg text-sm uppercase tracking-wide">OK</button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function ConfirmModal({ nama, onCancel, onConfirm }: { nama: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div className="card-bg max-w-sm w-full rounded-2xl p-6 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
        <h3 className="font-semibold text-lg">Hapus Data Ini?</h3>
        <p className="text-sm text-gray-400">Data &quot;{nama}&quot; akan dihapus secara permanen.</p>
        <div className="flex gap-3 mt-4">
          <button onClick={onCancel} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition">Batal</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-lg bg-red-700 text-white text-sm font-semibold hover:bg-red-600 transition">Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Report Page ─────────────────────────────────────────────────────────
export default function ReportPage() {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [allData, setAllData] = useState<Attendance[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterKomunitas, setFilterKomunitas] = useState("");
  const [filterCheckin, setFilterCheckin] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [toast, setToast] = useState<Toast>({ show: false, title: "", msg: "", type: "error" });
  const [deleteTarget, setDeleteTarget] = useState<Attendance | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [checkinModal, setCheckinModal] = useState({ show: false, icon: "", title: "", nama: "", sub: "", time: "", isWarn: false });

  const showToast = useCallback((title: string, msg: string, type: ToastType = "error") => setToast({ show: true, title, msg, type }), []);

  // session auth
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("admin_auth") === "1") {
      setAuthed(true);
    }
  }, []);

  const checkPin = () => {
    // NEXT_PUBLIC_ vars are inlined at build time by Next.js bundler
    const adminPin = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "12345678";
    if (pin === adminPin) { sessionStorage.setItem("admin_auth", "1"); setAuthed(true); }
    else { setPinErr(true); setPin(""); }
  };

  const loadData = useCallback(async () => {
    setTableLoading(true);
    try {
      const res = await fetch("/api/attendance");
      const json = await res.json();
      setAllData(json.data ?? []);
    } catch (e) { showToast("Error", "Gagal memuat data: " + (e as Error).message); }
    finally { setTableLoading(false); }
  }, [showToast]);

  useEffect(() => { if (authed) loadData(); }, [authed, loadData]);

  // ── Computed data ───────────────────────────────────────────────────────────
  const filtered = allData
    .filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.nama?.toLowerCase().includes(q) || r.komunitas?.toLowerCase().includes(q) || r.whatsapp?.includes(q);
      const matchSt = !filterStatus || r.status === filterStatus;
      const matchKm = !filterKomunitas || r.komunitas === filterKomunitas;
      const matchCi = !filterCheckin || (filterCheckin === "yes" ? !!r.checkin_at : !r.checkin_at);
      return matchSearch && matchSt && matchKm && matchCi;
    })
    .sort((a, b) => {
      const va = String(a[sortCol] ?? "").toLowerCase();
      const vb = String(b[sortCol] ?? "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const stats = {
    total: allData.length,
    hadir: allData.filter((r) => r.status === "Hadir").length,
    tidak: allData.filter((r) => r.status !== "Hadir").length,
    checkin: allData.filter((r) => !!r.checkin_at).length,
  };

  const uniqueKomunitas = [...new Set(allData.map((r) => r.komunitas).filter(Boolean))].sort();

  const sortBy = (col: SortCol) => {
    if (col === sortCol) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const doDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await fetch(`/api/attendance/${id}`, { method: "DELETE" });
      setAllData((prev) => prev.filter((r) => r.id !== id));
      showToast("Berhasil", "Data peserta telah dihapus.", "success");
    } catch { showToast("Error", "Gagal menghapus data."); }
  };

  const manualCheckin = async (row: Attendance) => {
    if (!confirm(`Tandai "${row.nama}" sebagai hadir (check-in)?`)) return;
    const now = new Date().toISOString();
    try {
      await fetch(`/api/attendance/${row.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checkin_at: now }) });
      setAllData((prev) => prev.map((r) => r.id === row.id ? { ...r, checkin_at: now } : r));
      showToast("Check-in Berhasil", `${row.nama} telah ditandai hadir.`, "success");
    } catch { showToast("Error", "Gagal check-in."); }
  };

  const resendWA = async (row: Attendance) => {
    if (!confirm(`Kirim ulang pesan WhatsApp ke ${row.nama} (${row.whatsapp})?`)) return;
    showToast("Mengirim WA...", `Mohon tunggu, mengirim ke ${row.whatsapp}`, "warning");
    try {
      const res = await fetch("/api/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, whatsapp: row.whatsapp, nama: row.nama, komunitas: row.komunitas, status: row.status, invite_token: row.invite_token }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setAllData((prev) => prev.map((r) => r.id === row.id ? { ...r, wa_sent: 1 } : r));
      showToast("WA Terkirim ✅", `Pesan berhasil dikirim ke ${row.nama}.`, "success");
    } catch (e) { showToast("Gagal Kirim WA", (e as Error).message, "error"); }
  };

  const processToken = useCallback(async (token: string) => {
    setScanOpen(false);
    try {
      const res = await fetch(`/api/token/${encodeURIComponent(token)}`, { method: "PATCH" });
      const data = await res.json();
      if (data.alreadyCheckin) {
        const row = allData.find((r) => r.invite_token === token);
        setCheckinModal({ show: true, icon: "⚠️", title: "Sudah Check-in", nama: row?.nama ?? "—", sub: row?.komunitas ?? "—", time: formatDate(row?.checkin_at ?? null), isWarn: true });
        return;
      }
      if (!res.ok) { showToast("Token Tidak Valid", data.error ?? "Token tidak ditemukan."); return; }
      setAllData((prev) => prev.map((r) => r.invite_token === token ? { ...r, checkin_at: data.checkin_at } : r));
      const row = allData.find((r) => r.invite_token === token);
      setCheckinModal({ show: true, icon: "✅", title: "Check-in Berhasil!", nama: row?.nama ?? "—", sub: row?.komunitas ?? "—", time: formatDate(data.checkin_at), isWarn: false });
    } catch (e) { showToast("Error", (e as Error).message); }
  }, [allData, showToast]);

  // ── Export ───────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (filtered.length === 0) { showToast("Tidak ada data", "Tidak ada data untuk diekspor.", "warning"); return; }
    const header = ["No.", "Nama Lengkap", "Komunitas / Instansi", "Nomor WhatsApp", "Status RSVP", "Check-in", "Alasan / Pesan", "Waktu Daftar"];
    const rows = filtered.map((r, i) => [i + 1, r.nama, r.komunitas, r.whatsapp, r.status, r.checkin_at ? formatDate(r.checkin_at) : "", r.alasan ?? "", r.created_at ?? ""]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [{ wch: 5 }, { wch: 28 }, { wch: 28 }, { wch: 18 }, { wch: 16 }, { wch: 22 }, { wch: 35 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Hadir");
    const sum = [["Laporan Kehadiran – BASNOM HIPMI OTOMOTIF JAWA BARAT"], [], ["Total RSVP", allData.length], ["Konfirmasi Hadir", stats.hadir], ["Tidak Hadir", stats.tidak], ["Sudah Check-in", stats.checkin], ["Diekspor pada", new Date().toLocaleString("id-ID")]];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), "Ringkasan");
    XLSX.writeFile(wb, `Daftar_Hadir_HIPMI_Otomotif_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("Berhasil", `${filtered.length} data diekspor ke Excel.`, "success");
  };

  // ─── Login Screen ────────────────────────────────────────────────────────────
  if (!authed) return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card-bg max-w-sm w-full rounded-2xl overflow-hidden">
        <div className="gold-gradient h-1 w-full" />
        <div className="p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold gold-text" style={{ fontFamily: "'Cinzel', serif" }}>Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">BASNOM HIPMI OTOMOTIF JABAR</p>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-semibold uppercase text-yellow-600 tracking-wide block mb-2">Masukkan PIN Admin</label>
            <input type="password" value={pin} onChange={(e) => { setPin(e.target.value); setPinErr(false); }} onKeyDown={(e) => e.key === "Enter" && checkPin()}
              placeholder="••••••••" maxLength={8} autoComplete="off"
              className="input-field w-full p-3 rounded-lg text-center text-lg tracking-widest" />
            {pinErr && <p className="text-red-400 text-xs text-center">PIN salah. Coba lagi.</p>}
            <button onClick={checkPin} className="btn-gold w-full py-3 rounded-lg text-sm uppercase tracking-widest">Masuk</button>
          </div>
        </div>
        <div className="gold-gradient h-0.5 w-full opacity-30" />
      </div>
      <ToastEl toast={toast} onHide={() => setToast((t) => ({ ...t, show: false }))} />
    </main>
  );

  // ─── Stat card helper ────────────────────────────────────────────────────────
  const SC = ({ label, val, color }: { label: string; val: number | string; color: string }) => (
    <div className="rounded-[0.75rem] p-5 border border-yellow-900/15 bg-[#101010]">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{val}</p>
    </div>
  );

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold gold-text" style={{ fontFamily: "'Cinzel', serif" }}>Laporan Kehadiran</h1>
            <p className="text-xs text-gray-500 mt-0.5">Ceremonial, Talkshow &amp; Buka Bersama · 7 Maret 2026</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setScanOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 transition font-semibold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              Scan QR
            </button>
            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-yellow-600/30 text-yellow-600 hover:bg-yellow-600/10 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button onClick={exportExcel} className="btn-gold flex items-center gap-2 px-4 py-2 rounded-lg text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              Export Excel
            </button>
            <button onClick={() => { sessionStorage.removeItem("admin_auth"); setAuthed(false); setPin(""); }} className="px-3 py-2 rounded-lg text-sm border border-red-900/40 text-red-500 hover:bg-red-900/20 transition" title="Keluar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SC label="Total RSVP" val={stats.total} color="gold-text" />
          <SC label="Konfirmasi Hadir" val={stats.hadir} color="text-green-400" />
          <SC label="Tidak Hadir" val={stats.tidak} color="text-red-400" />
          <SC label="Tingkat Hadir" val={stats.total > 0 ? Math.round((stats.hadir / stats.total) * 100) + "%" : "—"} color="text-yellow-400" />
          <SC label="✅ Check-in" val={stats.checkin} color="text-yellow-300" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍  Cari nama, komunitas, atau nomor WA..."
            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg px-4 py-2 text-sm focus:border-yellow-700 outline-none" />
          {[{ val: filterStatus, set: setFilterStatus, opts: [["", "Semua Status"], ["Hadir", "✅ Hadir"], ["Tidak Hadir", "❌ Tidak Hadir"]] },
            { val: filterCheckin, set: setFilterCheckin, opts: [["", "Semua Check-in"], ["yes", "🎫 Sudah Check-in"], ["no", "⏳ Belum Check-in"]] }].map((sel, i) => (
            <select key={i} value={sel.val} onChange={(e) => sel.set(e.target.value)} className="bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-yellow-700 outline-none">
              {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <select value={filterKomunitas} onChange={(e) => setFilterKomunitas(e.target.value)} className="bg-[#0d0d0d] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:border-yellow-700 outline-none">
            <option value="">Semua Komunitas</option>
            {uniqueKomunitas.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="card-bg rounded-2xl overflow-hidden">
          {tableLoading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="spinner w-6 h-6" /><span className="text-gray-500 text-sm">Memuat data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p>Belum ada data.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-yellow-900/15 rounded-[0.75rem]">
                <table className="w-full text-[0.8rem] border-collapse">
                  <thead>
                    <tr className="bg-yellow-900/8">
                      {[["#", ""], ["Nama", "nama"], ["Komunitas", "komunitas"], ["WhatsApp", "whatsapp"], ["RSVP", "status"], ["Check-in", "checkin_at"], ["WA", "wa_sent"], ["Alasan", ""], ["Waktu Daftar", "created_at"], ["", ""]].map(([label, col]) => (
                        <th key={label} onClick={col ? () => sortBy(col as SortCol) : undefined}
                          className={`px-4 py-3 text-left text-[0.7rem] tracking-[0.05em] uppercase text-yellow-700 whitespace-nowrap border-b border-yellow-900/15 ${col ? "cursor-pointer hover:bg-yellow-900/6 select-none" : ""}`}>
                          {label}{col && col === sortCol ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id} className="border-b border-white/4 hover:bg-yellow-900/4 transition-colors">
                        <td className="px-4 py-[0.7rem] text-gray-600 text-xs">{i + 1}</td>
                        <td className="px-4 py-[0.7rem] font-medium text-white">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span>{r.nama}</span>
                            {r.invite_token && (
                              <a href={`/invitation?token=${encodeURIComponent(r.invite_token)}`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold border border-yellow-700/40 text-yellow-600 hover:text-black hover:bg-yellow-600 px-2 py-1 rounded transition-colors" title="Buka undangan digital">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Link Reservasi
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-[0.7rem] text-gray-300">{r.komunitas}</td>
                        <td className="px-4 py-[0.7rem]">
                          <a href={`https://wa.me/${r.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-400 transition text-xs">{r.whatsapp}</a>
                        </td>
                        <td className="px-4 py-[0.7rem]">
                          <span className={r.status === "Hadir" ? "badge-hadir" : "badge-tidak"}>{r.status === "Hadir" ? "✅ Hadir" : "❌ Tidak Hadir"}</span>
                        </td>
                        <td className="px-4 py-[0.7rem]">
                          {r.checkin_at
                            ? <span className="badge-checkin">🎫 {formatDate(r.checkin_at)}</span>
                            : r.status === "Hadir"
                              ? <button onClick={() => manualCheckin(r)} className="text-xs px-2 py-1 rounded border border-yellow-700/40 text-yellow-700 hover:bg-yellow-900/20 transition whitespace-nowrap">Tandai Hadir</button>
                              : <span className="text-gray-700 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-[0.7rem]">
                          {r.wa_sent === 1
                            ? <span className="badge-wa-sent">✅ Terkirim</span>
                            : <button onClick={() => resendWA(r)} className="text-xs px-2 py-1 rounded border border-green-800/50 text-green-700 hover:bg-green-900/20 transition whitespace-nowrap">📤 Kirim WA</button>}
                        </td>
                        <td className="px-4 py-[0.7rem] text-gray-400 text-xs max-w-[160px] break-words">{r.alasan ?? "—"}</td>
                        <td className="px-4 py-[0.7rem] text-gray-500 text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                        <td className="px-4 py-[0.7rem]">
                          <button onClick={() => setDeleteTarget(r)} className="text-red-500/50 hover:text-red-500 hover:bg-red-900/10 p-1 rounded transition" title="Hapus">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-700 p-3 text-right border-t border-white/5">
                Menampilkan {filtered.length} dari {allData.length} data
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-gray-700 text-center">© 2026 BPD HIPMI OTOMOTIF JAWA BARAT – Dashboard Internal</p>
      </div>

      {/* Modals */}
      {deleteTarget && <ConfirmModal nama={deleteTarget.nama} onCancel={() => setDeleteTarget(null)} onConfirm={doDelete} />}
      <QRScannerModal open={scanOpen} onClose={() => setScanOpen(false)} onToken={processToken} />
      <CheckinModal state={checkinModal} onClose={() => setCheckinModal((m) => ({ ...m, show: false }))} />
      <ToastEl toast={toast} onHide={() => setToast((t) => ({ ...t, show: false }))} />
    </main>
  );
}
