import React, { useState } from 'react';
import { useTrip } from '../context/TripContext';
import { TravelAPI } from '../services/api';
import { DisruptionRecovery } from '../types/travel';
import {
  ShieldAlert,
  AlertTriangle,
  Plane,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  ThumbsUp,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface JourneyRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onRecoveryApplied?: () => void;
}

export const JourneyRecoveryModal: React.FC<JourneyRecoveryProps> = ({ isOpen, onClose, onRecoveryApplied }) => {
  const { activeTrip, applyRecoveryPlan } = useTrip();

  const [disruptionType, setDisruptionType] = useState<
    'flight_cancellation' | 'hotel_cancellation' | 'transport_delay' | 'sudden_budget_reduction' | 'activity_cancellation' | 'date_change' | 'destination_change'
  >('flight_cancellation');

  const [customDetails, setCustomDetails] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState<DisruptionRecovery | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [successConfirmation, setSuccessConfirmation] = useState<string | null>(null);

  if (!isOpen) return null;

  const disruptionTypes = [
    { id: 'flight_cancellation', label: 'Flight / Transit Cancelled', icon: Plane, defaultText: `Inbound flight to ${activeTrip.destination} was suddenly cancelled by carrier due to airspace restrictions.` },
    { id: 'transport_delay', label: 'Severe Transit Delay (4+ hrs)', icon: Clock, defaultText: `Connecting high-speed train delayed by 4 hours; Day 1 dinner and check-in window threatened.` },
    { id: 'hotel_cancellation', label: 'Hotel Booking Cancelled', icon: Building, defaultText: `Reserved accommodation in ${activeTrip.destination} had a plumbing emergency and cancelled reservation.` },
    { id: 'sudden_budget_reduction', label: 'Sudden Budget Cut (-30%)', icon: DollarSign, defaultText: `Unexpected emergency expense reduced total trip budget by $600 USD; need immediate optimization.` },
    { id: 'activity_cancellation', label: 'Key Activity / Pass Closed', icon: AlertTriangle, defaultText: `Mountain summit gondola and observatory closed due to high winds during our visit.` },
    { id: 'date_change', label: 'Travel Dates Shifted', icon: Calendar, defaultText: `Work obligation requires shifting departure by 2 days later without losing booked sightseeing.` }
  ] as const;

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setRecoveryPlan(null);
    setSelectedOptionId(null);
    setSuccessConfirmation(null);

    const desc = customDetails.trim() || disruptionTypes.find((d) => d.id === disruptionType)?.defaultText || 'Unexpected schedule disruption';

    try {
      const plan = await TravelAPI.recoverJourney({
        currentTrip: activeTrip,
        disruptionType,
        disruptionDetails: desc,
      });

      setRecoveryPlan(plan);
      if (plan.recoveryOptions && plan.recoveryOptions.length > 0) {
        const rec = plan.recoveryOptions.find((o) => o.recommended) || plan.recoveryOptions[0];
        setSelectedOptionId(rec.optionId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyOption = (opt: any) => {
    applyRecoveryPlan(opt);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    setSuccessConfirmation(`Recovery applied successfully! ${opt.title} has updated your live itinerary and booking reservations.`);

    setTimeout(() => {
      if (onRecoveryApplied) onRecoveryApplied();
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Signature Resilience Engine
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Adaptive Journey Recovery
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Trip: <span className="text-white font-medium">{activeTrip.destination}</span> ({activeTrip.durationDays} days)
            </p>
          </div>
        </div>

        {successConfirmation && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successConfirmation}</span>
          </div>
        )}

        {/* Step 1: Disruption Selector */}
        {!recoveryPlan && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Unexpected Disruption:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
              {disruptionTypes.map((d) => {
                const Icon = d.icon;
                const isSelected = disruptionType === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDisruptionType(d.id as any);
                      setCustomDetails(d.defaultText);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex flex-col justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/50 border-rose-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Description */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Disruption Specifics / Notes:
              </label>
              <textarea
                rows={3}
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Describe what occurred (e.g. flight cancelled, road blocked, budget halved)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Journey Impact & Finding Alternatives...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Disruption & Generate Recovery Options</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 2: Display Recovery Solutions & Ask for Confirmation */}
        {recoveryPlan && (
          <div className="space-y-6">
            {/* Problem Assessment Badge */}
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Impact Assessment: {recoveryPlan.problemAssessment.severity}</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Goal: {recoveryPlan.problemAssessment.recoveryGoal}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {recoveryPlan.problemAssessment.immediateRisk}
              </p>
            </div>

            {/* Alternative Recovery Options */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Evaluated Recovery Solutions:
              </span>
              <div className="space-y-3">
                {recoveryPlan.recoveryOptions.map((opt) => {
                  const isSelected = selectedOptionId === opt.optionId;

                  return (
                    <div
                      key={opt.optionId}
                      onClick={() => setSelectedOptionId(opt.optionId)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-950 border-blue-500 ring-1 ring-blue-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-white">{opt.title}</h3>
                            {opt.recommended && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 border border-blue-500/40 text-blue-400">
                                RECOMMENDED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{opt.strategy}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-bold ${
                              opt.costDifference > 0
                                ? 'text-amber-400'
                                : opt.costDifference < 0
                                ? 'text-emerald-400'
                                : 'text-slate-300'
                            }`}
                          >
                            {opt.costDifference > 0 ? `+${opt.currency} ${opt.costDifference}` : opt.costDifference < 0 ? `-${opt.currency} ${Math.abs(opt.costDifference)}` : 'No Cost Delta'}
                          </span>
                          <span className="block text-[10px] text-slate-500">{opt.timeImpact}</span>
                        </div>
                      </div>

                      {/* Action Plan items */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Automated Action Plan:
                        </span>
                        <ul className="space-y-1">
                          {opt.actionPlan.map((action, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation & User Confirmation Prompt */}
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 text-xs text-slate-300">
              <span className="font-bold text-blue-400 block mb-1">Confirmation Required:</span>
              <p className="mb-2">{recoveryPlan.confirmationPrompt}</p>
              <p className="text-[11px] text-slate-400">{recoveryPlan.explanation}</p>
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRecoveryPlan(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Choose Different Disruption
              </button>

              <button
                type="button"
                onClick={() => {
                  const opt = recoveryPlan.recoveryOptions.find((o) => o.optionId === selectedOptionId);
                  if (opt) handleApplyOption(opt);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Confirm & Apply Recovery Solution</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
