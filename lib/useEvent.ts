"use client";

import { useState, useEffect } from "react";

export interface EventConfig {
  nama: string;
  organisasi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  dresscode: string;
  contact: string;
  wa_intro: string;
}

// Hardcoded defaults shown before fetch completes (no flash)
const DEFAULTS: EventConfig = {
  nama:       "Ceremonial, Talkshow & Buka Bersama",
  organisasi: "BASNOM HIPMI OTOMOTIF JAWA BARAT",
  tanggal:    "7 Maret 2026",
  waktu:      "14.00 WIB - Selesai",
  lokasi:     "Thee Matic Mall Majalaya",
  dresscode:  "Hitam Gold",
  contact:    "Kabid Digital & Marketplace BPD HIPMI OTOMOTIF JAWA BARAT",
  wa_intro:   "Hana — Asisten Virtual BPD HIPMI OTOMOTIF JAWA BARAT",
};

let cached: EventConfig | null = null;

export function useEvent(): EventConfig {
  const [event, setEvent] = useState<EventConfig>(cached ?? DEFAULTS);

  useEffect(() => {
    if (cached) { setEvent(cached); return; }
    fetch("/api/event")
      .then((r) => r.json())
      .then((d: EventConfig) => { cached = d; setEvent(d); })
      .catch(() => { /* keep defaults */ });
  }, []);

  return event;
}
