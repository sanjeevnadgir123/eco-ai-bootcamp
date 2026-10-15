import React, { useState } from 'react';
import { bootcampAgenda } from '../data/bootcampAgenda';
import { 
  Calendar, 
  Terminal, 
  Cpu, 
  Rocket, 
  CheckCircle2, 
  Sparkles, 
  Gamepad2, 
  Lightbulb, 
  Check, 
  HelpCircle 
} from 'lucide-react';

export const AgendaSection: React.FC = () => {
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState<number>(0);

  const activeDay = bootcampAgenda[activeDayIndex];

  const getDayIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal':
        return <Terminal className="w-5 h-5 text-cyan-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-indigo-600" />;
      case 'Rocket':
        return <Rocket className="w-5 h-5 text-pink-600" />;
      default:
        return <Terminal className="w-5 h-5 text-cyan-600" />;
    }
  };

  // Mini "Guess the AI Term" Game for Day 1
  const aiTrivia = {
    clue: "An autonomous software entity that perceives its environment, reasons through complex multi-step objectives, invokes external tools, and accomplishes real-world software workflows.",
    options: ['AI Agent', 'Tokenizer', 'Static Parser', 'Compiler Script'],
    correct: 'AI Agent',
    explanation: 'Correct! AI Agents reason dynamically and execute tool actions autonomously — a core focus of Day 1 and Day 2 of our bootcamp!',
  };

  return (
    <section id="agenda" className="py-24 relative overflow-hidden bg-slate-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-cyan-700 mb-3 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-cyan-600" />
            <span>PRACTICAL SYLLABUS & WORKFLOWS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            THREE DAYS. REAL PROJECTS.{' '}
            <span className="violet-magenta-gradient">PRACTICAL AI.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            A comprehensive, hands-on roadmap designed to take you from foundational prompts to deployed production apps.
          </p>
        </div>

        {/* Day Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-4xl mx-auto">
          {bootcampAgenda.map((day, idx) => {
            const isActive = activeDayIndex === idx;
            return (
              <button
                key={day.day}
                onClick={() => setActiveDayIndex(idx)}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-start gap-4 ${
                  isActive
                    ? 'bg-gradient-to-br from-white to-cyan-50/60 border-cyan-500 shadow-md scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div
                  className={`p-3 rounded-xl border ${
                    isActive
                      ? 'bg-cyan-50 border-cyan-200 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  {getDayIcon(day.iconName)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-700">
                      Day 0{day.day}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {day.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1 line-clamp-1">
                    {day.themeTitle}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Day Detail Card */}
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-6 sm:p-10 border-slate-200 shadow-xl relative overflow-hidden bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-100 gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 mb-1">
                <span>OCTOBER {21 + activeDay.day}, 2026</span>
                <span>&bull;</span>
                <span>DAY 0{activeDay.day} ROADMAP</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {activeDay.themeTitle}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {activeDay.themeSubtitle}
              </p>
            </div>

            {activeDay.handsOnHighlight && (
              <div className="self-start md:self-auto px-4 py-2 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>{activeDay.handsOnHighlight}</span>
              </div>
            )}
          </div>

          {/* Topics Curriculum List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {activeDay.topics.map((topic, tIdx) => (
              <div
                key={tIdx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-800 font-medium">
                  {topic}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Feature: Guess the AI Term (Day 1 Highlight) */}
          {activeDay.day === 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                    <Gamepad2 className="w-5 h-5 text-indigo-600" />
                    <span>Day 1 Interactive Teaser: Guess the AI Term</span>
                  </div>
                  <button
                    onClick={() => setGameActive(!gameActive)}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
                  >
                    {gameActive ? 'Hide Mini-Game' : 'Try Mini-Game'}
                  </button>
                </div>

                {gameActive && (
                  <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                    <p className="text-xs sm:text-sm text-slate-700 bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm italic">
                      &ldquo;{aiTrivia.clue}&rdquo;
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {aiTrivia.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setSelectedGuess(opt)}
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                            selectedGuess === opt
                              ? opt === aiTrivia.correct
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                                : 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {selectedGuess && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                          selectedGuess === aiTrivia.correct
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-sm'
                            : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-sm'
                        }`}
                      >
                        {selectedGuess === aiTrivia.correct ? (
                          <>
                            <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>{aiTrivia.explanation}</span>
                          </>
                        ) : (
                          <>
                            <HelpCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                            <span>Not quite! The correct term is AI Agent. We will build agents together on Day 1!</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
