import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  Trip,
  Itinerary,
  ItineraryDay,
  TransportOption,
  AccommodationOption,
  BudgetPlan,
  BookingRecord,
  ActivityItem
} from '../types/travel';

interface TripContextType {
  activeTrip: Trip;
  savedTrips: Trip[];
  userBookings: BookingRecord[];
  updateActiveTrip: (updates: Partial<Trip>) => void;
  saveCurrentTrip: () => void;
  deleteTrip: (id: string) => void;
  loadTrip: (trip: Trip) => void;
  createNewTrip: (initial?: Partial<Trip>) => void;
  setItinerary: (itinerary: Itinerary) => void;
  updateItineraryDay: (dayNumber: number, updatedDay: ItineraryDay) => void;
  removeActivity: (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening') => void;
  addActivity: (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', activity: Partial<ActivityItem>) => void;
  setSelectedTransport: (transport: TransportOption) => void;
  setSelectedAccommodation: (accommodation: AccommodationOption) => void;
  setBudgetPlan: (budgetPlan: BudgetPlan) => void;
  confirmBooking: (
    type: 'Transportation' | 'Accommodation' | 'Package',
    item: TransportOption | AccommodationOption | { title: string; price: number },
    travelerNames?: string[]
  ) => BookingRecord;
  cancelBooking: (bookingId: string) => void;
  applyRecoveryPlan: (option: any) => void;
}

const defaultInitialTrip = (userId: string, currency: string = 'USD'): Trip => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 14);
  const returnDate = new Date();
  returnDate.setDate(tomorrow.getDate() + 5);

