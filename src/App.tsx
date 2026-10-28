/**
 * Healthcare Leadership Community, powered by Saudi German Hospital Egypt
 * Main Application Entry Point & Executive Navigation Shell
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { RegistrationModal } from './components/RegistrationModal';
import { MemberLoginModal } from './components/MemberLoginModal';

// Views
import { HomeView } from './views/HomeView';
import { RoundsView } from './views/RoundsView';
import { RoundDetailView } from './views/RoundDetailView';
import { InsightsView } from './views/InsightsView';
import { DirectoryView } from './views/DirectoryView';
import { ProfileView } from './views/ProfileView';
import { RegistrationView } from './views/RegistrationView';
import { AdminPortalView } from './views/AdminPortalView';
import { ArchitectureView } from './views/ArchitectureView';

function AppContent() {
  const { isMemberLoginOpen, setIsMemberLoginOpen } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedRoundId, setSelectedRoundId] = useState<string>('round_2026_10_27');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Parse URL hash for stable unique routes (e.g. #/rounds/round_2026_10_27)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('rounds/')) {
        const id = hash.replace('rounds/', '');
        setSelectedRoundId(id);
        setCurrentView('round_detail');
      } else if (hash === 'rounds') {
        setCurrentView('rounds');
      } else if (hash === 'surfaces' || hash === 'insights') {
        setCurrentView('surfaces');
      } else if (hash === 'members') {
        setCurrentView('members');
      } else if (hash === 'admin') {
        setCurrentView('admin');
      } else if (hash === 'profile') {
        setCurrentView('profile');
      } else if (hash === 'architecture') {
        setCurrentView('architecture');
      } else if (hash === 'register' || hash === 'registration') {
        setCurrentView('register');
      } else {
        setCurrentView('home');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'round_detail' && param) {
      setSelectedRoundId(param);
      setCurrentView('round_detail');
      window.location.hash = `#/rounds/${param}`;
    } else {
      setCurrentView(view);
      window.location.hash = `#/${view}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#008765] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            onNavigate={navigateTo}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {currentView === 'rounds' && (
          <RoundsView
            onNavigate={navigateTo}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {currentView === 'round_detail' && (
          <RoundDetailView
            roundId={selectedRoundId}
            onNavigate={navigateTo}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {(currentView === 'surfaces' || currentView === 'insights') && (
          <InsightsView
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        )}

        {currentView === 'members' && (
          <DirectoryView
            onOpenRegister={() => setIsRegisterOpen(true)}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onOpenRegister={() => setIsRegisterOpen(true)}
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'register' && (
          <RegistrationView
            onNavigate={navigateTo}
          />
        )}

        {currentView === 'admin' && (
          <AdminPortalView />
        )}

        {currentView === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Member Login Modal */}
      <MemberLoginModal
        isOpen={isMemberLoginOpen}
        onClose={() => setIsMemberLoginOpen(false)}
        onSwitchToRegister={() => {
          setIsMemberLoginOpen(false);
          setIsRegisterOpen(true);
        }}
      />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          setIsRegisterOpen(false);
          navigateTo('profile');
        }}
      />

      {/* Global Footer */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
