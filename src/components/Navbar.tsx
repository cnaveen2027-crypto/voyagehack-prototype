import React from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ShieldAlert,
  User,
  Plus,
  Sparkles,
  MapPin,
  Calendar,
  Wallet
} from 'lucide-react';

interface NavbarProps {
  onOpenRecovery: () => void;
  onOpenProfile: () => void;
  onNewTrip: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRecovery, onOpenProfile, onNewTrip }) => {
  const { activeTrip } = useTrip();
  const { currentUser } = useAuth();

  return (
    <header className="w-full h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Compass className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base md:text-lg text-white tracking-tight">VoyageMind AI</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
              MULTI-AGENT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
            Explore Anywhere. Plan Everything. Travel Smarter.
          </p>
        </div>
      </div>

      {/* Active Trip Context Chip */}
      <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-white">{activeTrip.destination || 'Unset Destination'}</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{activeTrip.durationDays} Days</span>
        </div>
        <span className="text-slate-600">•</span>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <span>{activeTrip.currency} {activeTrip.budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Adaptive Recovery Engine CTA */}
        <button
          onClick={onOpenRecovery}
          title="Adaptive Journey Recovery Engine"
          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Recovery Engine</span>
        </button>

        {/* New Trip */}
        <button
          onClick={onNewTrip}
          title="Start fresh voyage"
          className="p-2 sm:px-3 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">New Trip</span>
        </button>

        {/* Profile / Account Switcher */}
        <button
          onClick={onOpenProfile}
          title={`Active account: ${currentUser.name}`}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {currentUser.name.slice(0, 1)}
          </div>
          <span className="text-xs font-semibold hidden md:inline max-w-[100px] truncate">
            {currentUser.name.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
};
