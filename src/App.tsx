import React, { useState } from 'react';
import { ParticleBackground } from './components/ParticleBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PartnerLogos } from './components/PartnerLogos';
import { JourneySection } from './components/JourneySection';
import { AgendaSection } from './components/AgendaSection';
import { SpeakerSection } from './components/SpeakerSection';
import { RegistrationFlow } from './components/RegistrationFlow';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-cyan-200 selection:text-slate-950">
      {/* Ambient Canvas Particle Background */}
      <ParticleBackground />

      {/* Main Website Header */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminOpen={isAdminOpen}
      />

      {/* Main Page Content */}
      <main className="flex-1 relative z-10">
        <HeroSection />
        <PartnerLogos />
        <JourneySection />
        <AgendaSection />
        <SpeakerSection />
        <RegistrationFlow />
      </main>

      {/* Institutional Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Administrator Portal Overlay */}
      {isAdminOpen && (
        <AdminDashboard onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
};

export default App;
