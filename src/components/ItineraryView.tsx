import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import { downloadItineraryPdf } from '../utils/pdfGenerator';
import { ItineraryDay, ActivityItem } from '../types/travel';
import {
  Calendar,
  Sun,
  Sunset,
  Moon,
  MapPin,
  Utensils,
  Car,
  Clock,
  Sparkles,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ItineraryViewProps {
  onPlanNewTrip?: () => void;
  onOpenMap?: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ onPlanNewTrip, onOpenMap }) => {
  const { activeTrip, updateItineraryDay, removeActivity, addActivity, setItinerary } = useTrip();
  const { currentUser } = useAuth();

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isRegeneratingDay, setIsRegeneratingDay] = useState(false);
  const [newActivitySlot, setNewActivitySlot] = useState<'morning' | 'afternoon' | 'evening' | null>(null);
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDesc, setNewActivityDesc] = useState('');
  const [newActivityCost, setNewActivityCost] = useState(25);

  const itinerary = activeTrip.itinerary;

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Itinerary Planned</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Ready to design your journey? Enter your travel parameters or describe your trip in natural language.
        </p>
        <button
          onClick={onPlanNewTrip}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-lg"
        >
          Plan New Itinerary Now
        </button>
      </div>
    );
  }

  const currentDay: ItineraryDay = itinerary.days[activeDayIndex] || itinerary.days[0];

  const handleRegenerateDay = async (dayNumber: number) => {
    setIsRegeneratingDay(true);
    try {
      // Re-run itinerary agent with day focus
      const fresh = await TravelAPI.generateItinerary({
        ...activeTrip,
        durationDays: activeTrip.durationDays,
      });

      const matchedDay = fresh.days.find((d) => d.dayNumber === dayNumber);
      if (matchedDay) {
        updateItineraryDay(dayNumber, matchedDay);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegeneratingDay(false);
    }
  };

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivitySlot || !newActivityTitle.trim()) return;

    addActivity(currentDay.dayNumber, newActivitySlot, {
      title: newActivityTitle,
      description: newActivityDesc || 'Custom traveller activity',
      locationName: activeTrip.destination,
      estimatedCost: newActivityCost,
    });

    setNewActivitySlot(null);
    setNewActivityTitle('');
    setNewActivityDesc('');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Itinerary Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-500/40 text-blue-400 text-xs font-bold">
                {itinerary.durationDays} DAYS • {itinerary.currency} {activeTrip.budget.toLocaleString()} BUDGET
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                {activeTrip.adults} Adults{activeTrip.children ? `, ${activeTrip.children} Kids` : ''}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{itinerary.tripTitle}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-3xl">{itinerary.overview}</p>

            {itinerary.weatherForecast && (
              <p className="text-xs text-amber-300 mt-2 flex items-center gap-1.5 font-medium">
                <Sun className="w-3.5 h-3.5" />
                <span>Forecast: {itinerary.weatherForecast}</span>
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <button
              onClick={() => downloadItineraryPdf(itinerary, activeTrip, currentUser)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Itinerary</span>
            </button>

            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>View All Stops on Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Highlights Strip */}
        {itinerary.tripHighlights && itinerary.tripHighlights.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Curated Trip Highlights
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {itinerary.tripHighlights.map((hl, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
        {itinerary.days.map((day, idx) => {
          const isActive = activeDayIndex === idx;
          return (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDayIndex(idx)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                isActive
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>Day {day.dayNumber}</span>
              <span className="text-[10px] font-normal opacity-80">{day.theme.slice(0, 18)}...</span>
            </button>
          );
        })}
      </div>

      {/* Active Day Detail Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="text-xs font-bold uppercase text-blue-400 tracking-wider">
              DAY {currentDay.dayNumber} OF {itinerary.durationDays}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">{currentDay.theme}</h2>
            <div className="text-xs text-slate-400 flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDay.localTransportMode}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentDay.approxTravelTime}</span>
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">
                Est. Daily Spend: {itinerary.currency} {currentDay.totalEstimatedDayCost}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleRegenerateDay(currentDay.dayNumber)}
            disabled={isRegeneratingDay}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
          >
            {isRegeneratingDay ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Regenerate Day Plan</span>
          </button>
        </div>

        {/* 3 Day Slots: Morning, Afternoon, Evening */}
        <div className="space-y-6 mt-6">
          {/* Morning Slot */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Morning Slot</span>
                  <h3 className="text-base font-bold text-white">{currentDay.morning.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {itinerary.currency} {currentDay.morning.estimatedCost}
                </span>
                <button
                  onClick={() => removeActivity(currentDay.dayNumber, 'morning')}
                  title="Clear Morning Activity"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">{currentDay.morning.description}</p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDay.morning.locationName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentDay.morning.duration}</span>
              </span>
            </div>
          </div>

          {/* Afternoon Slot */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <Sunset className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Afternoon Slot</span>
                  <h3 className="text-base font-bold text-white">{currentDay.afternoon.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {itinerary.currency} {currentDay.afternoon.estimatedCost}
                </span>
                <button
                  onClick={() => removeActivity(currentDay.dayNumber, 'afternoon')}
                  title="Clear Afternoon Activity"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">{currentDay.afternoon.description}</p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-3">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDay.afternoon.locationName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentDay.afternoon.duration}</span>
              </span>
            </div>

            {/* Culinary Recommendation */}
            {currentDay.afternoon.culinaryRecommendation && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">
                      Recommended Dining: {currentDay.afternoon.culinaryRecommendation.dish}
                    </span>
                    <span className="text-slate-400 block text-[11px]">
                      {currentDay.afternoon.culinaryRecommendation.restaurant}
                    </span>
                  </div>
                </div>
                <span className="text-emerald-400 font-semibold shrink-0">
                  ~{itinerary.currency} {currentDay.afternoon.culinaryRecommendation.estimatedMealCost}
                </span>
              </div>
            )}
          </div>

          {/* Evening Slot */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Evening Slot</span>
                  <h3 className="text-base font-bold text-white">{currentDay.evening.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {itinerary.currency} {currentDay.evening.estimatedCost}
                </span>
                <button
                  onClick={() => removeActivity(currentDay.dayNumber, 'evening')}
                  title="Clear Evening Activity"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">{currentDay.evening.description}</p>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentDay.evening.locationName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentDay.evening.duration}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Optional Activity or Custom Add Activity */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {currentDay.optionalActivity && (
            <div className="text-xs text-slate-400">
              <span className="text-slate-300 font-bold">Optional Extra: </span>
              <span>
                {currentDay.optionalActivity.title} – {currentDay.optionalActivity.description}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setNewActivitySlot('morning')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Stop</span>
            </button>
          </div>
        </div>

        {/* Modal for adding custom stop */}
        {newActivitySlot && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-blue-500/50">
            <h4 className="text-xs font-bold uppercase text-blue-400 mb-2">
              Add Custom Stop to Day {currentDay.dayNumber}
            </h4>
            <form onSubmit={handleAddActivitySubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    placeholder="Activity title (e.g. Visit Vintage Vinyl Record Shop)"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={newActivitySlot}
                    onChange={(e: any) => setNewActivitySlot(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                value={newActivityDesc}
                onChange={(e) => setNewActivityDesc(e.target.value)}
                placeholder="Description / highlights..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewActivitySlot(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
