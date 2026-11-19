import React from 'react';
import { PageId } from '../types/physics';
import { PixelLogoMark } from './PixelIllustrations';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#CBE2DD]/65 border-t border-[#8FB5AE]/40 mt-auto">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PixelLogoMark className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-display text-sm font-bold text-[#1D3532]">
              PHYSILAB — Laboratorium Simulasi Fisika Interaktif
            </p>
            <p className="text-xs text-[#4F6A66]">
              Platform eksperimen fisika berbasis Satuan Internasional (SI) tanpa perlu masuk akun.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#4F6A66]">
          <button type="button" onClick={() => onNavigate('beranda')} className="hover:text-[#1D3532] cursor-pointer">
            Beranda
          </button>
          <button type="button" onClick={() => onNavigate('topik')} className="hover:text-[#1D3532] cursor-pointer">
            Topik Fisika
          </button>
          <button type="button" onClick={() => onNavigate('simulasi')} className="hover:text-[#1D3532] cursor-pointer">
            Ruang Simulasi
          </button>
          <button type="button" onClick={() => onNavigate('unggah-rumus')} className="hover:text-[#1D3532] cursor-pointer">
            Unggah Rumus
          </button>
          <button type="button" onClick={() => onNavigate('tentang')} className="hover:text-[#1D3532] cursor-pointer">
            Tentang PHYSILAB
          </button>
        </div>
      </div>
    </footer>
  );
};
