import React, { useState } from 'react';
import { speakerData } from '../data/speakerData';
import speakerImg from '../assets/speaker/speaker.jpg';
import { 
  UserCheck, 
  Terminal, 
  Sparkles, 
  Code, 
  Award, 
  Cpu, 
  Quote, 
  ExternalLink,
  Maximize2,
  X
} from 'lucide-react';

export const SpeakerSection: React.FC = () => {
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  return (
    <section id="speaker" className="py-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-cyan-700 mb-3 shadow-sm">
            <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
            <span>EXPERT LEADERSHIP</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            RESOURCE <span className="neon-text-gradient">PERSON</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Learn directly from an experienced engineer and technical community leader.
          </p>
        </div>

        {/* Speaker Card */}
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-6 sm:p-12 border-slate-200 shadow-xl relative overflow-hidden bg-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Speaker Photograph Column */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="relative group w-full max-w-xs cursor-pointer" onClick={() => setIsPhotoOpen(true)}>
                {/* Glowing ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-400 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />

                {/* Clear Photo Frame */}
                <div className="relative w-full aspect-[9/11] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-100 flex flex-col justify-end">
                  <img
                    src={speakerImg}
                    alt={`${speakerData.name} - Resource Person`}
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                  />

                  {/* Hover Expand Hint */}
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-white flex items-center gap-1 text-[10px] font-bold shadow-md">
                      <Maximize2 className="w-3.5 h-3.5" /> Full Photo
                    </span>
                  </div>

                  {/* Gradient Overlay with Name and Organization */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                      Lead Instructor & Keynote
                    </span>
                    <h4 className="text-lg font-extrabold text-white leading-tight">
                      {speakerData.name}
                    </h4>
                    <p className="text-xs text-slate-200 font-medium">
                      {speakerData.organization}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-emerald-700">
                  Confirmed Resource Person
                </span>
              </div>
            </div>

            {/* Speaker Bio & Expertise Column */}
            <div className="md:col-span-7">
              <div className="mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Featured Instructor & Speaker
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {speakerData.name}
                </h3>
                <p className="text-sm font-bold text-cyan-700 mt-1">
                  {speakerData.designation} &bull; {speakerData.organization}
                </p>
              </div>

              {/* Bio Paragraphs */}
              <div className="space-y-3 my-6 text-sm text-slate-600 leading-relaxed font-normal">
                {speakerData.bioParagraphs.map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>

              {/* Quote */}
              {speakerData.quote && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 border-l-4 border-l-cyan-500 mb-6 flex items-start gap-3 shadow-sm">
                  <Quote className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 italic">
                    &ldquo;{speakerData.quote}&rdquo;
                  </p>
                </div>
              )}

              {/* Core Expertise Tags */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Key Interests & Experience</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {speakerData.areasOfExpertise.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50 transition-colors shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Speaker Photo Modal */}
      {isPhotoOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsPhotoOpen(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-100">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{speakerData.name}</h4>
                <p className="text-xs text-cyan-700 font-semibold">{speakerData.organization} &bull; Keynote Resource Person</p>
              </div>
              <button
                onClick={() => setIsPhotoOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                aria-label="Close Photo View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden rounded-2xl bg-slate-50 mt-3">
              <img
                src={speakerImg}
                alt={`${speakerData.name} - Full Resolution`}
                className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
