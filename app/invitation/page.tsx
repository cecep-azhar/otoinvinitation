"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { EVENT } from "@/lib/event";
import type { Attendance } from "@/lib/schema";

function formatDate(str: string | null) {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return str; }
}

export default function InvitationPage() {
  const [data, setData] = useState<Attendance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) { setError("Link tidak mengandung token. Pastikan link undangan yang Anda buka benar."); setLoading(false); return; }
    tokenRef.current = token;
    fetch(`/api/token/${encodeURIComponent(token)}`)
      .then((r) => { if (!r.ok) return r.json().then((e) => { throw new Error(e.error); }); return r.json(); })
      .then((d) => setData(d.data))
      .catch((e) => setError(e.message || "Gagal memuat undangan."))
      .finally(() => setLoading(false));
  }, []);

  const inviteURL = typeof window !== "undefined" ? window.location.href : "";
  const e = EVENT;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="spinner w-9 h-9 mx-auto" />
          <p className="text-sm text-gray-500">Memuat undangan digital Anda...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-4 animate-fade-in">
          <div className="text-5xl">🔍</div>
          <h2 className="text-xl font-semibold text-red-400">Undangan Tidak Ditemukan</h2>
          <p className="text-sm text-gray-500">{error ?? "Link undangan tidak valid atau telah kedaluwarsa."}</p>
          <a href="/" className="inline-block mt-4 px-6 py-2.5 rounded-lg text-sm font-medium border border-yellow-700/40 text-yellow-600 hover:bg-yellow-900/20 transition">
            ← Kembali ke Halaman RSVP
          </a>
        </div>
      </main>
    );
  }

  const isHadir = data.status === "Hadir";
  const isCheckedIn = !!data.checkin_at;
  const shareMsg = encodeURIComponent(
    `🎟️ *Undangan Digital Saya*\n\nHai! Ini undangan digital saya untuk acara *${e.nama}* – ${e.organisasi}.\n\n📅 ${e.tanggal} · ${e.waktu}\n📍 ${e.lokasi}\n\nKlik link di bawah untuk melihat tiket & QR check-in saya:\n${inviteURL}\n\n_Sampai jumpa di sana!_ 🚗✨`
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 py-10 relative">
      <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(191,149,63,0.3) 1px, transparent 1px), linear-gradient(to right, rgba(191,149,63,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="max-w-sm w-full animate-fade-in relative">
        {/* Used overlay */}
        {isCheckedIn && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[1.25rem]" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="text-5xl">✅</div>
            <p className="text-white font-bold text-lg">Sudah Check-in</p>
            <p className="text-sm text-gray-300">{formatDate(data.checkin_at)}</p>
            <p className="text-xs text-gray-500 mt-1 px-6 text-center">Tiket ini sudah digunakan. Selamat menikmati acara!</p>
          </div>
        )}

        <div className="ticket-card">
          {/* Header */}
          <div className="px-7 pt-8 pb-5 text-center relative z-10">
            <p className="text-xs tracking-[0.35em] text-yellow-600 uppercase mb-1">✦ Undangan Resmi ✦</p>
            <h1 className="text-2xl font-bold gold-text uppercase mt-1" style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.04em" }}>HIPMI OTOMOTIF</h1>
            <p className="text-xs text-gray-400 tracking-widest uppercase">Jawa Barat</p>
            <div className="divider-gold my-4" />
            <p className="text-sm text-gray-300 font-medium">{e.nama}</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1" style={{ fontFamily: "'Cinzel', serif" }}>{e.tanggal}</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.waktu}</p>
          </div>

          {/* Perforation */}
          <div className="perforation mx-6" />

          {/* Guest info */}
          <div className="px-7 py-5 relative z-10 space-y-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Nama Tamu</p>
              <h2 className="text-xl font-semibold text-white">{data.nama}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{data.komunitas}</p>
              <div className="mt-2 flex justify-center gap-2 flex-wrap">
                <span className={isHadir ? "badge-hadir" : "badge-tidak"}>
                  {isHadir ? "✅ Konfirmasi Hadir" : "❌ Tidak Hadir"}
                </span>
                {isCheckedIn && <span className="badge-checkin">🎫 Sudah Check-in</span>}
              </div>
            </div>

            {/* Event details */}
            <div className="space-y-2 rounded-xl p-4" style={{ background: "rgba(191,149,63,0.04)", border: "1px solid rgba(191,149,63,0.12)" }}>
              <div className="flex gap-2 items-start text-sm">
                <span className="flex-shrink-0 mt-0.5">📍</span>
                <span className="text-gray-300">{e.lokasi}</span>
              </div>
              <div className="flex gap-2 items-start text-sm">
                <span className="flex-shrink-0 mt-0.5">👔</span>
                <span className="text-gray-300">Dresscode: <span className="text-yellow-500 font-medium">{e.dresscode}</span></span>
              </div>
              <div className="flex gap-2 items-start text-sm">
                <span className="flex-shrink-0 mt-0.5">📞</span>
                <span className="text-gray-300 text-xs leading-relaxed">+{data.whatsapp}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-widest">QR Check-in</p>
              <div className={`bg-white rounded-xl p-3 w-fit mx-auto${isCheckedIn ? " opacity-40 grayscale" : ""}`} style={{ boxShadow: isCheckedIn ? "none" : "0 0 30px rgba(191,149,63,0.2)" }}>
                <QRCodeSVG value={inviteURL} size={200} level="H" />
              </div>
              <p className="text-xs text-gray-600">{isCheckedIn ? "Tiket ini sudah digunakan" : "Tunjukkan kepada panitia saat tiba di venue"}</p>
            </div>

            {/* Token */}
            <div className="text-center">
              <p className="text-xs text-gray-700 font-mono break-all">{tokenRef.current.slice(0, 20)}…</p>
            </div>
          </div>

          {/* Footer */}
          <div className="gold-gradient h-0.5 w-full opacity-30" />
          <div className="px-7 py-4 text-center relative z-10 space-y-3">
            <a
              href={`https://wa.me/?text=${shareMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#25D366" }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Bagikan via WhatsApp
            </a>
            <p className="text-xs text-gray-700">© 2026 BPD HIPMI OTOMOTIF JAWA BARAT</p>
          </div>
        </div>
      </div>
    </main>
  );
}
