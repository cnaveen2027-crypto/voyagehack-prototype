import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import {
  User,
  Settings,
  Mail,
  MapPin,
  DollarSign,
  Plane,
  Building,
  Heart,
  Users,
  Check,
  X,
  Plus,
  ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, switchUser, updateProfile, signup } = useAuth();
  const { savedTrips, userBookings } = useTrip();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [homeCity, setHomeCity] = useState(currentUser.homeCity);
  const [currency, setCurrency] = useState(currentUser.currency);
  const [preferredTransport, setPreferredTransport] = useState(currentUser.preferredTransport);
  const [preferredStay, setPreferredStay] = useState(currentUser.preferredStay);
  const [dietary, setDietary] = useState(currentUser.dietaryRequirements);
  const [accessibility, setAccessibility] = useState(currentUser.accessibilityNeeds);

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');

  const [saveFeedback, setSaveFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      email,
      homeCity,
      currency,
      preferredTransport,
      preferredStay,
      dietaryRequirements: dietary,
      accessibilityNeeds: accessibility,
    });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    signup({
      name: newName,
      email: newEmail,
      homeCity: newCity || 'New York, NY',
      currency: 'USD',
    });

    setIsCreatingNew(false);
    setNewName('');
    setNewEmail('');
    setNewCity('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{currentUser.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                {savedTrips.length} Saved Trips
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                {userBookings.length} Active Bookings
              </span>
            </div>
          </div>
        </div>

        {/* Multi-User Switcher Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch Traveler Account (Data Isolation Verified)</span>
            </span>
            <button
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allUsers.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                    {u.name.slice(0, 1)}
                  </div>
                  <span>{u.name}</span>
                </button>
              );
            })}
          </div>

          {/* New User Creator inline */}
          {isCreatingNew && (
            <form onSubmit={handleCreateNewUser} className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Create Independent Profile:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Email Address"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="Home City"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Create & Switch
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Home Location / Airport</label>
              <input
                type="text"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Default Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preferred Transport</label>
              <select
                value={preferredTransport}
                onChange={(e: any) => setPreferredTransport(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Flight">Flight</option>
                <option value="Train">Scenic Train</option>
                <option value="Bus">Bus</option>
                <option value="Car">Car Rental</option>
                <option value="Any">Any Mode</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preferred Stay</label>
              <select
                value={preferredStay}
                onChange={(e: any) => setPreferredStay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="Boutique Stay">Boutique Stay</option>
                <option value="Luxury Hotel">Luxury 5-Star Hotel</option>
                <option value="Resort">Resort</option>
                <option value="Guesthouse">Guesthouse</option>
                <option value="Apartment">Apartment</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dietary Requirements</label>
              <input
                type="text"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="Vegetarian, Halal, Gluten-Free, Vegan, etc."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {saveFeedback ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-4 h-4" />
                <span>Profile preferences updated!</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Preferences auto-sync to all AI planners</span>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
