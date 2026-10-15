import React, { useState, useEffect, useCallback } from 'react';
import { ecoEvents } from '../data/ecoEvents';
import { EcoEvent } from '../types';
import { 
  Sparkles, 
  Maximize2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  Tag, 
  Layers 
} from 'lucide-react';

export const JourneySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    eventIndex: number;
    imageIndex: number;
  }>({
    isOpen: false,
    eventIndex: 0,
    imageIndex: 0,
  });

  const categories = ['All', 'Faculty & Student Innovation', 'Faculty Excellence', 'Student Life & Celebrations'];

  const filteredEvents = selectedCategory === 'All'
    ? ecoEvents
    : ecoEvents.filter((ev) => ev.category === selectedCategory);

  const openLightbox = (eventIdx: number, imgIdx: number = 0) => {
    setLightboxState({
      isOpen: true,
      eventIndex: eventIdx,
      imageIndex: imgIdx,
    });
  };

  const closeLightbox = () => {
    setLightboxState((prev) => ({ ...prev, isOpen: false }));
  };

  const currentEvent = filteredEvents[lightboxState.eventIndex] || ecoEvents[0];
  const currentImage = currentEvent?.images[lightboxState.imageIndex];

  const handleNext = useCallback(() => {
    if (!currentEvent) return;
    if (lightboxState.imageIndex < currentEvent.images.length - 1) {
      setLightboxState((prev) => ({ ...prev, imageIndex: prev.imageIndex + 1 }));
    } else {
      // Next event
      const nextEventIdx = (lightboxState.eventIndex + 1) % filteredEvents.length;
      setLightboxState({
        isOpen: true,
        eventIndex: nextEventIdx,
        imageIndex: 0,
      });
    }
  }, [currentEvent, lightboxState.eventIndex, lightboxState.imageIndex, filteredEvents.length]);

  const handlePrev = useCallback(() => {
    if (!currentEvent) return;
    if (lightboxState.imageIndex > 0) {
      setLightboxState((prev) => ({ ...prev, imageIndex: prev.imageIndex - 1 }));
    } else {
      // Prev event
      const prevEventIdx = (lightboxState.eventIndex - 1 + filteredEvents.length) % filteredEvents.length;
      const prevEvent = filteredEvents[prevEventIdx];
      setLightboxState({
        isOpen: true,
        eventIndex: prevEventIdx,
        imageIndex: prevEvent.images.length - 1,
      });
    }
  }, [currentEvent, lightboxState.eventIndex, lightboxState.imageIndex, filteredEvents]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxState.isOpen, handleNext, handlePrev]);

  return (
    <section id="journey" className="py-24 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-bold text-cyan-700 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>ECO ASSOCIATION ARCHIVE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            OUR JOURNEY OF <span className="neon-text-gradient">INNOVATION</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium">
            Celebrating Technical Learning, Faculty Excellence, and Student Life.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md scale-105'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-sm'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event, eventIdx) => {
            const isDualImage = event.images.length > 1;

            return (
              <div
                key={event.id}
                className="glass-card glass-card-interactive rounded-2xl overflow-hidden border border-slate-200 flex flex-col group shadow-md hover:shadow-xl"
              >
                {/* Images Display Container */}
                <div className="relative bg-slate-100 overflow-hidden">
                  {isDualImage ? (
                    /* Dual Image Layout for Event 1 (Expert Talk) */
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100">
                      {event.images.map((imgSrc, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => openLightbox(eventIdx, imgIdx)}
                          className="relative h-60 overflow-hidden rounded-lg cursor-pointer group/img"
                        >
                          <img
                            src={imgSrc}
                            alt={`${event.title} - View ${imgIdx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-108"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-center p-2">
                            <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded flex items-center gap-1 shadow backdrop-blur-sm">
                              <Maximize2 className="w-3 h-3" /> Expand
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Single Image Layout for Event 2 and Event 3 */
                    <div
                      onClick={() => openLightbox(eventIdx, 0)}
                      className="relative h-64 sm:h-72 overflow-hidden cursor-pointer group/single"
                    >
                      <img
                        src={event.images[0]}
                        alt={event.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/single:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover/single:opacity-100 transition-opacity flex items-end justify-end p-4">
                        <span className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/20 backdrop-blur-sm">
                          <Maximize2 className="w-3.5 h-3.5" /> View Photo
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Category Label Pill */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-md border border-cyan-300 text-cyan-800 shadow-sm">
                      {event.category}
                    </span>
                  </div>

                  {/* Multi-Photo Indicator Badge */}
                  {isDualImage && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/95 backdrop-blur-md border border-indigo-200 text-indigo-700 flex items-center gap-1 shadow-sm">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        2 Photos
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {event.dateBadge && (
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        {event.dateBadge}
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-cyan-600 transition-colors mb-3 leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal mb-6">
                      {event.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {event.tags && (
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {event.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard-Accessible Lightbox Modal */}
      {lightboxState.isOpen && currentEvent && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={currentEvent.title}
        >
          {/* Top Bar Controls */}
          <div 
            className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 max-w-lg">
              <p className="text-sm font-bold text-white truncate">{currentEvent.title}</p>
              <p className="text-xs text-cyan-400">
                Photo {lightboxState.imageIndex + 1} of {currentEvent.images.length} &bull; {currentEvent.category}
              </p>
            </div>

            <button
              onClick={closeLightbox}
              className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 hover:bg-cyan-600 text-white border border-slate-700 transition-all hover:scale-110 shadow-lg"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Main Lightbox Image Viewport */}
          <div
            className="max-w-5xl max-h-[80vh] flex flex-col items-center justify-center relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={currentEvent.title}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            <p className="text-xs sm:text-sm text-slate-300 text-center mt-4 max-w-2xl bg-slate-900/90 px-4 py-2 rounded-lg border border-slate-800">
              {currentEvent.description}
            </p>
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-slate-900/90 hover:bg-cyan-600 text-white border border-slate-700 transition-all hover:scale-110 shadow-lg"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Bottom Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 hidden sm:block">
            Use Left / Right arrow keys to navigate &bull; Press ESC to close
          </div>
        </div>
      )}
    </section>
  );
};
