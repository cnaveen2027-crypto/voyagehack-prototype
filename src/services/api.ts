import {
  DestinationItem,
  TransportOption,
  AccommodationOption,
  Itinerary,
  BudgetPlan,
  DisruptionRecovery,
  Trip
} from '../types/travel';

export const TravelAPI = {
  // 1. Process Natural Language Intent
  async processIntent(userInput: string, existingContext?: any) {
    const res = await fetch('/api/travel/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, existingContext }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to process intent');
    }
    return res.json();
  },

  // 2. Recommend Destinations
  async getDestinations(filters: any): Promise<DestinationItem[]> {
    const res = await fetch('/api/travel/destinations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filters),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch destinations');
    }
    return res.json();
  },

  // 3. Search Transportation
  async searchTransport(details: any): Promise<TransportOption[]> {
    const res = await fetch('/api/travel/transport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to search transportation');
    }
    return res.json();
  },

  // 4. Search Accommodations
  async searchAccommodations(details: any): Promise<AccommodationOption[]> {
    const res = await fetch('/api/travel/accommodations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to search accommodations');
    }
    return res.json();
  },

  // 5. Generate Itinerary
  async generateItinerary(details: any): Promise<Itinerary> {
    const res = await fetch('/api/travel/itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate itinerary');
    }
    return res.json();
  },

  // 6. Calculate Budget
  async calculateBudget(params: any): Promise<BudgetPlan> {
    const res = await fetch('/api/travel/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to calculate budget');
    }
    return res.json();
  },

  // 7. Recover Journey
  async recoverJourney(params: {
    currentTrip: any;
    disruptionType: string;
    disruptionDetails: string;
  }): Promise<DisruptionRecovery> {
    const res = await fetch('/api/travel/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to calculate recovery plan');
    }
    return res.json();
  },

  // 8. Conversational Agent
  async chatAgent(params: {
    message: string;
    history?: any[];
    currentTrip?: any;
  }): Promise<{ reply: string; actionSuggestions: string[] }> {
    const res = await fetch('/api/travel/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Chat agent error');
    }
    return res.json();
  },

  // 9. Maps Config
  async getMapsConfig(): Promise<{ apiKey: string }> {
    try {
      const res = await fetch('/api/maps/config');
      if (res.ok) {
        return res.json();
      }
    } catch {
      // fallback
    }
    return { apiKey: 'AIzaSyB3rYwg-YlIGlOk4YjZyyki-kFoX68K0Kk' };
  },

  // 10. Geocode Address via Server Proxy
  async geocode(query: string): Promise<{
    formattedAddress: string;
    location: { lat: number; lng: number };
    status: string;
  }> {
    try {
      const res = await fetch(`/api/maps/geocode?query=${encodeURIComponent(query)}`);
      if (res.ok) {
        return res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return {
      formattedAddress: query,
      location: { lat: 40.7128, lng: -74.0060 },
      status: 'FALLBACK',
    };
  }
};
