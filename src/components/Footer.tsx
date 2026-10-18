import React from 'react';
import { Sparkles, Building2, Calendar } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200 bg-white pt-16 pb-12 relative z-10 text-slate-600 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Balanced 3-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-slate-100">
          {/* Col 1: Event & Host Institution */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                </div>
              </div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                ECO <span className="neon-text-gradient">AI-BOOTCAMP</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>FROM PROMPTS TO PRODUCTS</strong> — A 3-Day Hands-On Bootcamp on Generative AI, Vibe Coding & AI Agents.
            </p>

            <div className="text-xs text-slate-600 space-y-1.5 pt-1">
              <p className="flex items-start gap-1.5">
                <Building2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>AGM Rural College of Engineering & Technology, Varur, Hubli, Karnataka</span>
              </p>
              <p className="flex items-center gap-1.5 pt-1">
                <Calendar className="w-4 h-4 text-pink-600 shrink-0" />
                <span>October 22–24, 2026</span>
              </p>
            </div>
          </div>

          {/* Col 2: Academic & Collaborating Leadership */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                ORGANIZING LEADERSHIP
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li className="hover:text-cyan-600 transition-colors">
                  Department of Electronics & Communication Engineering
                </li>
                <li className="hover:text-cyan-600 transition-colors">
                  ECO Association (ECE Student & Faculty Body)
                </li>
                <li className="hover:text-cyan-600 transition-colors">
                  Dr. Sumana Achar, Head of Department (ECE)
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                COLLABORATING ORGANIZATIONS
              </h4>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>&bull; Geminal Studio</li>
              </ul>
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              QUICK NAVIGATION
            </h4>
            <ul className="text-xs text-slate-600 space-y-2">
              <li>
                <button onClick={() => scrollTo('hero')} className="hover:text-cyan-600 transition-colors text-left">
                  Overview & IST Countdown
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('journey')} className="hover:text-cyan-600 transition-colors text-left">
                  Our Journey of Innovation (Gallery)
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('agenda')} className="hover:text-cyan-600 transition-colors text-left">
                  3-Day Practical AI Agenda
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('speaker')} className="hover:text-cyan-600 transition-colors text-left">
                  Resource Person Profile
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('registration')} className="hover:text-cyan-600 transition-colors text-left">
                  Student Registration Form
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean Bottom Copyright Line */}
        <div className="pt-8 text-center text-xs text-slate-500">
          <p>
            &copy; 2026 Department of ECE &amp; ECO Association, AGMRCET Varur. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