  return {
    id: `trip_${Date.now()}`,
    userId,
    title: 'New Trip',
    origin: '',
    destination: '',
    departureDate: tomorrow.toISOString().split('T')[0],
    returnDate: returnDate.toISOString().split('T')[0],
    durationDays: 5,
    adults: 2,
    children: 0,
    budget: 2000,
    currency,
    transportPreference: 'Flight',
    stayPreference: 'Boutique Stay',
    interests: ['Culture & History', 'Local Gastronomy', 'Scenic Photography'],
    dietaryRequirements: 'None',
    accessibilityRequirements: 'None',
    status: 'Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // All stored trips in database/storage
  const [allTrips, setAllTrips] = useState<Trip[]>(() => {
    try {
      const stored = localStorage.getItem('voyagemind_trips');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any stale predefined trips
          return parsed.filter((t: any) => 
            !t.destination?.toLowerCase().includes('switzerland') &&
            !t.destination?.toLowerCase().includes('interlaken')
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // All bookings in database/storage
  const [allBookings, setAllBookings] = useState<BookingRecord[]>(() => {
    try {
      const stored = localStorage.getItem('voyagemind_bookings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: any) => 
            !b.details?.title?.toLowerCase().includes('switzerland') &&
            !b.details?.title?.toLowerCase().includes('interlaken')
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Active working trip for the current user
  const [activeTrip, setActiveTrip] = useState<Trip>(() => {
    return defaultInitialTrip(currentUser.id, currentUser.currency);
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voyagemind_trips', JSON.stringify(allTrips));
    } catch (e) {
      console.error(e);
    }
  }, [allTrips]);

  useEffect(() => {
    try {
      localStorage.setItem('voyagemind_bookings', JSON.stringify(allBookings));
    } catch (e) {
      console.error(e);
    }
  }, [allBookings]);

  // When current user switches, update activeTrip to that user's latest trip or default
  useEffect(() => {
    const userTrips = allTrips.filter(t => t.userId === currentUser.id);
    if (userTrips.length > 0) {
      setActiveTrip(userTrips[userTrips.length - 1]);
    } else {
      setActiveTrip(defaultInitialTrip(currentUser.id, currentUser.currency));
    }
  }, [currentUser.id]);

  // Current user's isolated data
  const savedTrips = allTrips.filter(t => t.userId === currentUser.id);
  const userBookings = allBookings.filter(b => b.userId === currentUser.id);

  const updateActiveTrip = (updates: Partial<Trip>) => {
    setActiveTrip(prev => ({
      ...prev,
      ...updates,
      userId: currentUser.id,
      updatedAt: new Date().toISOString(),
    }));
  };

  const saveCurrentTrip = () => {
    const tripToSave = {
      ...activeTrip,
      userId: currentUser.id,
      updatedAt: new Date().toISOString(),
    };

    setAllTrips(prev => {
      const index = prev.findIndex(t => t.id === tripToSave.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = tripToSave;
        return copy;
      }
      return [...prev, tripToSave];
    });
  };

  const deleteTrip = (id: string) => {
    setAllTrips(prev => prev.filter(t => t.id !== id));
    if (activeTrip.id === id) {
      setActiveTrip(defaultInitialTrip(currentUser.id, currentUser.currency));
    }
  };

  const loadTrip = (trip: Trip) => {
    setActiveTrip(trip);
  };

  const createNewTrip = (initial?: Partial<Trip>) => {
    const fresh = {
      ...defaultInitialTrip(currentUser.id, currentUser.currency),
      ...initial,
      id: `trip_${Date.now()}`,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveTrip(fresh);
  };

  const setItinerary = (itinerary: Itinerary) => {
    setActiveTrip(prev => ({
      ...prev,
      itinerary,
      status: 'Planned',
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateItineraryDay = (dayNumber: number, updatedDay: ItineraryDay) => {
    if (!activeTrip.itinerary) return;
    const newDays = activeTrip.itinerary.days.map(d => (d.dayNumber === dayNumber ? updatedDay : d));
    setActiveTrip(prev => ({
      ...prev,
      itinerary: prev.itinerary ? { ...prev.itinerary, days: newDays } : undefined,
    }));
  };

  const removeActivity = (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening') => {
    if (!activeTrip.itinerary) return;
    const day = activeTrip.itinerary.days.find(d => d.dayNumber === dayNumber);
    if (!day) return;

    const updatedDay: ItineraryDay = {
      ...day,
      [slot]: {
        id: `free_${Date.now()}`,
        title: 'Free Time & Exploration',
        description: 'Open schedule for spontaneous relaxation, local strolling, or cafe hopping.',
        locationName: activeTrip.destination,
        duration: 'Flexible',
        estimatedCost: 0,
        timeSlot: slot,
      },
    };
    updateItineraryDay(dayNumber, updatedDay);
  };

  const addActivity = (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', activity: Partial<ActivityItem>) => {
    if (!activeTrip.itinerary) return;
    const day = activeTrip.itinerary.days.find(d => d.dayNumber === dayNumber);
    if (!day) return;

    const newActivity: ActivityItem = {
      id: `act_${Date.now()}`,
      title: activity.title || 'Custom Activity',
      description: activity.description || 'Self-curated activity',
      locationName: activity.locationName || activeTrip.destination,
      coordinates: activity.coordinates,
      duration: activity.duration || '2 hours',
      estimatedCost: activity.estimatedCost || 20,
      timeSlot: slot,
      culinaryRecommendation: activity.culinaryRecommendation,
    };

    const updatedDay: ItineraryDay = {
      ...day,
      [slot]: newActivity,
    };
    updateItineraryDay(dayNumber, updatedDay);
  };

  const setSelectedTransport = (transport: TransportOption) => {
    setActiveTrip(prev => ({
      ...prev,
      selectedTransport: transport,
      updatedAt: new Date().toISOString(),
    }));
  };

  const setSelectedAccommodation = (accommodation: AccommodationOption) => {
    setActiveTrip(prev => ({
      ...prev,
      selectedAccommodation: accommodation,
      updatedAt: new Date().toISOString(),
    }));
  };

  const setBudgetPlan = (budgetPlan: BudgetPlan) => {
    setActiveTrip(prev => ({
      ...prev,
      budgetPlan,
      updatedAt: new Date().toISOString(),
    }));
  };

  const confirmBooking = (
    type: 'Transportation' | 'Accommodation' | 'Package',
    item: any,
    travelerNames?: string[]
  ): BookingRecord => {
    const refCode = `VM-${type.slice(0, 2).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const names = travelerNames && travelerNames.length > 0 ? travelerNames : [currentUser.name];

    const newBooking: BookingRecord = {
      id: `book_${Date.now()}`,
      referenceNumber: refCode,
      userId: currentUser.id,
      type,
      title: item.title || item.name || item.providerName || `${type} Reservation`,
      provider: item.providerName || item.name || 'VoyageMind Partner Network',
      dates: `${activeTrip.departureDate} to ${activeTrip.returnDate}`,
      location: activeTrip.destination,
      totalAmount: item.totalPrice || item.price || item.totalAmount || 150,
      currency: activeTrip.currency,
      status: 'Confirmed (Simulated)',
      bookedAt: new Date().toISOString(),
      travelerNames: names,
      details: item,
      isSimulated: true,
    };

    setAllBookings(prev => [newBooking, ...prev]);

    // Also update active trip status
    setActiveTrip(prev => ({
      ...prev,
      status: 'Booked',
      updatedAt: new Date().toISOString(),
    }));

    return newBooking;
  };

  const cancelBooking = (bookingId: string) => {
    setAllBookings(prev =>
      prev.map(b => (b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b))
    );
  };

  const applyRecoveryPlan = (option: any) => {
    if (!activeTrip.itinerary) return;

    // Apply adjustments to trip
    const updatedOverview = `${activeTrip.itinerary.overview} [Disruption Resolved: ${option.title}]`;
    const updatedItinerary: Itinerary = {
      ...activeTrip.itinerary,
      overview: updatedOverview,
    };

    setActiveTrip(prev => ({
      ...prev,
      itinerary: updatedItinerary,
      budget: prev.budget + (option.costDifference || 0),
      updatedAt: new Date().toISOString(),
    }));

    // Add recovery confirmation to bookings / trip notes
    confirmBooking(
      'Package',
      {
        title: `Adaptive Recovery: ${option.title}`,
        provider: 'VoyageMind Journey Recovery Engine',
        totalPrice: option.costDifference > 0 ? option.costDifference : 0,
        strategy: option.strategy,
      },
      [currentUser.name]
    );
  };

  return (
    <TripContext.Provider
      value={{
        activeTrip,
        savedTrips,
        userBookings,
        updateActiveTrip,
        saveCurrentTrip,
        deleteTrip,
        loadTrip,
        createNewTrip,
        setItinerary,
        updateItineraryDay,
        removeActivity,
        addActivity,
        setSelectedTransport,
        setSelectedAccommodation,
        setBudgetPlan,
        confirmBooking,
        cancelBooking,
        applyRecoveryPlan,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
