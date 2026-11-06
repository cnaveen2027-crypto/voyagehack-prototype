import React, { useState, useEffect } from 'react';
import { useTrip } from '../context/TripContext';
import { TravelAPI } from '../services/api';
import { BudgetPlan } from '../types/travel';
import {
  Wallet,
  PiggyBank,
  TrendingDown,
  Sparkles,
  Plane,
  Building,
  Utensils,
  Ticket,
  Car,
  ShoppingBag,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const BudgetDashboard: React.FC = () => {
  const { activeTrip, updateActiveTrip, setBudgetPlan } = useTrip();

  const [budgetInput, setBudgetInput] = useState<number>(activeTrip.budget || 2000);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [budgetPlan, setLocalBudgetPlan] = useState<BudgetPlan | null>(activeTrip.budgetPlan || null);

  const fetchBudgetCalculation = async (newAmount?: number) => {
    setIsOptimizing(true);
    const amount = newAmount || budgetInput;

    try {
      const plan = await TravelAPI.calculateBudget({
        destination: activeTrip.destination,
        durationDays: activeTrip.durationDays,
        totalBudget: amount,
        travelers: activeTrip.adults + activeTrip.children,
        currency: activeTrip.currency,
        transportMode: activeTrip.transportPreference,
        stayType: activeTrip.stayPreference,
      });

      setLocalBudgetPlan(plan);
      setBudgetPlan(plan);
      updateActiveTrip({ budget: amount });
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    if (!budgetPlan) {
      fetchBudgetCalculation();
    }
  }, []);

  const getCategoryIcon = (name: string) => {
    if (name.includes('Transport')) return <Plane className="w-4 h-4 text-blue-400" />;
    if (name.includes('Accommod')) return <Building className="w-4 h-4 text-amber-400" />;
    if (name.includes('Food') || name.includes('Dining')) return <Utensils className="w-4 h-4 text-emerald-400" />;
    if (name.includes('Activit')) return <Ticket className="w-4 h-4 text-purple-400" />;
    if (name.includes('Local Transit')) return <Car className="w-4 h-4 text-cyan-400" />;
    if (name.includes('Shopping')) return <ShoppingBag className="w-4 h-4 text-pink-400" />;
    return <ShieldAlert className="w-4 h-4 text-rose-400" />;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <Wallet className="w-3.5 h-3.5" />
          <span>Smart Budget Management Agent</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Intelligent Budget Allocation & Optimizer
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Dynamic cost breakdown calculated across 7 core travel categories for {activeTrip.destination}. Modify your budget to recalculate allocations in real time.
        </p>
      </div>

      {/* Interactive Budget Modifier Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-xs uppercase font-bold text-slate-400 block mb-1">
              Total Trip Budget ({activeTrip.currency})
            </span>
            <div className="flex items-center gap-4">
              <div className="text-3xl md:text-4xl font-black text-white">
                {activeTrip.currency} {budgetInput.toLocaleString()}
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                {budgetPlan?.budgetStatus || 'Balanced'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Approx. {activeTrip.currency} {budgetPlan?.dailyAveragePerTraveler || Math.round(budgetInput / ((activeTrip.durationDays || 4) * (activeTrip.adults || 2)))}/day per traveler ({activeTrip.adults + activeTrip.children} travelers, {activeTrip.durationDays} days)
            </p>
          </div>

          {/* Quick Slider & Recalculate */}
          <div className="w-full md:w-80 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Adjust Target:</span>
              <span className="font-mono font-bold text-white">
                {activeTrip.currency} {budgetInput}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="15000"
              step="100"
              value={budgetInput}
              onChange={(e) => setBudgetInput(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <button
              onClick={() => fetchBudgetCalculation(budgetInput)}
              disabled={isOptimizing}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>Recalculate & Rebalance</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bar Breakdown */}
        {budgetPlan && budgetPlan.categories && (
          <div className="mt-8 pt-6 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
              Budget Distribution Breakdown
            </span>
            <div className="w-full h-4 rounded-full bg-slate-950 flex overflow-hidden p-0.5 border border-slate-800">
              {budgetPlan.categories.map((cat, idx) => {
                const colors = [
                  'bg-blue-500',
                  'bg-amber-500',
                  'bg-emerald-500',
                  'bg-purple-500',
                  'bg-cyan-500',
                  'bg-pink-500',
                  'bg-rose-500'
                ];
                return (
                  <div
                    key={cat.name}
                    style={{ width: `${cat.percentage}%` }}
                    className={`${colors[idx % colors.length]} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                    title={`${cat.name}: ${cat.percentage}%`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown Cards */}
      {isOptimizing ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <span className="text-sm">Recalculating allocations and searching cost savings...</span>
        </div>
      ) : budgetPlan && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {budgetPlan.categories.map((cat) => (
            <div key={cat.name} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{cat.name}</h3>
                    <span className="text-[10px] text-slate-500">{cat.percentage}% of budget</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-white">
                    {budgetPlan.currency} {cat.allocated.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mb-2">{cat.description}</p>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{cat.tips}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Cost Optimization Recommendations */}
      {budgetPlan?.aiOptimizationSuggestions && budgetPlan.aiOptimizationSuggestions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">AI Cost-Saving Recommendations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {budgetPlan.aiOptimizationSuggestions.map((sug, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                      Save up to {budgetPlan.currency} {sug.potentialSavings}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      {sug.impact} Impact
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1.5">{sug.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{sug.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
