export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currency: string;
  homeCity: string;
  preferredTransport: 'Flight' | 'Train' | 'Bus' | 'Car' | 'Any';
  preferredStay: 'Luxury Hotel' | 'Resort' | 'Boutique Stay' | 'Guesthouse' | 'Apartment' | 'Any';
  travelInterests: string[];
  dietaryRequirements: string;
  accessibilityNeeds: string;
  passportCountry?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  locationName: string;
  coordinates?: Coordinates;
  duration: string;
  estimatedCost: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  culinaryRecommendation?: {
    dish: string;
    restaurant: string;
    estimatedMealCost: number;
  };
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  theme: string;
  morning: ActivityItem;
  afternoon: ActivityItem;
  evening: ActivityItem;
  localTransportMode: string;
  approxTravelTime: string;
  totalEstimatedDayCost: number;
  optionalActivity?: {
    title: string;
    description: string;
    estimatedCost: number;
  };
}

export interface Itinerary {
  tripTitle: string;
  destination: string;
  durationDays: number;
  currency: string;
  overview: string;
  tripHighlights: string[];
  weatherForecast?: string;
  packingChecklist?: string[];
  days: ItineraryDay[];
}

export interface TransportOption {
  id: string;
  mode: 'Flight' | 'Train' | 'Bus' | 'Car';
  providerName: string;
  operatorCode: string;
  departureLocation: string;
  arrivalLocation: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  stopDetails: string;
  pricePerPerson: number;
  totalPrice: number;
  currency: string;
  cabinClass: string;
  baggageAllowance: string;
  ecoRating: string;
  refundable: boolean;
  isSimulated: boolean;
  bookingDisclaimers: string;
}

export interface AccommodationOption {
  id: string;
  name: string;
  stayType: string;
  neighborhood: string;
  starRating: number;
  userReviewRating: number;
  reviewCount: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  roomType: string;
  amenities: string[];
  coordinates?: Coordinates;
  distanceToCenter: string;
  freeCancellationUntil: string;
  breakfastIncluded: boolean;
  isSimulated: boolean;
  bookingNotes: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  region: string;
  tagline: string;
  description: string;
  coordinates: Coordinates;
  climate: string;
  bestSeason: string;
  recommendedDurationDays: number;
  estimatedDailyCost: number;
  matchScore: number;
  highlights: string[];
  travelTips: string[];
  matchReasons?: string[];
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  percentage: number;
  description: string;
  tips: string;
}

export interface BudgetPlan {
  totalBudget: number;
  currency: string;
  totalEstimatedSpend: number;
  balance: number;
  budgetStatus: 'Under Budget' | 'Balanced' | 'Over Budget';
  dailyAveragePerTraveler: number;
  categories: BudgetCategory[];
  aiOptimizationSuggestions: Array<{
    title: string;
    potentialSavings: number;
    impact: 'High' | 'Medium' | 'Low';
    action: string;
  }>;
}

export interface BookingRecord {
  id: string;
  referenceNumber: string;
  userId: string;
  type: 'Transportation' | 'Accommodation' | 'Package';
  title: string;
  provider: string;
  dates: string;
  location: string;
  totalAmount: number;
  currency: string;
  status: 'Confirmed (Simulated)' | 'Modified' | 'Cancelled';
  bookedAt: string;
  travelerNames: string[];
  details: Record<string, any>;
  isSimulated: true;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  durationDays: number;
  adults: number;
  children: number;
  budget: number;
  currency: string;
  transportPreference: string;
  stayPreference: string;
  interests: string[];
  dietaryRequirements?: string;
  accessibilityRequirements?: string;
  itinerary?: Itinerary;
  selectedTransport?: TransportOption;
  selectedAccommodation?: AccommodationOption;
  budgetPlan?: BudgetPlan;
  status: 'Draft' | 'Planned' | 'Booked' | 'Completed';
  createdAt: string;
  updatedAt: string;
}

export interface DisruptionRecovery {
  problemAssessment: {
    severity: 'Critical' | 'Moderate' | 'Minor';
    affectedComponents: string[];
    immediateRisk: string;
    recoveryGoal: string;
  };
  recoveryOptions: Array<{
    optionId: string;
    title: string;
    strategy: string;
    actionPlan: string[];
    costDifference: number;
    currency: string;
    timeImpact: string;
    pros: string[];
    cons: string[];
    recommended: boolean;
  }>;
  itineraryModificationsPreview: string;
  explanation: string;
  confirmationPrompt: string;
}
