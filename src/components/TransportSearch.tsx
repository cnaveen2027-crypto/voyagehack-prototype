import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import { TransportOption } from '../types/travel';
import {
  Plane,
  Train,
  Bus,
  Car,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Luggage,
  Leaf,
  ShieldCheck,
  Loader2,
  Ticket
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransportSearchProps {
  onBookingSuccess?: () => void;
}

export const TransportSearch: React.FC<TransportSearchProps> = ({ onBookingSuccess }) => {
  const { activeTrip, setSelectedTransport, confirmBooking } = useTrip();
  const { currentUser } = useAuth();

  const [origin, setOrigin] = useState(activeTrip.origin || '');
  const [destination, setDestination] = useState(activeTrip.destination || '');
  const [departureDate, setDepartureDate] = useState(activeTrip.departureDate || '');
  const [returnDate, setReturnDate] = useState(activeTrip.returnDate || '');
  const [adults, setAdults] = useState(activeTrip.adults || 2);
  const [category, setCategory] = useState<'All' | 'Flight' | 'Train' | 'Bus' | 'Car'>('All');

  const [options, setOptions] = useState<TransportOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'convenience'>('convenience');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  const fetchTransport = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setIsLoading(true);
    setBookingSuccessMsg(null);

    try {
      const results = await TravelAPI.searchTransport({
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        category,
        currency: activeTrip.currency,
      });
      setOptions(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, [category]);

  const sortedOptions = [...options].sort((a, b) => {
    if (sortBy === 'price') return a.totalPrice - b.totalPrice;
    if (sortBy === 'duration') return a.duration.localeCompare(b.duration);
    return a.stops - b.stops;
  });

  const handleSelectAndBook = (opt: TransportOption) => {
    setSelectedTransport(opt);
    const booking = confirmBooking('Transportation', opt, [currentUser.name]);
    confetti({ particleCount: 75, spread: 60, origin: { y: 0.7 } });
    setBookingSuccessMsg(`Simulated Booking Confirmed! Ref: ${booking.referenceNumber}`);

    if (onBookingSuccess) {
      setTimeout(() => onBookingSuccess(), 1200);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Plane className="w-3.5 h-3.5" />
          <span>Transportation Comparison Agent</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Compare Flights, Trains & Transit
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic route options calculated for your exact origin and destination. Clearly labeled simulated supplier benchmarks.
        </p>
      </div>

      {bookingSuccessMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold">{bookingSuccessMsg}</span>
          </div>
          <span className="text-xs bg-emerald-900/60 px-3 py-1 rounded-lg">View in Bookings Tab</span>
        </div>
      )}

      {/* Search Bar & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Origin</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Origin city"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination city"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Departure</label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Passengers</label>
            <input
              type="number"
              min={1}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchTransport}
              disabled={isLoading || !origin || !destination}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Search Options</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 mr-2">Category:</span>
            {(['All', 'Flight', 'Train', 'Bus', 'Car'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  category === cat
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'Flight' && <Plane className="w-3.5 h-3.5" />}
                {cat === 'Train' && <Train className="w-3.5 h-3.5" />}
                {cat === 'Bus' && <Bus className="w-3.5 h-3.5" />}
                {cat === 'Car' && <Car className="w-3.5 h-3.5" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="convenience">Most Convenient (Fewest Stops)</option>
              <option value="price">Lowest Total Price</option>
              <option value="duration">Fastest Duration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Transportation Agent calculating schedules and dynamic transit fares...</p>
        </div>
      ) : sortedOptions.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <Plane className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No transit routes found</h3>
          <p className="text-xs text-slate-400 mt-1">Please check your origin and destination cities.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedOptions.map((opt) => {
            const isSelected = activeTrip.selectedTransport?.id === opt.id;

            return (
              <div
                key={opt.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                  isSelected ? 'border-blue-500 ring-1 ring-blue-500/40' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Mode & Operator */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-blue-400">
                    {opt.mode === 'Flight' && <Plane className="w-6 h-6" />}
                    {opt.mode === 'Train' && <Train className="w-6 h-6" />}
                    {opt.mode === 'Bus' && <Bus className="w-6 h-6" />}
                    {opt.mode === 'Car' && <Car className="w-6 h-6" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{opt.providerName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {opt.operatorCode}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-600/30">
                        Simulated Benchmark
                      </span>
                    </div>

                    {/* Schedule times & duration */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div>
                        <span className="text-white font-bold">{opt.departureTime}</span>
                        <span className="text-slate-400 block text-[11px]">{opt.departureLocation}</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>{opt.duration}</span>
                        </span>
                        <div className="w-20 h-0.5 bg-slate-700 my-1 relative">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute left-1/2 -top-0.5 -translate-x-1/2" />
                        </div>
                        <span className="text-[10px] text-slate-500">{opt.stopDetails}</span>
                      </div>

                      <div>
                        <span className="text-white font-bold">{opt.arrivalTime}</span>
                        <span className="text-slate-400 block text-[11px]">{opt.arrivalLocation}</span>
                      </div>
                    </div>

                    {/* Meta tags */}
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Luggage className="w-3.5 h-3.5 text-slate-500" />
                        <span>{opt.baggageAllowance}</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>{opt.ecoRating}</span>
                      </span>
                      <span className="text-slate-500">Class: {opt.cabinClass}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Booking CTA */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <div className="text-2xl font-black text-white">
                      {opt.currency} {opt.totalPrice.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      {opt.currency} {opt.pricePerPerson}/person • {adults} traveler(s)
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectAndBook(opt)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Re-confirm Booking' : 'Select & Simulate Book'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
