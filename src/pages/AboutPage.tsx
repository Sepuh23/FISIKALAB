import React from 'react';
import { ArrowRight, ShieldCheck, BookOpen, Cpu } from 'lucide-react';
import { PageId } from '../types/physics';
import { PixelLabBanner } from '../components/PixelIllustrations';

interface AboutPageProps {
  onNavigate: (page: PageId) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <section className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-[#8FB5AE]/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs font-semibold text-[#4F6A66]">Tentang Platform</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1D3532]">
            PHYSILAB — Laboratorium Simulasi Fisika Interaktif
          </h1>
          <p className="text-base text-[#4F6A66] leading-relaxed">
            PHYSILAB dirancang sebagai ruang eksperimen fisika berbasis web yang mengutamakan kejelasan matematis, konsistensi Satuan Internasional (SI), dan visualisasi dinamis tanpa hambatan pendaftaran akun.
          </p>
        </div>
        <PixelLabBanner className="w-24 h-24 shrink-0" />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm space-y-2.5">
          <Cpu className="w-6 h-6 text-[#E26D62]" />
          <h2 className="font-display text-lg font-bold text-[#1D3532]">
            Mesin Fisika Terpadu
          </h2>
          <p className="text-sm text-[#4F6A66] leading-relaxed">
            Seluruh lima modul—Besaran dan Satuan, Kinematika, Dinamika, Energi, serta Termodinamika—menggunakan konstanta SI dan solver analitik/numerik yang konsisten.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm space-y-2.5">
          <ShieldCheck className="w-6 h-6 text-[#1D3532]" />
          <h2 className="font-display text-lg font-bold text-[#1D3532]">
            Parser Rumus Aman
          </h2>
          <p className="text-sm text-[#4F6A66] leading-relaxed">
            Fitur Unggah Rumus mengekstrak teks PDF atau gambar OCR secara lokal di browser, mewajibkan konfirmasi pengguna, dan mengevaluasi persamaan melalui parser AST matematika yang aman.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#8FB5AE]/25 shadow-sm space-y-2.5">
          <BookOpen className="w-6 h-6 text-[#8C685C]" />
          <h2 className="font-display text-lg font-bold text-[#1D3532]">
            Fokus Eksperimen Mandiri
          </h2>
          <p className="text-sm text-[#4F6A66] leading-relaxed">
            Platform ini bukan sistem manajemen kelas atau media sosial. Seluruh antarmuka difokuskan untuk simulasi interaktif, kalkulator langkah demi langkah, dan grafik ilmiah.
          </p>
        </div>
      </section>

      <section className="bg-[#CBE2DD]/65 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-[#8FB5AE]/35">
        <div>
          <h2 className="font-display text-xl font-bold text-[#1D3532]">
            Siap Melakukan Eksperimen?
          </h2>
          <p className="text-sm text-[#4F6A66] mt-1">
            Langsung buka Ruang Simulasi atau uji persamaan Anda di halaman Unggah Rumus.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onNavigate('simulasi')}
            className="px-5 py-2.5 rounded-xl bg-[#E26D62] text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ruang Simulasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('unggah-rumus')}
            className="px-5 py-2.5 rounded-xl bg-white text-[#1D3532] text-sm font-semibold border border-[#8FB5AE]/40 cursor-pointer"
          >
            Unggah Rumus
          </button>
        </div>
      </section>
    </div>
  );
};
