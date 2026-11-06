import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import { DestinationItem } from '../types/travel';
import {
  Compass,
  Search,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  Check,
  ArrowRight,
  Loader2,
  SlidersHorizontal,
  CloudSun
} from 'lucide-react';

interface DestinationDiscoveryProps {
  onSelectDestination?: (dest: DestinationItem) => void;
}

export const DestinationDiscovery: React.FC<DestinationDiscoveryProps> = ({ onSelectDestination }) => {
  const { activeTrip, updateActiveTrip } = useTrip();
  const { currentUser } = useAuth();

  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [selectedClimate, setSelectedClimate] = useState('All');
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedBudgetLevel, setSelectedBudgetLevel] = useState('All');

  const climates = ['All', 'Alpine Cool', 'Mediterranean Coastal', 'Temperate / Four Seasons', 'Subpolar Oceanic', 'Subtropical Highland', 'Tropical Warm'];
  const regions = ['All', 'Europe', 'Asia', 'Nordic', 'Africa', 'South America', 'North America'];
  const styles = ['All', 'Adventure', 'Beaches', 'Mountains', 'Historical', 'Nature', 'Food & Dining', 'Family Travel', 'Solo Travel', 'Honeymoon'];
  const budgets = ['All', 'Budget Friendly (< $120/day)', 'Moderate ($120 - $200/day)', 'Luxury (> $200/day)'];

  const fetchDestinations = async () => {
    setIsLoading(true);
    try {
      const items = await TravelAPI.getDestinations({
        climate: selectedClimate !== 'All' ? selectedClimate : undefined,
        region: selectedRegion !== 'All' ? selectedRegion : undefined,
        travelStyle: selectedStyle !== 'All' ? selectedStyle : undefined,
        budgetLevel: selectedBudgetLevel !== 'All' ? selectedBudgetLevel : undefined,
        currency: currentUser.currency,
        origin: activeTrip.origin,
      });
      setDestinations(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [selectedClimate, selectedRegion, selectedStyle, selectedBudgetLevel]);

  const handleSelect = (dest: DestinationItem) => {
    updateActiveTrip({
      destination: `${dest.name}, ${dest.country}`,
      title: `Voyage to ${dest.name}`,
    });
    if (onSelectDestination) {
      onSelectDestination(dest);
    }
  };

  const filteredDestinations = destinations.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>Global Destination Discovery</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            Explore Worldwide Destinations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Dynamic recommendations synthesized by our Destination Recommendation Agent based on climate, style, and travel budgets.
          </p>
        </div>

        <button
          onClick={fetchDestinations}
          disabled={isLoading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer self-start"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Ask AI to Recommend New</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, country, or landscape features..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  Region: {r}
                </option>
              ))}
            </select>

            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {styles.map((s) => (
                <option key={s} value={s}>
                  Style: {s}
                </option>
              ))}
            </select>

            <select
              value={selectedClimate}
              onChange={(e) => setSelectedClimate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer col-span-2 sm:col-span-1"
            >
              {climates.map((c) => (
                <option key={c} value={c}>
                  Climate: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Destination Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Synthesizing personalized destinations matching your preferences...</p>
        </div>
      ) : filteredDestinations.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No destinations found</h3>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search filters or click "Ask AI to Recommend New".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => {
            const isCurrentlySelected = activeTrip.destination.includes(dest.name);

            return (
              <div
                key={dest.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all duration-200 hover:border-blue-500/60 ${
                  isCurrentlySelected ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Bar with Match Score & Climate */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[11px] font-bold text-emerald-400">
                      {dest.matchScore}% AI Match
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                      <span>{dest.climate}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{dest.name}</h3>
                  <div className="text-xs font-semibold text-blue-400 mb-2">
                    {dest.country} • {dest.region}
                  </div>
                  <p className="text-xs italic text-slate-400 mb-3">{dest.tagline}</p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {dest.description}
                  </p>

                  {/* Highlights */}
                  <div className="space-y-1 mb-4">
                    <div className="text-[11px] uppercase font-bold text-slate-400">Key Highlights</div>
                    {dest.highlights.slice(0, 3).map((h, i) => (
                      <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* Travel Stats */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 mb-5 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Best Season</span>
                      <span className="text-slate-200 font-semibold">{dest.bestSeason}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Est. Daily Cost</span>
                      <span className="text-blue-400 font-semibold">
                        {currentUser.currency} {dest.estimatedDailyCost}/day
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Trip Here Action */}
                <button
                  type="button"
                  onClick={() => handleSelect(dest)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isCurrentlySelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isCurrentlySelected ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selected for Active Trip</span>
                    </>
                  ) : (
                    <>
                      <span>Plan Trip Here</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
