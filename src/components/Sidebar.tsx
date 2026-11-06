import React from 'react';
import {
  Sparkles,
  Bot,
  MapPin,
  Globe,
  Compass,
  Plane,
  Building,
  Calendar,
  Wallet,
  Ticket,
  ShieldAlert
} from 'lucide-react';
import { useTrip } from '../context/TripContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { activeTrip, userBookings } = useTrip();

  const navItems = [
    { id: 'planner', label: 'AI Trip Planner', icon: Sparkles, badge: null },
    { id: 'chat', label: 'VoyageMind Agent', icon: Bot, badge: 'AI Live' },
    { id: 'map', label: 'Interactive Map', icon: MapPin, badge: null },
    { id: 'globe', label: '3D Global Explorer', icon: Globe, badge: 'Three.js' },
    { id: 'destinations', label: 'Destination Discovery', icon: Compass, badge: null },
    { id: 'transport', label: 'Flights & Transit', icon: Plane, badge: null },
    { id: 'stays', label: 'Stays & Hotels', icon: Building, badge: null },
    { id: 'itinerary', label: 'Smart Itinerary', icon: Calendar, badge: activeTrip.itinerary ? `${activeTrip.itinerary.durationDays}d` : null },
    { id: 'budget', label: 'Budget Management', icon: Wallet, badge: null },
    { id: 'bookings', label: 'Bookings & Vouchers', icon: Ticket, badge: userBookings.length > 0 ? `${userBookings.length}` : null },
    { id: 'recovery', label: 'Journey Recovery', icon: ShieldAlert, badge: 'Resilience' },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 md:h-[calc(100vh-64px)] z-20">
      {/* Scrollable Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 mb-2">
          Platform Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-blue-800 text-white'
                      : 'bg-slate-800 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Trip Overview Pill */}
      <div className="p-3 border-t border-slate-800/80 hidden md:block">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Active Voyage Context</div>
          <div className="font-bold text-white mt-0.5 truncate">{activeTrip.destination}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>{activeTrip.durationDays} Days</span>
            <span className="text-emerald-400 font-semibold">{activeTrip.currency} {activeTrip.budget.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
