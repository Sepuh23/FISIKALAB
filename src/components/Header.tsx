import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PageId } from '../types/physics';
import { PixelLogoMark } from './PixelIllustrations';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'topik', label: 'Topik Fisika' },
  { id: 'simulasi', label: 'Ruang Simulasi' },
  { id: 'unggah-rumus', label: 'Unggah Rumus' },
  { id: 'tentang', label: 'Tentang PHYSILAB' },
];

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (id: PageId) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#CBE2DD]/95 backdrop-blur-md border-b border-[#8FB5AE]/35">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('beranda')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D3532] rounded-lg px-1 py-1"
        >
          <PixelLogoMark className="w-7 h-7 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-[#1D3532]">
            PHYSILAB
          </span>
        </button>

        {/* Zone 2: 5 Clean Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Navigasi utama">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 transition-colors cursor-pointer relative ${
                  active
                    ? 'text-[#1D3532] font-semibold'
                    : 'text-[#4F6A66] hover:text-[#1D3532]'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[#E26D62] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('simulasi')}
            className="px-4 py-2 bg-[#E26D62] hover:bg-[#cf5e53] text-white text-sm font-semibold rounded-xl shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98]"
          >
            Mulai Simulasi
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl bg-[#EFF5F4] text-[#1D3532] hover:bg-white transition-colors cursor-pointer"
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#8FB5AE]/30 bg-[#EFF5F4] px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#CBE2DD] text-[#1D3532] font-semibold'
                    : 'text-[#4F6A66] hover:bg-[#CBE2DD]/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
