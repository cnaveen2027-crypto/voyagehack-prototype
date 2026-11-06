import React from 'react';
import {
  Compass,
  Sparkles,
  Plane,
  Building,
  Calendar,
  Wallet,
  ShieldCheck,
  Globe,
  ArrowRight,
  MapPin,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useTrip } from '../context/TripContext';

interface HeroLandingProps {
  onStartPlanning: () => void;
  onExploreDestinations: () => void;
  onOpenGlobe: () => void;
  onOpenChat: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onStartPlanning,
  onExploreDestinations,
  onOpenGlobe,
  onOpenChat,
}) => {
  const { activeTrip } = useTrip();

  const curatedDestinations = [
    {
      name: 'Rome & The Vatican',
      country: 'Italy',
      tag: 'Ancient Colosseum & Artisan Piazzas',
      cost: '$180/day',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Kyoto & Arashiyama',
      country: 'Japan',
      tag: 'Temples & Culinary Art',
      cost: '$160/day',
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Reykjavik & Geysers',
      country: 'Iceland',
      tag: 'Glaciers & Aurora',
      cost: '$210/day',
      image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Cape Town & Peninsula',
      country: 'South Africa',
      tag: 'Mountains Meet Oceans',
      cost: '$130/day',
      image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Multi-Agent Travel Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Explore Anywhere. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Plan Everything. Travel Smarter.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong className="text-white">VoyageMind AI</strong>. Enter any departure city, any destination on Earth, any travel dates, and any budget. Our autonomous multi-agent architecture coordinates custom transit, boutique accommodations, day-by-day itineraries, and adaptive journey recovery.
          </p>

          {/* Dual Main CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartPlanning}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Launch AI Trip Planner</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenChat}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-blue-400" />
              <span>Talk to Travel Agent</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-left">
            <div className="p-2">
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-xs text-slate-400 block font-medium">Dynamic AI Planning</span>
            </div>
            <div className="p-2">
              <span className="text-2xl font-black text-blue-400">Anywhere</span>
              <span className="text-xs text-slate-400 block font-medium">Global Locations</span>
            </div>
            <div className="p-2">
              <span className="text-2xl font-black text-emerald-400">8</span>
              <span className="text-xs text-slate-400 block font-medium">Specialized AI Agents</span>
            </div>
            <div className="p-2">
              <span className="text-2xl font-black text-amber-400">Real-Time</span>
              <span className="text-xs text-slate-400 block font-medium">Adaptive Recovery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destination Showcase */}
      <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Popular World Escapes</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sample inspiration—VoyageMind AI plans custom itineraries for ANY city or region worldwide.
            </p>
          </div>
          <button
            onClick={onExploreDestinations}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>Discover All Destinations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {curatedDestinations.map((item, idx) => (
            <div
              key={idx}
              onClick={onExploreDestinations}
              className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm text-white text-[11px] font-bold">
                  {item.cost}
                </span>
              </div>
              <div className="p-4">
                <span className="text-[11px] font-bold uppercase text-blue-400">{item.country}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{item.tag}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signature Multi-Agent Capabilities */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-white">The 8 Specialized Travel Agents</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Unlike static chatbots, VoyageMind coordinates dedicated micro-services sharing a unified trip context.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Travel Intent Agent</h3>
            <p className="text-xs text-slate-400 mt-1">
              Extracts dates, budgets, locations, and missing details from natural conversational descriptions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Itinerary Planning Agent</h3>
            <p className="text-xs text-slate-400 mt-1">
              Synthesizes morning, afternoon, and evening stops with geo-coordinates, dining tips, and transit times.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Budget Optimizer Agent</h3>
            <p className="text-xs text-slate-400 mt-1">
              Allocates 7 expenditure categories, recalculates burn rates, and suggests smart savings tradeoffs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Journey Recovery Engine</h3>
            <p className="text-xs text-slate-400 mt-1">
              Adaptive contingency re-routing for flight delays, cancellations, and sudden budget drops.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
