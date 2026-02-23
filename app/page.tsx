"use client";

import { useState, useEffect, useRef } from "react";
import { EVENT } from "@/lib/event";

interface ToastState {
  show: boolean;
  title: string;
  msg: string;
  type: "error" | "success" | "warning";
}

interface ModalState {
  show: boolean;
  nama: string;
  status: string;
  inviteURL: string;
}

function Toast({ state, onHide }: { state: ToastState; onHide: () => void }) {
  const colors = {
    error: { bg: "#2d1a1a", border: "#7f1d1d", icon: "❌" },
    success: { bg: "#1a2d1a", border: "#14532d", icon: "✅" },
    warning: { bg: "#2d2210", border: "#713f12", icon: "⚠️" },
  };
  const c = colors[state.type];

  useEffect(() => {
    if (state.show) {
      const t = setTimeout(onHide, 4000);
      return () => clearTimeout(t);
    }
  }, [state.show, onHide]);

  return (
    <div
      className="fixed bottom-8 left-1/2 z-[9999] min-w-[300px] max-w-[90vw] rounded-xl p-4 shadow-2xl transition-transform duration-400"
      style={{
        transform: state.show
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(120%)",
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: "#fff",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{c.icon}</span>
        <div>
          <p className="text-sm font-semibold">{state.title}</p>
          <p className="text-xs opacity-80 mt-0.5">{state.msg}</p>
        </div>
      </div>
    </div>
  );
}

export default function RSVPPage() {
  const [nama, setNama] = useState("");
  const [komunitas, setKomunitas] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState("Hadir");
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState<{ total: number; hadir: number } | null>(null);
  const [modal, setModal] = useState<ModalState>({ show: false, nama: "", status: "", inviteURL: "" });
  const [toast, setToast] = useState<ToastState>({ show: false, title: "", msg: "", type: "error" });
  const [errors, setErrors] = useState<{ nama?: boolean; komunitas?: boolean; whatsapp?: boolean }>({});

  const showToast = (title: string, msg: string, type: ToastState["type"] = "error") => {
    setToast({ show: true, title, msg, type });
  };

  const validateWA = (val: string) => /^628\d{7,13}$/.test(val.replace(/[\s-]/g, ""));

  // Auto-format WA on blur
  const handleWABlur = () => {
    let val = whatsapp.trim().replace(/\D/g, "");
    if (val.startsWith("0")) val = "62" + val.slice(1);
    if (val.startsWith("8")) val = "62" + val;
    setWhatsapp(val);
  };

  // Load counter
  useEffect(() => {
    fetch("/api/counter")
      .then((r) => r.json())
      .then((d) => setCounter(d))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const waClean = whatsapp.trim().replace(/\D/g, "");
    const newErrors: typeof errors = {};
    if (!nama.trim()) newErrors.nama = true;
    if (!komunitas.trim()) newErrors.komunitas = true;
    if (!validateWA(waClean)) newErrors.whatsapp = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast("Form belum lengkap", "Harap periksa kolom yang ditandai merah.", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: nama.trim(), komunitas: komunitas.trim(), whatsapp: waClean, status, alasan: alasan.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          showToast("Sudah Terdaftar", data.error, "warning");
        } else {
          showToast("Terjadi Kesalahan", data.error || "Coba lagi nanti.", "error");
        }
        return;
      }

      // Success
      setModal({ show: true, nama: nama.trim(), status, inviteURL: data.inviteURL ?? "" });
      setNama(""); setKomunitas(""); setWhatsapp(""); setAlasan(""); setStatus("Hadir");
      setErrors({});
      // Refresh counter
      fetch("/api/counter").then((r) => r.json()).then((d) => setCounter(d)).catch(() => {});
      // WA warning if failed
      if (!data.waSent && data.waError) {
        setTimeout(() => showToast("WA Belum Terkirim", data.waError, "warning"), 700);
      }
    } catch (err) {
      showToast("Network Error", (err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  const e = EVENT;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 py-10 relative">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(191,149,63,0.3) 1px, transparent 1px), linear-gradient(to right, rgba(191,149,63,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Main Card */}
      <div className="max-w-md w-full card-bg ring-gold rounded-2xl overflow-hidden animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <div className="gold-gradient h-1 w-full" />

        <div className="p-8">
          {/* Header */}
          <header className="text-center mb-8">
            <p className="text-[0.65rem] tracking-[0.3em] mb-3" style={{ color: "rgba(191,149,63,0.5)" }}>✦ &nbsp; B A S N O M &nbsp; ✦</p>
            <h1 className="text-3xl font-bold gold-text uppercase" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}>HIPMI OTOMOTIF</h1>
            <p className="text-xs tracking-widest text-white mt-1 uppercase">Jawa Barat</p>

            <div className="divider-gold my-5" />

            {/* Event info */}
            <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(191,149,63,0.05)", border: "1px solid rgba(191,149,63,0.15)" }}>
              <p className="text-sm text-white font-medium">{e.nama}</p>
              <p className="text-xl font-semibold text-yellow-400" style={{ fontFamily: "'Cinzel', serif" }}>{e.tanggal}</p>
              <p className="text-xs text-white">{e.waktu}</p>
              <div className="divider-gold my-2" />
              <p className="text-xs text-white">📍 {e.lokasi}</p>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(191,149,63,0.15)", border: "1px solid rgba(191,149,63,0.35)", color: "#FCF6BA" }}>
                Dresscode: {e.dresscode}
              </div>
            </div>

            {/* Live counter */}
            <div className="rounded-full px-4 py-2 mt-4 inline-flex items-center gap-2 text-xs text-yellow-500" style={{ background: "rgba(191,149,63,0.12)", border: "1px solid rgba(191,149,63,0.3)" }}>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>
                {counter ? `${counter.total} peserta terdaftar · ${counter.hadir} konfirmasi hadir` : "RSVP terbuka – daftar sekarang!"}
              </span>
            </div>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold uppercase text-yellow-600 mb-1.5 tracking-wide">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={nama}
                onChange={(e) => { setNama(e.target.value); if (e.target.value.trim()) setErrors(prev => ({ ...prev, nama: false })); }}
                placeholder="Masukkan nama lengkap Anda"
                className={`input-field w-full p-3 rounded-lg text-sm${errors.nama ? " error" : nama.trim() ? " valid" : ""}`}
                autoComplete="name"
              />
              {errors.nama && <p className="text-red-400 text-xs mt-1">Nama tidak boleh kosong.</p>}
            </div>

            {/* Komunitas */}
            <div>
              <label className="block text-xs font-semibold uppercase text-yellow-600 mb-1.5 tracking-wide">Komunitas / Instansi <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={komunitas}
                onChange={(e) => { setKomunitas(e.target.value); if (e.target.value.trim()) setErrors(prev => ({ ...prev, komunitas: false })); }}
                placeholder="Nama komunitas atau instansi Anda"
                className={`input-field w-full p-3 rounded-lg text-sm${errors.komunitas ? " error" : komunitas.trim() ? " valid" : ""}`}
              />
              {errors.komunitas && <p className="text-red-400 text-xs mt-1">Komunitas tidak boleh kosong.</p>}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold uppercase text-yellow-600 mb-1.5 tracking-wide">Nomor WhatsApp <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm select-none">+</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => { setWhatsapp(e.target.value); if (validateWA(e.target.value.replace(/\D/g, ""))) setErrors(prev => ({ ...prev, whatsapp: false })); }}
                  onBlur={handleWABlur}
                  placeholder="628xxxxxxxxxx"
                  maxLength={15}
                  className={`input-field w-full p-3 pl-6 rounded-lg text-sm${errors.whatsapp ? " error" : validateWA(whatsapp.replace(/\D/g, "")) ? " valid" : ""}`}
                />
              </div>
              <p className="text-white text-xs mt-1">Format: 628xxx (tanpa spasi atau tanda hubung)</p>
              {errors.whatsapp && <p className="text-red-400 text-xs mt-1">Nomor WhatsApp tidak valid (format: 628xxx).</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold uppercase text-yellow-600 mb-1.5 tracking-wide">Konfirmasi Kehadiran <span className="text-red-500">*</span></label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field w-full p-3 rounded-lg text-sm cursor-pointer"
                style={{ background: "#0d0d0d" }}
              >
                <option value="Hadir">✅   Hadir</option>
                <option value="Tidak Hadir">❌   Tidak Hadir</option>
              </select>
            </div>

            {/* Alasan */}
            <div>
              <label className="block text-xs font-semibold uppercase text-yellow-600 mb-1.5 tracking-wide">
                Alasan / Pesan <span className="text-white text-xs normal-case font-normal">(opsional)</span>
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={3}
                maxLength={300}
                placeholder="Catatan tambahan, ucapan, atau alasan jika tidak hadir..."
                className="input-field w-full p-3 rounded-lg text-sm resize-none"
              />
              <p className="text-right text-xs text-white">{alasan.length}/300</p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl text-sm uppercase tracking-widest mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner w-[18px] h-[18px] border-black/30 border-t-black" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi Sekarang"
              )}
            </button>
            <p className="text-center text-xs text-white pt-1">
              Data Anda akan disimpan dan konfirmasi dikirim via WhatsApp.
            </p>
          </form>
        </div>

        <div className="gold-gradient h-0.5 w-full opacity-40" />
        <div className="text-center py-4 text-xs text-white space-y-0.5">
          <p className="font-semibold text-yellow-400">Kabid Digital &amp; Marketplace</p>
          <p>© 2026 &nbsp;BPD HIPMI OTOMOTIF JAWA BARAT</p>
        </div>
      </div>

      {/* Success Modal */}
      {modal.show && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(m => ({ ...m, show: false })); }}
        >
          <div className="card-bg rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" style={{ transform: "scale(1)", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div className="gold-gradient h-1 w-full" />
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "rgba(191,149,63,0.15)", border: "2px solid rgba(191,149,63,0.4)" }}>
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold gold-text" style={{ fontFamily: "'Cinzel', serif" }}>Berhasil!</h2>
              <p className="text-sm text-white">
                {modal.status === "Hadir" ? "✅" : "📋"} {modal.nama}, konfirmasi kehadiran ({modal.status}) Anda telah kami terima!
              </p>
              {modal.status === "Hadir" && modal.inviteURL && (
                <>
                  <p className="text-xs text-white">Pesan konfirmasi + link undangan digital telah dikirim ke WhatsApp Anda.</p>
                  <div className="rounded-xl p-3 text-left space-y-2" style={{ background: "rgba(191,149,63,0.06)", border: "1px solid rgba(191,149,63,0.2)" }}>
                    <p className="text-xs text-yellow-600 font-semibold uppercase tracking-wide">🎟️ Undangan Digital Anda</p>
                    <p className="text-xs text-gray-400 break-all">{modal.inviteURL}</p>
                    <a
                      href={modal.inviteURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-2 rounded-lg text-xs font-semibold text-black btn-gold"
                    >
                      Buka Undangan Digital →
                    </a>
                  </div>
                </>
              )}
              <button
                onClick={() => setModal(m => ({ ...m, show: false }))}
                className="btn-gold w-full py-3 rounded-lg text-sm uppercase tracking-wider mt-2"
              >
                Tutup
              </button>
            </div>
            <div className="gold-gradient h-0.5 w-full opacity-40" />
          </div>
        </div>
      )}

      <Toast state={toast} onHide={() => setToast(t => ({ ...t, show: false }))} />
    </main>
  );
}
