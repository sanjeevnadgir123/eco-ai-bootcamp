import React from 'react';
import { Cpu, Sparkles, Code2, Globe2, Award } from 'lucide-react';

export const PartnerLogos: React.FC = () => {
  const partners = [
    {
      role: 'Host Institution',
      title: 'AGMRCET, Varur',
      subtitle: 'AGM Rural College of Engineering and Technology, Hubli, Karnataka',
      icon: <Award className="w-5 h-5 text-cyan-600" />,
      accent: 'border-cyan-200 hover:border-cyan-400',
    },
    {
      role: 'Organizing Department',
      title: 'Department of ECE',
      subtitle: 'Electronics & Communication Engineering',
      icon: <Cpu className="w-5 h-5 text-indigo-600" />,
      accent: 'border-indigo-200 hover:border-indigo-400',
    },
    {
      role: 'Department Association',
      title: 'ECO Association',
      subtitle: 'Electronics & Communication Organization',
      icon: <Sparkles className="w-5 h-5 text-emerald-600" />,
      accent: 'border-emerald-200 hover:border-emerald-400',
    },
    {
      role: 'Collaborating Partner',
      title: 'Geminal Studio',
      subtitle: 'Creative AI & Digital Innovation Studio',
      icon: <Globe2 className="w-5 h-5 text-pink-600" />,
      accent: 'border-pink-200 hover:border-pink-400',
    },
    {
      role: 'Tech Community Partner',
      title: 'OSCode Tech Community',
      subtitle: 'AGMRCET Student Chapter',
      icon: <Code2 className="w-5 h-5 text-violet-600" />,
      accent: 'border-violet-200 hover:border-violet-400',
    },
  ];

  return (
    <div className="py-14 border-y border-slate-200/80 bg-white/60 backdrop-blur-md relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-slate-300"></div>
          <p className="text-center text-[11px] uppercase tracking-widest text-slate-500 font-extrabold">
            Organized By &amp; In Collaboration With
          </p>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-slate-300"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {partners.map((p, i) => (
            <div
              key={i}
              className={`glass-card p-4.5 rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 shadow-xs hover:shadow-lg ${p.accent} bg-white/90`}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                  {p.icon}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    {p.role}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 block leading-tight">
                    {p.title}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {p.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
