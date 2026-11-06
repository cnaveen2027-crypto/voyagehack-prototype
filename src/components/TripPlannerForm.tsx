import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { TravelAPI } from '../services/api';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Wallet,
  Plane,
  Building,
  Heart,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface TripPlannerFormProps {
  onSuccessNavigate?: (tab: string) => void;
}

export const TripPlannerForm: React.FC<TripPlannerFormProps> = ({ onSuccessNavigate }) => {
  const { activeTrip, updateActiveTrip, setItinerary, setBudgetPlan, saveCurrentTrip } = useTrip();
  const { currentUser } = useAuth();

  // Natural Language Input State
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessingNatural, setIsProcessingNatural] = useState(false);
  const [aiClarification, setAiClarification] = useState<{
    summary?: string;
    missingFields?: string[];
    clarifyingQuestions?: string[];
    suggestedDestinations?: string[];
  } | null>(null);

  // Full Form States
  const [origin, setOrigin] = useState(activeTrip.origin || currentUser.homeCity || '');
  const [destination, setDestination] = useState(activeTrip.destination || '');
  const [departureDate, setDepartureDate] = useState(activeTrip.departureDate || '');
  const [returnDate, setReturnDate] = useState(activeTrip.returnDate || '');
  const [adults, setAdults] = useState(activeTrip.adults || 2);
  const [children, setChildren] = useState(activeTrip.children || 0);
  const [budget, setBudget] = useState(activeTrip.budget || 2000);
  const [currency, setCurrency] = useState(activeTrip.currency || currentUser.currency || 'USD');
  const [transportPreference, setTransportPreference] = useState(activeTrip.transportPreference || 'Flight');
  const [stayPreference, setStayPreference] = useState(activeTrip.stayPreference || 'Boutique Stay');
  const [dietaryRequirements, setDietaryRequirements] = useState(activeTrip.dietaryRequirements || currentUser.dietaryRequirements || '');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState(activeTrip.accessibilityRequirements || currentUser.accessibilityNeeds || '');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    activeTrip.interests && activeTrip.interests.length > 0
      ? activeTrip.interests
      : currentUser.travelInterests || ['Sightseeing', 'Food & Dining']
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const interestOptions = [
    'Nature & Wildlife',
    'Historical Landmarks',
    'Art & Museums',
    'Beaches & Coastal',
    'Mountain Treks',
    'Local Street Food',
    'Fine Gastronomy',
    'Adventure & Sports',
    'Wellness & Spas',
    'Nightlife & Lounges',
    'Shopping & Bazaars',
    'Photography Vistas',
    'Family Friendly',
    'Off the Beaten Path'
  ];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  // 1. Process Natural Language Description with Travel Intent Agent
  const handleProcessNaturalLanguage = async () => {
    if (!naturalInput.trim()) return;
    setIsProcessingNatural(true);
    setErrorMessage(null);
    setAiClarification(null);

    try {
      const result = await TravelAPI.processIntent(naturalInput, {
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        children,
        budget,
        currency,
        transportPreference,
        stayPreference,
        interests: selectedInterests,
      });

      if (result.extracted) {
        if (result.extracted.origin) setOrigin(result.extracted.origin);
        if (result.extracted.destination) setDestination(result.extracted.destination);
        if (result.extracted.departureDate) setDepartureDate(result.extracted.departureDate);
        if (result.extracted.returnDate) setReturnDate(result.extracted.returnDate);
        if (result.extracted.adults) setAdults(result.extracted.adults);
        if (result.extracted.children !== undefined) setChildren(result.extracted.children);
        if (result.extracted.budget) setBudget(result.extracted.budget);
        if (result.extracted.currency) setCurrency(result.extracted.currency);
        if (result.extracted.transportPreference) setTransportPreference(result.extracted.transportPreference);
        if (result.extracted.stayPreference) setStayPreference(result.extracted.stayPreference);
        if (result.extracted.interests && result.extracted.interests.length > 0) {
          setSelectedInterests(result.extracted.interests);
        }
        if (result.extracted.dietaryRequirements) setDietaryRequirements(result.extracted.dietaryRequirements);
        if (result.extracted.accessibilityRequirements) setAccessibilityRequirements(result.extracted.accessibilityRequirements);
      }

      setAiClarification({
        summary: result.summary,
        missingFields: result.missingFields,
        clarifyingQuestions: result.clarifyingQuestions,
        suggestedDestinations: result.suggestedDestinations,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Could not parse request. You can also fill the fields directly below.');
    } finally {
      setIsProcessingNatural(false);
    }
  };

  // 2. Generate Complete AI Plan across all agents
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setErrorMessage('Please enter a destination (or select one of the suggested destinations).');
      return;
    }
    if (!origin.trim()) {
      setErrorMessage('Please enter your starting location / city.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Calculate duration
      let durationDays = 4;
      if (departureDate && returnDate) {
        const d1 = new Date(departureDate);
        const d2 = new Date(returnDate);
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 0) durationDays = Math.min(14, diff);
      }

      setGenerationStep('Travel Intent Agent: Aligning trip parameters...');
      updateActiveTrip({
        origin,
        destination,
        departureDate: departureDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        returnDate: returnDate || new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0],
        durationDays,
        adults,
        children,
        budget,
        currency,
        transportPreference,
        stayPreference,
        interests: selectedInterests,
        dietaryRequirements,
        accessibilityRequirements,
        title: `Voyage to ${destination}`,
      });

      // 1. Generate Itinerary
      setGenerationStep('Itinerary Planning Agent: Creating day-by-day curated schedule...');
      const itinerary = await TravelAPI.generateItinerary({
        origin,
        destination,
        durationDays,
        adults,
        children,
        budget,
        currency,
        transportPreference,
        stayPreference,
        interests: selectedInterests,
        dietaryRequirements,
        accessibilityRequirements,
      });
      setItinerary(itinerary);

      // 2. Calculate Budget
      setGenerationStep('Budget Optimization Agent: Allocating categories & finding savings...');
      const budgetPlan = await TravelAPI.calculateBudget({
        destination,
        durationDays,
        totalBudget: budget,
        travelers: adults + children,
        currency,
        transportMode: transportPreference,
        stayType: stayPreference,
      });
      setBudgetPlan(budgetPlan);

      saveCurrentTrip();

      // Navigate to Itinerary View
      if (onSuccessNavigate) {
        onSuccessNavigate('itinerary');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal AI Travel Orchestrator</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Design Your Personal Voyage
        </h1>
        <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl mx-auto">
          Enter any origin, any destination worldwide, and any budget. Our multi-agent AI synthesizes personalized
          transport, boutique stays, day-by-day schedules, and smart budgets.
        </p>
      </div>

      {/* Natural Language Travel Prompt Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Or describe your trip in natural language:</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            rows={2}
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            placeholder='e.g. "I want to travel from my hometown to a peaceful coastal city or mountain retreat for 5 days with my family. Budget is $2500 USD. We love local gastronomy and sightseeing."'
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleProcessNaturalLanguage}
            disabled={isProcessingNatural || !naturalInput.trim()}
            className="sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
          >
            {isProcessingNatural ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI Auto-Fill</span>
              </>
            )}
          </button>
        </div>

        {/* AI Intent Feedback & Clarification Questions */}
        {aiClarification && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300">
            <div className="font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Intent Extracted</span>
            </div>
            <p className="text-slate-300 mb-2">{aiClarification.summary}</p>

            {aiClarification.suggestedDestinations && aiClarification.suggestedDestinations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-slate-400">Suggested destinations:</span>
                {aiClarification.suggestedDestinations.map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setDestination(dest)}
                    className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-500/40 text-blue-200 rounded-lg cursor-pointer transition-colors"
                  >
                    + {dest}
                  </button>
                ))}
              </div>
            )}

            {aiClarification.clarifyingQuestions && aiClarification.clarifyingQuestions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-800">
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Clarifying follow-ups for you:</span>
                </span>
                <ul className="list-disc list-inside mt-1 text-slate-400 space-y-0.5">
                  {aiClarification.clarifyingQuestions.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Dynamic Parameters Form */}
      <form onSubmit={handleGeneratePlan} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span>Travel Details & Parameters</span>
        </h2>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Origin */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Starting Location / Airport</span>
            </label>
            <input
              type="text"
              required
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. San Francisco, CA or London Heathrow"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Any city or village worldwide (free text)</span>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Destination</span>
            </label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Any city, region, or island worldwide"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">Any destination on Earth (no restricted dropdowns)</span>
          </div>
        </div>

        {/* Dates and Travelers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Departure Date</span>
            </label>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Return Date</span>
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Adults</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Children</span>
            </label>
            <input
              type="number"
              min={0}
              max={15}
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Budget and Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Budget</span>
            </label>
            <input
              type="number"
              min={100}
              step={50}
              value={budget}
              onChange={(e) => setBudget(parseFloat(e.target.value) || 1000)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-blue-400" />
              <span>Transport Preference</span>
            </label>
            <select
              value={transportPreference}
              onChange={(e) => setTransportPreference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Flight">Flight (Fastest)</option>
              <option value="Train">Scenic Rail / Train</option>
              <option value="Bus">Coach / Express Bus</option>
              <option value="Car">Car Rental / Roadtrip</option>
              <option value="Any">Any Mode (Compare All)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              <span>Stay Preference</span>
            </label>
            <select
              value={stayPreference}
              onChange={(e) => setStayPreference(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Boutique Stay">Boutique Residence</option>
              <option value="Luxury Hotel">Luxury 5-Star Hotel</option>
              <option value="Resort">Nature / Spa Resort</option>
              <option value="Guesthouse">Cozy Guesthouse</option>
              <option value="Apartment">Self-catering Apartment</option>
            </select>
          </div>
        </div>

        {/* Interests & Style */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Travel Interests & Focus</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    selected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary & Accessibility Requirements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Dietary Requirements / Allergies
            </label>
            <input
              type="text"
              value={dietaryRequirements}
              onChange={(e) => setDietaryRequirements(e.target.value)}
              placeholder="e.g. Vegetarian, Halal, Gluten-Free, Nut Allergy"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Accessibility Requirements
            </label>
            <input
              type="text"
              value={accessibilityRequirements}
              onChange={(e) => setAccessibilityRequirements(e.target.value)}
              placeholder="e.g. Step-free access, wheelchair accessible, ground floor"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {isGenerating ? (
              <span className="text-blue-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{generationStep || 'Generating custom voyage with Gemini AI...'}</span>
              </span>
            ) : (
              <span>Dynamic AI generation will tailor daily schedules and budget optimization.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Orchestrating Trip...</span>
              </>
            ) : (
              <>
                <span>Generate Smart Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
