import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldAlert, Sparkles, Calendar, ChevronRight } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, isAdminOpen }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    if (isAdminOpen) {
      onOpenAdmin();
    }
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-md shadow-slate-900/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => scrollToSection('hero')}
          className="cursor-pointer flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-pink-500 p-[1.5px] transition-transform duration-300 group-hover:scale-105 shadow-md shadow-cyan-500/10">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-600 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 tracking-wide">
                Dept of ECE
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-50 to-indigo-50 border border-cyan-200 text-cyan-800 hidden sm:inline-block shadow-2xs">
                AGMRCET
              </span>
            </div>
            <p className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-cyan-600 transition-colors leading-tight">
              ECO <span className="neon-text-gradient">AI-BOOTCAMP</span>
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/80 backdrop-blur-md">
          <button
            onClick={() => scrollToSection('hero')}
            className="px-3.5 py-1.5 rounded-full hover:text-cyan-700 hover:bg-white transition-all"
          >
            Overview
          </button>
          <button
            onClick={() => scrollToSection('journey')}
            className="px-3.5 py-1.5 rounded-full hover:text-cyan-700 hover:bg-white transition-all"
          >
            Our Journey
          </button>
          <button
            onClick={() => scrollToSection('agenda')}
            className="px-3.5 py-1.5 rounded-full hover:text-cyan-700 hover:bg-white transition-all"
          >
            Agenda
          </button>
          <button
            onClick={() => scrollToSection('speaker')}
            className="px-3.5 py-1.5 rounded-full hover:text-cyan-700 hover:bg-white transition-all"
          >
            Resource Person
          </button>
          <button
            onClick={() => scrollToSection('registration')}
            className="px-3.5 py-1.5 rounded-full hover:text-cyan-700 hover:bg-white transition-all"
          >
            Registration
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenAdmin}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${
              isAdminOpen
                ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
            }`}
            title="Administrator Access"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-600" />
            <span>Admin Portal</span>
          </button>

          <button
            onClick={() => scrollToSection('registration')}
            className="btn-shimmer relative group overflow-hidden rounded-xl p-[1px] font-bold text-xs transition-all active:scale-95 shadow-md shadow-cyan-600/15 hover:shadow-lg hover:shadow-cyan-600/25"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600"></span>
            <span className="relative flex items-center gap-2 px-4 py-2.5 rounded-[11px] bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-extrabold transition-all">
              <Calendar className="w-3.5 h-3.5" />
              <span>Register Now &bull; ₹200</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenAdmin}
            className="p-2 rounded-lg bg-white border border-slate-300 text-cyan-600 shadow-sm"
            title="Admin Portal"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-900 shadow-sm"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-4">
          <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            <button
              onClick={() => scrollToSection('hero')}
              className="text-left py-2 hover:text-cyan-600 border-b border-slate-100"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('journey')}
              className="text-left py-2 hover:text-cyan-600 border-b border-slate-100"
            >
              Our Journey of Innovation
            </button>
            <button
              onClick={() => scrollToSection('agenda')}
              className="text-left py-2 hover:text-cyan-600 border-b border-slate-100"
            >
              Bootcamp Agenda
            </button>
            <button
              onClick={() => scrollToSection('speaker')}
              className="text-left py-2 hover:text-cyan-600 border-b border-slate-100"
            >
              Resource Person
            </button>
            <button
              onClick={() => scrollToSection('registration')}
              className="text-left py-2 hover:text-cyan-600 border-b border-slate-100"
            >
              Student Registration
            </button>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => scrollToSection('registration')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-bold text-center text-sm shadow-md"
            >
              Register Now (₹200)
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-cyan-600" />
              <span>Coordinator & Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
