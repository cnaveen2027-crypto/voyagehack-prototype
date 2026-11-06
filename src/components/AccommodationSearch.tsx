import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import { AccommodationOption } from '../types/travel';
import {
  Building,
  Star,
  MapPin,
  Check,
  Coffee,
  Wifi,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  Loader2,
  Calendar,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccommodationSearchProps {
  onBookingSuccess?: () => void;
}

export const AccommodationSearch: React.FC<AccommodationSearchProps> = ({ onBookingSuccess }) => {
  const { activeTrip, setSelectedAccommodation, confirmBooking } = useTrip();
  const { currentUser } = useAuth();

  const [destination, setDestination] = useState(activeTrip.destination || '');
  const [checkInDate, setCheckInDate] = useState(activeTrip.departureDate || '');
  const [checkOutDate, setCheckOutDate] = useState(activeTrip.returnDate || '');
  const [guests, setGuests] = useState(activeTrip.adults + activeTrip.children || 2);
  const [rooms, setRooms] = useState(1);
  const [budgetPerNight, setBudgetPerNight] = useState(160);
  const [stayType, setStayType] = useState(activeTrip.stayPreference || 'All');

  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  const stayTypes = ['All', 'Luxury Hotel', 'Resort', 'Boutique Stay', 'Guesthouse', 'Apartment'];

  const fetchAccommodations = async () => {
    if (!destination.trim()) return;
    setIsLoading(true);
    setBookingSuccessMsg(null);

    try {
      const results = await TravelAPI.searchAccommodations({
        destination,
        checkInDate,
        checkOutDate,
        guests,
        rooms,
        budgetPerNight,
        stayType: stayType !== 'All' ? stayType : undefined,
        currency: activeTrip.currency,
      });
      setAccommodations(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccommodations();
  }, [stayType]);

  const handleSelectAndBook = (stay: AccommodationOption) => {
    setSelectedAccommodation(stay);
    const booking = confirmBooking('Accommodation', stay, [currentUser.name]);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    setBookingSuccessMsg(`Simulated Stay Confirmed! Ref: ${booking.referenceNumber}`);

    if (onBookingSuccess) {
      setTimeout(() => onBookingSuccess(), 1200);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Building className="w-3.5 h-3.5" />
          <span>Accommodation Agent</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Find Lodgings & Stays in {activeTrip.destination || 'Destination'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic hotel, resort, and boutique stays tailored to your budget per night. Simulated benchmark rates.
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

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or area"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Check-in</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Check-out</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Guests & Rooms</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <input
                type="number"
                min={1}
                value={rooms}
                onChange={(e) => setRooms(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchAccommodations}
              disabled={isLoading || !destination}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Find Accommodations</span>
            </button>
          </div>
        </div>

        {/* Stay Type Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 mr-2">Property Type:</span>
          {stayTypes.map((type) => (
            <button
              key={type}
              onClick={() => setStayType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                stayType === type
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Accommodations List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Accommodation Agent querying neighborhood stays and seasonal rates...</p>
        </div>
      ) : accommodations.length === 0 ? (
        <div className="py-16 text-center bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <Building className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No properties found</h3>
          <p className="text-xs text-slate-400 mt-1">Please enter a valid destination city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accommodations.map((stay) => {
            const isSelected = activeTrip.selectedAccommodation?.id === stay.id;

            return (
              <div
                key={stay.id}
                className={`bg-slate-900 border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all ${
                  isSelected ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Badge & Stars */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                      {stay.stayType}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: stay.starRating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white">{stay.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{stay.neighborhood} • {stay.distanceToCenter}</span>
                  </div>

                  {/* Rating & Room */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 mb-4 text-xs">
                    <div className="px-2 py-1 rounded-lg bg-blue-600 text-white font-bold">
                      {stay.userReviewRating}
                    </div>
                    <div>
                      <span className="text-slate-300 font-semibold block">{stay.roomType}</span>
                      <span className="text-slate-500 text-[11px]">{stay.reviewCount} traveler reviews</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">Included Amenities</span>
                    <div className="flex flex-wrap gap-1.5">
                      {stay.amenities.map((a, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 text-[11px] border border-slate-700/60"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Policy */}
                  <div className="text-xs text-emerald-400 mb-5 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Free cancellation until {stay.freeCancellationUntil}</span>
                  </div>
                </div>

                {/* Footer Price & Booking CTA */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-white">
                      {stay.currency} {stay.pricePerNight}
                      <span className="text-xs text-slate-400 font-normal"> / night</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">
                      Total: {stay.currency} {stay.totalPrice.toLocaleString()} (Est. {activeTrip.durationDays} nights)
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectAndBook(stay)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                  >
                    {isSelected ? 'Re-confirm Stay' : 'Select & Book'}
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
