import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Building2, 
  Users 
} from 'lucide-react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'UPCOMING' | 'LIVE' | 'CONCLUDED';
}

export const HeroSection: React.FC = () => {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: 'UPCOMING',
  });

  useEffect(() => {
    // Event Dates in Indian Standard Time (IST: UTC+5:30)
    const EVENT_START_UTC = new Date('2026-10-22T03:30:00.000Z').getTime();
    const EVENT_END_UTC = new Date('2026-10-24T12:30:00.000Z').getTime();

    const updateTimer = () => {
      const now = Date.now();

      if (now < EVENT_START_UTC) {
        const diff = EVENT_START_UTC - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          status: 'UPCOMING',
        });
      } else if (now >= EVENT_START_UTC && now <= EVENT_END_UTC) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          status: 'LIVE',
        });
      } else {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          status: 'CONCLUDED',
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial glow accents for light theme */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[480px] bg-gradient-to-tr from-cyan-400/15 via-indigo-400/10 to-pink-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-300/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Top Host & Organizer Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/95 border border-slate-200/90 text-xs text-slate-700 mb-6 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
            <span className="flex items-center gap-2 font-extrabold text-cyan-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              DEPARTMENT OF ECE &bull; ECO ASSOCIATION PRESENTS
            </span>
          </div>

          {/* Primary Event Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-4 leading-[1.1]">
            ECO <span className="neon-text-gradient">AI-BOOTCAMP</span>
          </h1>

          {/* Supporting Text */}
          <p className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 via-indigo-700 to-pink-600 tracking-wide mb-4">
            FROM PROMPTS TO PRODUCTS
          </p>

          {/* Detailed Description */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Turn your ideas into AI-powered applications. Master Generative AI, Prompt Engineering, Vibe Coding, AI Agents, and Project Deployment in a 3-day intensive hands-on experience.
          </p>

          {/* Event Metadata Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-w-3xl mx-auto mb-10 text-xs">
            <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 text-left border-slate-200 hover:border-cyan-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700 border border-cyan-200/70 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Event Dates</p>
                <p className="font-extrabold text-slate-900 text-sm">October 22–24, 2026</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 text-left border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700 border border-indigo-200/70 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Host Campus</p>
                <p className="font-extrabold text-slate-900 text-sm">AGMRCET, Varur, Hubli</p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3.5 flex items-center gap-3.5 text-left border-slate-200 hover:border-pink-300 hover:shadow-md transition-all sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-700 border border-pink-200/70 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-slate-500 font-medium text-[11px] uppercase tracking-wider">Collaboration</p>
                <p className="font-extrabold text-slate-900 text-sm">Geminal Studio</p>
              </div>
            </div>
          </div>

          {/* Indian Standard Time (IST) Countdown Timer */}
          <div className="max-w-xl mx-auto mb-10">
            <div className="relative p-[1.5px] rounded-3xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500 shadow-xl shadow-indigo-500/10">
              <div className="bg-white rounded-[23px] p-5 sm:p-7 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-800 tracking-wider">
                    <Clock className="w-4 h-4 text-cyan-600 animate-pulse" />
                    <span>COUNTDOWN TO BOOTCAMP</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    IST (UTC+5:30)
                  </div>
                </div>

                {countdown.status === 'UPCOMING' && (
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
                    <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
                      <span className="block text-2xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                        {countdown.days}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-1 block">
                        Days
                      </span>
                    </div>
                    <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
                      <span className="block text-2xl sm:text-4xl font-extrabold text-cyan-700 font-mono tracking-tight">
                        {String(countdown.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-cyan-700/80 uppercase tracking-wider mt-1 block">
                        Hours
                      </span>
                    </div>
                    <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
                      <span className="block text-2xl sm:text-4xl font-extrabold text-indigo-700 font-mono tracking-tight">
                        {String(countdown.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-indigo-700/80 uppercase tracking-wider mt-1 block">
                        Minutes
                      </span>
                    </div>
                    <div className="bg-slate-50/90 rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-xs">
                      <span className="block text-2xl sm:text-4xl font-extrabold text-pink-700 font-mono tracking-tight">
                        {String(countdown.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-pink-700/80 uppercase tracking-wider mt-1 block">
                        Seconds
                      </span>
                    </div>
                  </div>
                )}

                {countdown.status === 'LIVE' && (
                  <div className="py-4 text-center">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-extrabold shadow-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      BOOTCAMP IS LIVE RIGHT NOW AT AGMRCET!
                    </span>
                    <p className="text-xs text-slate-500 mt-2 font-medium">October 22–24, 2026 &bull; Department of ECE</p>
                  </div>
                )}

                {countdown.status === 'CONCLUDED' && (
                  <div className="py-4 text-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold">
                      Bootcamp 2026 Has Concluded Successfully!
                    </span>
                    <p className="text-xs text-slate-500 mt-2">Thank you to all attendees, faculty, and partners.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollTo('registration')}
              className="btn-shimmer w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-pink-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5"
            >
              <span>REGISTER NOW &bull; ₹200</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => scrollTo('journey')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-95 shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>EXPLORE OUR JOURNEY</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
