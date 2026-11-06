import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TripProvider, useTrip } from './context/TripContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HeroLanding } from './components/HeroLanding';
import { TripPlannerForm } from './components/TripPlannerForm';
import { AIAgentChat } from './components/AIAgentChat';
import { DestinationDiscovery } from './components/DestinationDiscovery';
import { TransportSearch } from './components/TransportSearch';
import { AccommodationSearch } from './components/AccommodationSearch';
import { ItineraryView } from './components/ItineraryView';
import { BudgetDashboard } from './components/BudgetDashboard';
import { BookingManager } from './components/BookingManager';
import { GoogleMapView } from './components/GoogleMapView';
import { ThreeDExplorer } from './components/ThreeDExplorer';
import { JourneyRecoveryModal } from './components/JourneyRecoveryModal';
import { UserProfileModal } from './components/UserProfileModal';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Google Maps Quota Exceeded listener as required by GMP skill
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuota);
    };
  }, []);

  const { createNewTrip } = useTrip();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Mandated Google Maps Demo Quota Notice Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Application Bar */}
      <Navbar
        onOpenRecovery={() => setIsRecoveryOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onNewTrip={() => {
          createNewTrip();
          setActiveTab('planner');
        }}
      />

      {/* Main Framework Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'recovery') {
              setIsRecoveryOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950 relative">
          {activeTab === 'landing' && (
            <HeroLanding
              onStartPlanning={() => setActiveTab('planner')}
              onExploreDestinations={() => setActiveTab('destinations')}
              onOpenGlobe={() => setActiveTab('globe')}
              onOpenChat={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'planner' && (
            <TripPlannerForm
              onSuccessNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'chat' && (
            <AIAgentChat
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'map' && <GoogleMapView />}

          {activeTab === 'globe' && <ThreeDExplorer />}

          {activeTab === 'destinations' && (
            <DestinationDiscovery
              onSelectDestination={() => setActiveTab('planner')}
            />
          )}

          {activeTab === 'transport' && (
            <TransportSearch
              onBookingSuccess={() => setActiveTab('bookings')}
            />
          )}

          {activeTab === 'stays' && (
            <AccommodationSearch
              onBookingSuccess={() => setActiveTab('bookings')}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryView
              onPlanNewTrip={() => setActiveTab('planner')}
              onOpenMap={() => setActiveTab('map')}
            />
          )}

          {activeTab === 'budget' && <BudgetDashboard />}

          {activeTab === 'bookings' && <BookingManager />}
        </main>
      </div>

      {/* Modals */}
      <JourneyRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onRecoveryApplied={() => setActiveTab('itinerary')}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <AppContent />
      </TripProvider>
    </AuthProvider>
  );
}
