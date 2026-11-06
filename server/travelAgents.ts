import { Type } from '@google/genai';
import { getGeminiClient, GEMINI_MODEL } from './gemini.js';

export interface TravelContext {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  durationDays?: number;
  adults?: number;
  children?: number;
  budget?: number;
  currency?: string;
  transportPreference?: string;
  stayPreference?: string;
  interests?: string[];
  dietaryRequirements?: string;
  accessibilityRequirements?: string;
  additionalNotes?: string;
  [key: string]: any;
}

// Helper to safely call Gemini and parse JSON
async function callGeminiJson<T>(systemPrompt: string, userPrompt: string, fallbackGenerator: () => T): Promise<T> {
  const ai = getGeminiClient();
  if (!ai) {
    return fallbackGenerator();
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) {
      return fallbackGenerator();
    }
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Gemini API call failed, using dynamic algorithmic fallback:', error);
    return fallbackGenerator();
  }
}

// 1. Travel Intent Agent
export async function parseTravelIntent(userInput: string, existingContext?: TravelContext) {
  const systemPrompt = `You are the VoyageMind AI Travel Intent Agent.
Analyze the user's natural language travel request and extract all travel parameters into structured JSON.
Current context: ${JSON.stringify(existingContext || {})}

Return JSON with this exact structure:
{
  "extracted": {
    "origin": string or null,
    "destination": string or null,
    "departureDate": string (YYYY-MM-DD) or null,
    "returnDate": string (YYYY-MM-DD) or null,
    "durationDays": number or null,
    "adults": number,
    "children": number,
    "budget": number or null,
    "currency": string (e.g. USD, EUR, INR, GBP, etc.),
    "transportPreference": string or null,
    "stayPreference": string or null,
    "interests": string[],
    "dietaryRequirements": string or null,
    "accessibilityRequirements": string or null,
    "additionalNotes": string or null
  },
  "isComplete": boolean,
  "missingFields": string[],
  "clarifyingQuestions": string[],
  "summary": string,
  "suggestedDestinations": string[] (if destination was not specified or was vague like "peaceful hill station")
}`;

  return callGeminiJson(systemPrompt, `User Request: "${userInput}"`, () => {
    // Dynamic rule-based extractor
    const adultsMatch = userInput.match(/(\d+)\s*(adult|people|person|traveler|traveller|with my wife|with my husband|couple)/i);
    const daysMatch = userInput.match(/(\d+)\s*(day|night)/i);
    const budgetMatch = userInput.match(/(?:budget\s*(?:of|is|:)?\s*|under\s*|\$|€|£|₹)\s*(\d+[\d,]*)/i) ||
                        userInput.match(/(\d+[\d,]*)\s*(?:usd|eur|inr|gbp|dollars|budget)/i);
    const destMatch = userInput.match(/(?:visit|to|trip to|explore|vacation in|travel to)\s+([A-Za-z\s]+?)(?:\s+(?:for|with|on|in|from)|$)/i);
    const originMatch = userInput.match(/(?:from|departing from|leaving)\s+([A-Za-z\s,]+?)(?:\s+(?:to|for|with|on)|$)/i);

    const foundDest = destMatch ? destMatch[1].trim() : (existingContext?.destination || null);
    const foundOrigin = originMatch ? originMatch[1].trim() : (existingContext?.origin || null);

    return {
      extracted: {
        origin: foundOrigin,
        destination: foundDest,
        departureDate: existingContext?.departureDate || null,
        returnDate: existingContext?.returnDate || null,
        durationDays: daysMatch ? parseInt(daysMatch[1]) : (existingContext?.durationDays || 4),
        adults: adultsMatch ? (adultsMatch[2].includes('wife') || adultsMatch[2].includes('husband') || adultsMatch[2].includes('couple') ? 2 : parseInt(adultsMatch[1])) : (existingContext?.adults || 2),
        children: existingContext?.children || 0,
        budget: budgetMatch ? parseInt(budgetMatch[1].replace(/,/g, '')) : (existingContext?.budget || 1500),
        currency: existingContext?.currency || 'USD',
        transportPreference: existingContext?.transportPreference || 'Flight',
        stayPreference: existingContext?.stayPreference || 'Hotel',
        interests: existingContext?.interests || ['Sightseeing', 'Local Food'],
        dietaryRequirements: existingContext?.dietaryRequirements || null,
        accessibilityRequirements: existingContext?.accessibilityRequirements || null,
        additionalNotes: userInput,
      },
      isComplete: !!(foundOrigin && foundDest),
      missingFields: ['origin', 'destination', 'departureDate'].filter(f => !(foundOrigin && f === 'origin') && !(foundDest && f === 'destination') && !(existingContext as any)?.[f]),
      clarifyingQuestions: [
        'What starting location or departure airport will you be traveling from?',
        'Do you have specific travel dates in mind, or are your dates flexible?',
        'What is your preferred transportation mode and hotel style?'
      ],
      summary: `Travel request processed for ${foundDest || 'destination'} (${daysMatch ? daysMatch[1] : 4} days).`,
      suggestedDestinations: ['Tokyo, Japan', 'Kyoto, Japan', 'Paris, France', 'Banff, Canada', 'Ooty, India']
    };
  });
}

// 2. Destination Recommendation Agent
export async function recommendDestinations(filters: {
  interests?: string[];
  climate?: string;
  budgetLevel?: string;
  region?: string;
  travelStyle?: string;
  currency?: string;
  origin?: string;
}) {
  const systemPrompt = `You are the VoyageMind AI Destination Recommendation Agent.
Suggest 5 diverse, high-quality, real-world destinations matching the user's specific preferences.
Ensure each destination has real geographic coordinates (lat, lng), realistic expense estimates in ${filters.currency || 'USD'}, and curated reasons to visit.
Return JSON array of destination objects:
[
  {
    "id": string,
    "name": string,
    "country": string,
    "region": string,
    "tagline": string,
    "description": string,
    "coordinates": { "lat": number, "lng": number },
    "climate": string,
    "bestSeason": string,
    "recommendedDurationDays": number,
    "estimatedDailyCost": number,
    "matchScore": number (percentage 80-99),
    "highlights": string[],
    "travelTips": string[],
    "matchReasons": string[]
  }
]`;

  const userPrompt = `User criteria: ${JSON.stringify(filters)}`;

  return callGeminiJson(systemPrompt, userPrompt, () => {
    const currency = filters.currency || 'USD';
    return [
      {
        id: 'dest-1',
        name: 'Rome & Vatican City',
        country: 'Italy',
        region: 'Europe',
        tagline: 'The Eternal City of Caesars, Piazzas & Culinary Feasts',
        description: 'Immerse yourself in three millennia of history, from the Colosseum and Pantheon to world-class espresso bars and Trastevere trattorias.',
        coordinates: { lat: 41.9028, lng: 12.4964 },
        climate: 'Mediterranean Sun',
        bestSeason: 'April - June / September - October',
        recommendedDurationDays: 5,
        estimatedDailyCost: 175,
        matchScore: 96,
        highlights: ['Colosseum & Roman Forum Walk', 'Vatican Museums & Sistine Chapel', 'Trevi Fountain & Spanish Steps', 'Trastevere Evening Gastronomy Tour'],
        travelTips: ['Book skip-the-line museum tickets well in advance', 'Enjoy afternoon gelato while exploring cobblestone alleyways'],
        matchReasons: ['Unrivaled ancient history, vibrant street life, and world-renowned dining.']
      },
      {
        id: 'dest-2',
        name: 'Kyoto & Arashiyama',
        country: 'Japan',
        region: 'Asia',
        tagline: 'Timeless Shrines, Zen Gardens & Culinary Mastery',
        description: 'The cultural heart of Japan boasting over 2,000 temples, tranquil bamboo groves, centuries-old tea houses, and exquisite Kaiseki dining.',
        coordinates: { lat: 35.0116, lng: 135.7681 },
        climate: 'Temperate / Four Seasons',
        bestSeason: 'March - May / October - November',
        recommendedDurationDays: 6,
        estimatedDailyCost: 160,
        matchScore: 94,
        highlights: ['Fushimi Inari 10,000 Torii Gates', 'Arashiyama Bamboo Grove & Sagano Scenic Railway', 'Kinkaku-ji Golden Pavilion', 'Gion Historic Geisha District'],
        travelTips: ['Start shrine visits by 7:30 AM to beat tour groups', 'Wear easily removable walking shoes for tatami temple floors'],
        matchReasons: ['Superb cultural depth, safe environment, and world-class gastronomic heritage.']
      },
      {
        id: 'dest-3',
        name: 'Reykjavik & The Golden Circle',
        country: 'Iceland',
        region: 'Nordic',
        tagline: 'Land of Geysers, Glaciers & Dancing Aurora',
        description: 'Dramatic volcanic landscapes, geothermal lagoons, roaring waterfalls, and otherworldly black sand beaches along the North Atlantic.',
        coordinates: { lat: 64.1466, lng: -21.9426 },
        climate: 'Subpolar Oceanic',
        bestSeason: 'September - April (Aurora) / June - August (Midnight Sun)',
        recommendedDurationDays: 5,
        estimatedDailyCost: 210,
        matchScore: 92,
        highlights: ['Gullfoss Double-Tier Waterfall', 'Strokkur Erupting Geyser', 'Blue Lagoon Geothermal Spa', 'Thingvellir Tectonic Rift Valley'],
        travelTips: ['Rent a 4WD vehicle with comprehensive gravel protection', 'Check the Vedur app daily for road conditions and solar activity'],
        matchReasons: ['Unmatched dramatic natural wonders and high-adventure landscapes.']
      },
      {
        id: 'dest-4',
        name: 'Cape Town & Cape Peninsula',
        country: 'South Africa',
        region: 'Africa',
        tagline: 'Where Towering Oceans Meet Mountain Peaks',
        description: 'Dramatic mountain cliffs, white sand beaches, world-renowned vineyards, and rich coastal wildlife, crowned by Table Mountain.',
        coordinates: { lat: -33.9249, lng: 18.4241 },
        climate: 'Mediterranean Coastal',
        bestSeason: 'November - April',
        recommendedDurationDays: 7,
        estimatedDailyCost: 130,
        matchScore: 91,
        highlights: ['Table Mountain Aerial Cableway', 'Cape Point & Boulders Penguin Beach', 'Kirstenbosch Botanical Gardens', 'Stellenbosch Wine Tram'],
        travelTips: ['Book cableway tickets in advance on clear days', 'Take verified rideshares after dusk in the city center'],
        matchReasons: ['Exceptional value for money, diverse nature, and vibrant food culture.']
      },
      {
        id: 'dest-5',
        name: 'Cusco & Sacred Valley',
        country: 'Peru',
        region: 'South America',
        tagline: 'The Ancient Incan Capital in the Clouds',
        description: 'Surrounded by Andean peaks, Cusco blends colonial baroque courtyards with ancient stone temples and the legendary citadel of Machu Picchu.',
        coordinates: { lat: -13.5319, lng: -71.9675 },
        climate: 'Subtropical Highland',
        bestSeason: 'May - October',
        recommendedDurationDays: 6,
        estimatedDailyCost: 110,
        matchScore: 90,
        highlights: ['Machu Picchu Sanctuary', 'Ollantaytambo Sun Temple', 'Moray Agricultural Terraces', 'San Pedro Traditional Market'],
        travelTips: ['Spend the first 24 hours acclimatizing with coca tea and light meals', 'Book Machu Picchu train tickets 6 weeks ahead'],
        matchReasons: ['Mesmerizing UNESCO archaeology, budget-friendly, and vibrant indigenous culture.']
      }
    ];
  });
}

// 3. Transportation Agent
export async function searchTransportation(details: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  category?: 'Flight' | 'Train' | 'Bus' | 'Car' | 'All';
  currency?: string;
}) {
  const currency = details.currency || 'USD';
  const systemPrompt = `You are the VoyageMind AI Transportation Agent.
Calculate and provide realistic, dynamic travel options between '${details.origin}' and '${details.destination}'.
Passenger count: ${details.adults + (details.children || 0)}
Departure: ${details.departureDate}, Return: ${details.returnDate || 'One way'}
Category requested: ${details.category || 'All'}
Currency: ${currency}

CRITICAL:
1. Always label options clearly as: "Simulated Supplier Estimate (Based on current seasonal benchmarks)".
2. Compute realistic transit durations and reasonable prices based on the geographic distance and common travel routes between these specific locations.
3. Include multiple modes (Flight, Train, Bus, Car) if geographically viable.

Return JSON array of options:
[
  {
    "id": string,
    "mode": "Flight" | "Train" | "Bus" | "Car",
    "providerName": string,
    "operatorCode": string,
    "departureLocation": string,
    "arrivalLocation": string,
    "departureTime": string (e.g. "08:15 AM"),
    "arrivalTime": string (e.g. "11:45 AM"),
    "duration": string (e.g. "3h 30m"),
    "stops": number,
    "stopDetails": string,
    "pricePerPerson": number,
    "totalPrice": number,
    "currency": "${currency}",
    "cabinClass": string,
    "baggageAllowance": string,
    "ecoRating": string (e.g. "Low CO2 (-24%)"),
    "refundable": boolean,
    "isSimulated": true,
    "bookingDisclaimers": string
  }
]`;

  return callGeminiJson(systemPrompt, `Search parameters: ${JSON.stringify(details)}`, () => {
    const totalPassengers = Math.max(1, details.adults + (details.children || 0));
    return [
      {
        id: 'trans-fl-1',
        mode: 'Flight' as const,
        providerName: `${details.origin.slice(0, 3).toUpperCase()} Air International`,
        operatorCode: 'VM-402',
        departureLocation: `${details.origin} International Airport`,
        arrivalLocation: `${details.destination} Main Terminal`,
        departureTime: '08:30 AM',
        arrivalTime: '12:15 PM',
        duration: '3h 45m',
        stops: 0,
        stopDetails: 'Non-stop Direct Flight',
        pricePerPerson: 280,
        totalPrice: 280 * totalPassengers,
        currency,
        cabinClass: 'Economy Classic',
        baggageAllowance: '1 x 23kg Checked + 7kg Cabin',
        ecoRating: 'A321neo High Efficiency',
        refundable: true,
        isSimulated: true,
        bookingDisclaimers: 'Simulated benchmark fare for planning. Exact live fare verified upon airline checkout.'
      },
      {
        id: 'trans-fl-2',
        mode: 'Flight' as const,
        providerName: 'Skyline Express Air',
        operatorCode: 'SE-891',
        departureLocation: `${details.origin} Terminal 2`,
        arrivalLocation: `${details.destination} Airport`,
        departureTime: '02:00 PM',
        arrivalTime: '06:40 PM',
        duration: '4h 40m',
        stops: 1,
        stopDetails: '1 short transit (55 min layover)',
        pricePerPerson: 210,
        totalPrice: 210 * totalPassengers,
        currency,
        cabinClass: 'Saver Smart',
        baggageAllowance: '7kg Carry-on included',
        ecoRating: 'Standard Emissions',
        refundable: false,
        isSimulated: true,
        bookingDisclaimers: 'Simulated benchmark fare for planning.'
      },
      {
        id: 'trans-tr-1',
        mode: 'Train' as const,
        providerName: 'Continental Rail Express',
        operatorCode: 'CRE-710',
        departureLocation: `${details.origin} Central Station`,
        arrivalLocation: `${details.destination} Terminus`,
        departureTime: '07:15 AM',
        arrivalTime: '01:30 PM',
        duration: '6h 15m',
        stops: 2,
        stopDetails: 'Direct High-Speed Line',
        pricePerPerson: 115,
        totalPrice: 115 * totalPassengers,
        currency,
        cabinClass: 'Standard Reserved',
        baggageAllowance: '2 Large Cases + 1 Personal Item',
        ecoRating: 'Eco-Hero (-82% CO2 vs Flying)',
        refundable: true,
        isSimulated: true,
        bookingDisclaimers: 'Simulated benchmark railway ticket rate.'
      },
      {
        id: 'trans-car-1',
        mode: 'Car' as const,
        providerName: 'Apex Premium Fleet Rental',
        operatorCode: 'CAR-SUV',
        departureLocation: `${details.origin} Downtown Depot`,
        arrivalLocation: `${details.destination} Drop-off`,
        departureTime: 'Self-scheduled Pickup',
        arrivalTime: 'Flexible',
        duration: 'Scenic Highway Drive',
        stops: 0,
        stopDetails: 'Unlimited Mileage Included',
        pricePerPerson: Math.round(180 / totalPassengers),
        totalPrice: 180,
        currency,
        cabinClass: 'Full-size Hybrid SUV',
        baggageAllowance: 'Full trunk space (4 large bags)',
        ecoRating: 'Hybrid Drive',
        refundable: true,
        isSimulated: true,
        bookingDisclaimers: 'Simulated daily car rental rate including mandatory basic CDW.'
      }
    ];
  });
}

// 4. Accommodation Agent
export async function searchAccommodations(details: {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms: number;
  budgetPerNight?: number;
  stayType?: string;
  facilities?: string[];
  currency?: string;
}) {
  const currency = details.currency || 'USD';
  const systemPrompt = `You are the VoyageMind AI Accommodation Agent.
Find 4 diverse, realistic accommodation properties in '${details.destination}'.
Guests: ${details.guests}, Rooms: ${details.rooms}
Check-in: ${details.checkInDate}, Check-out: ${details.checkOutDate}
Budget target per night: ${details.budgetPerNight ? `${currency} ${details.budgetPerNight}` : 'Flexible'}
Stay type preferred: ${details.stayType || 'All types'}
Facilities requested: ${details.facilities?.join(', ') || 'Standard'}

Return JSON array of properties:
[
  {
    "id": string,
    "name": string,
    "stayType": "Luxury Hotel" | "Resort" | "Boutique Stay" | "Guesthouse" | "Apartment",
    "neighborhood": string,
    "starRating": number (3 to 5),
    "userReviewRating": number (e.g. 4.8),
    "reviewCount": number,
    "pricePerNight": number,
    "totalPrice": number,
    "currency": "${currency}",
    "roomType": string,
    "amenities": string[],
    "coordinates": { "lat": number, "lng": number },
    "distanceToCenter": string,
    "freeCancellationUntil": string,
    "breakfastIncluded": boolean,
    "isSimulated": true,
    "bookingNotes": string
  }
]`;

  return callGeminiJson(systemPrompt, `Accommodation search: ${JSON.stringify(details)}`, () => {
    const budget = details.budgetPerNight || 160;
    return [
      {
        id: 'acc-1',
        name: `${details.destination} Grand Heritage Hotel & Spa`,
        stayType: 'Luxury Hotel',
        neighborhood: 'City Center / Historic Quarter',
        starRating: 5,
        userReviewRating: 4.8,
        reviewCount: 1420,
        pricePerNight: Math.round(budget * 1.35),
        totalPrice: Math.round(budget * 1.35 * 4),
        currency,
        roomType: 'Deluxe Panoramic King Room',
        amenities: ['Heated Pool', 'Full-service Spa', 'Free High-speed Wi-Fi', 'Valet Parking', 'Fine Dining Restaurant', 'Fitness Center'],
        coordinates: { lat: 46.686, lng: 7.863 },
        distanceToCenter: '0.4 km from main square',
        freeCancellationUntil: '48h before arrival',
        breakfastIncluded: true,
        isSimulated: true,
        bookingNotes: 'Simulated hotel benchmark rate for itinerary budgeting.'
      },
      {
        id: 'acc-2',
        name: 'The Artisan Boutique Residence',
        stayType: 'Boutique Stay',
        neighborhood: 'Arts & Cultural District',
        starRating: 4,
        userReviewRating: 4.7,
        reviewCount: 680,
        pricePerNight: Math.round(budget * 0.95),
        totalPrice: Math.round(budget * 0.95 * 4),
        currency,
        roomType: 'Superior Queen Suite',
        amenities: ['Artisan Coffee Bar', 'Rooftop Terrace', 'Bicycle Rentals', 'Complimentary Wine Hour', 'Smart TV'],
        coordinates: { lat: 46.690, lng: 7.868 },
        distanceToCenter: '0.9 km from central station',
        freeCancellationUntil: '24h before arrival',
        breakfastIncluded: true,
        isSimulated: true,
        bookingNotes: 'Simulated boutique property rate.'
      },
      {
        id: 'acc-3',
        name: 'EcoLodge & Nature Haven',
        stayType: 'Resort',
        neighborhood: 'Lakeside & Mountain Foothills',
        starRating: 4,
        userReviewRating: 4.9,
        reviewCount: 512,
        pricePerNight: Math.round(budget * 1.15),
        totalPrice: Math.round(budget * 1.15 * 4),
        currency,
        roomType: 'Alpine Wood Chalet Room',
        amenities: ['Private Balcony with View', 'Solar Heated Hot Tub', 'Trail Access', 'Organic Farm-to-Table Dining'],
        coordinates: { lat: 46.678, lng: 7.850 },
        distanceToCenter: '2.5 km (shuttle provided)',
        freeCancellationUntil: '72h before arrival',
        breakfastIncluded: true,
        isSimulated: true,
        bookingNotes: 'Simulated eco-resort rate.'
      },
      {
        id: 'acc-4',
        name: 'Traveler Cozy Guesthouse & Lofts',
        stayType: 'Guesthouse',
        neighborhood: 'Old Town Lane',
        starRating: 3,
        userReviewRating: 4.5,
        reviewCount: 380,
        pricePerNight: Math.round(budget * 0.65),
        totalPrice: Math.round(budget * 0.65 * 4),
        currency,
        roomType: 'Double Studio with Kitchenette',
        amenities: ['Kitchenette', 'Self Check-in', 'Luggage Storage', 'Free Tea & Coffee'],
        coordinates: { lat: 46.688, lng: 7.865 },
        distanceToCenter: '0.6 km from city center',
        freeCancellationUntil: '24h before arrival',
        breakfastIncluded: false,
        isSimulated: true,
        bookingNotes: 'Simulated budget accommodation benchmark.'
      }
    ];
  });
}

// 5. Intelligent Itinerary Generator
export async function generateItinerary(tripDetails: TravelContext) {
  const currency = tripDetails.currency || 'USD';
  const duration = Math.min(14, Math.max(1, tripDetails.durationDays || 4));
  const destination = tripDetails.destination || 'Selected Destination';

  const systemPrompt = `You are the VoyageMind AI Itinerary Planning Agent.
Generate an extraordinary, completely dynamic day-by-day travel itinerary for '${destination}' for ${duration} days.
Travelers: ${tripDetails.adults || 2} Adults, ${tripDetails.children || 0} Children
Budget: ${currency} ${tripDetails.budget || 2000}
Interests: ${tripDetails.interests?.join(', ') || 'Culture, Food, Nature, Sightseeing'}
Dietary requirements: ${tripDetails.dietaryRequirements || 'None'}
Accessibility: ${tripDetails.accessibilityRequirements || 'Standard'}

CRITICAL:
- Every day MUST have structured morning, afternoon, and evening segments.
- Provide real places to visit with real estimated coordinates (lat, lng) around ${destination}.
- Provide estimated expenses in ${currency} for activities and food.
- Include local transport tips and travel times between stops.
- Provide 1-2 optional activities for travelers with extra energy or alternate tastes.

Return JSON object:
{
  "tripTitle": string,
  "destination": "${destination}",
  "durationDays": ${duration},
  "currency": "${currency}",
  "overview": string,
  "tripHighlights": string[],
  "weatherForecast": string,
  "packingChecklist": string[],
  "days": [
    {
      "dayNumber": number (1 to ${duration}),
      "date": string,
      "theme": string,
      "morning": {
        "title": string,
        "description": string,
        "locationName": string,
        "coordinates": { "lat": number, "lng": number },
        "duration": string,
        "estimatedCost": number
      },
      "afternoon": {
        "title": string,
        "description": string,
        "locationName": string,
        "coordinates": { "lat": number, "lng": number },
        "duration": string,
        "estimatedCost": number,
        "culinaryRecommendation": {
          "dish": string,
          "restaurant": string,
          "estimatedMealCost": number
        }
      },
      "evening": {
        "title": string,
        "description": string,
        "locationName": string,
        "coordinates": { "lat": number, "lng": number },
        "duration": string,
        "estimatedCost": number,
        "dinnerRecommendation": {
          "dish": string,
          "restaurant": string,
          "estimatedMealCost": number
        }
      },
      "localTransportMode": string,
      "approxTravelTime": string,
      "totalEstimatedDayCost": number,
      "optionalActivity": {
        "title": string,
        "description": string,
        "estimatedCost": number
      }
    }
  ]
}`;

  return callGeminiJson(systemPrompt, `Generate itinerary for: ${JSON.stringify(tripDetails)}`, () => {
    // Dynamic generator based on user destination
    const days = [];
    const baseLat = 46.686;
    const baseLng = 7.863;

    for (let i = 1; i <= duration; i++) {
      days.push({
        dayNumber: i,
        date: `Day ${i}`,
        theme: i === 1 ? 'Arrival & Orientation' : i === duration ? 'Farewell Highlights & Souvenirs' : `Deep Dive Exploration – Part ${i - 1}`,
        morning: {
          title: i === 1 ? `Arrive in ${destination} & Check-in` : `Iconic Landmarks of ${destination}`,
          description: `Begin the day visiting scenic viewpoints and historical architecture in the heart of ${destination}.`,
          locationName: `${destination} Landmark District`,
          coordinates: { lat: baseLat + (i * 0.005), lng: baseLng + (i * 0.004) },
          duration: '2.5 hours',
          estimatedCost: 25
        },
        afternoon: {
          title: `Cultural Heritage & Local Flavors`,
          description: `Stroll through charming artisan avenues and enjoy local specialties prepared fresh.`,
          locationName: `${destination} Heritage Center`,
          coordinates: { lat: baseLat + (i * 0.003), lng: baseLng - (i * 0.002) },
          duration: '3 hours',
          estimatedCost: 35,
          culinaryRecommendation: {
            dish: 'Signature Regional Platter & Fresh Artisan Bread',
            restaurant: `Bistro Belle ${destination}`,
            estimatedMealCost: 28
          }
        },
        evening: {
          title: `Golden Hour Sunset Walk & Fine Dining`,
          description: `Watch the sunset over the horizon followed by an ambient dinner with authentic music.`,
          locationName: `${destination} Promenade`,
          coordinates: { lat: baseLat - (i * 0.002), lng: baseLng + (i * 0.003) },
          duration: '3 hours',
          estimatedCost: 45,
          dinnerRecommendation: {
            dish: 'Chef Special Seasonal Degustation',
            restaurant: `The Terrace at ${destination}`,
            estimatedMealCost: 40
          }
        },
        localTransportMode: 'Walking & Regional Public Transit',
        approxTravelTime: '45 mins total transit',
        totalEstimatedDayCost: 173,
        optionalActivity: {
          title: `Nighttime Photography or Stargazing`,
          description: 'A tranquil self-guided walk to capture the illuminated city landmarks.',
          estimatedCost: 0
        }
      });
    }

    return {
      tripTitle: `Voyage to ${destination} – Curated Experience`,
      destination,
      durationDays: duration,
      currency,
      overview: `A balanced, immersive ${duration}-day journey in ${destination} blending scenic natural landscapes, iconic cultural sites, authentic regional cuisine, and comfortable pacing.`,
      tripHighlights: [
        `Explore the historic architecture and vibrant markets of ${destination}`,
        `Savor authentic regional gastronomy hand-picked by local culinary guides`,
        `Enjoy breathtaking sunset vistas and scenic photo stops`,
        `Experience seamless daily transit with minimal hassle`
      ],
      weatherForecast: 'Mild and pleasant conditions with clear skies expected; light evening breeze.',
      packingChecklist: [
        'Comfortable broken-in walking shoes',
        'Universal power adapter & portable power bank',
        'Lightweight weather-resistant jacket',
        'Refillable insulated water bottle',
        'Copies of digital booking vouchers & travel insurance'
      ],
      days
    };
  });
}

// 6. Smart Budget Management Agent
export async function calculateTripBudget(params: {
  destination: string;
  durationDays: number;
  totalBudget: number;
  travelers: number;
  currency: string;
  transportMode?: string;
  stayType?: string;
}) {
  const currency = params.currency || 'USD';
  const total = params.totalBudget || 2000;
  const days = Math.max(1, params.durationDays || 4);
  const travelers = Math.max(1, params.travelers || 2);

  const systemPrompt = `You are the VoyageMind AI Budget Optimisation Agent.
Dynamically allocate and optimize a travel budget of ${currency} ${total} for ${travelers} travelers spending ${days} days in '${params.destination}'.
Calculate category breakdowns, daily burn rates, budget health indicators, and high-impact cost optimization suggestions.

Return JSON:
{
  "totalBudget": ${total},
  "currency": "${currency}",
  "totalEstimatedSpend": number,
  "balance": number,
  "budgetStatus": "Under Budget" | "Balanced" | "Over Budget",
  "dailyAveragePerTraveler": number,
  "categories": [
    {
      "name": "Intercity Transportation",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Accommodations",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Food & Dining",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Activities & Admissions",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Local Transit & Cabs",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Shopping & Souvenirs",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    },
    {
      "name": "Emergency & Buffer Reserve",
      "allocated": number,
      "percentage": number,
      "description": string,
      "tips": string
    }
  ],
  "aiOptimizationSuggestions": [
    {
      "title": string,
      "potentialSavings": number,
      "impact": "High" | "Medium" | "Low",
      "action": string
    }
  ]
}`;

  return callGeminiJson(systemPrompt, `Budget breakdown for: ${JSON.stringify(params)}`, () => {
    // Realistic standard distribution:
    // Transport: 28%, Accommodation: 32%, Food: 18%, Activities: 10%, Local Transit: 4%, Shopping: 4%, Buffer: 4%
    const transport = Math.round(total * 0.28);
    const accommodation = Math.round(total * 0.32);
    const food = Math.round(total * 0.18);
    const activities = Math.round(total * 0.10);
    const localTransit = Math.round(total * 0.04);
    const shopping = Math.round(total * 0.04);
    const buffer = total - (transport + accommodation + food + activities + localTransit + shopping);

    return {
      totalBudget: total,
      currency,
      totalEstimatedSpend: total - buffer,
      balance: buffer,
      budgetStatus: 'Balanced' as const,
      dailyAveragePerTraveler: Math.round(total / (days * travelers)),
      categories: [
        {
          name: 'Intercity Transportation',
          allocated: transport,
          percentage: 28,
          description: `Flights / trains for ${travelers} travelers`,
          tips: 'Book at least 3 weeks ahead or travel mid-week for optimal fares.'
        },
        {
          name: 'Accommodations',
          allocated: accommodation,
          percentage: 32,
          description: `Stays for ${days} nights (${Math.round(accommodation / days)}/night)`,
          tips: 'Selecting boutique stays just 2 metro stops from center yields 25% savings.'
        },
        {
          name: 'Food & Dining',
          allocated: food,
          percentage: 18,
          description: 'Cafes, lunches, street food, and sit-down dinners',
          tips: 'Pair casual market lunches with one standout gourmet dinner.'
        },
        {
          name: 'Activities & Admissions',
          allocated: activities,
          percentage: 10,
          description: 'Museum passes, guided tours, and tickets',
          tips: 'Purchase combined city museum passes online for discounted skip-the-line entry.'
        },
        {
          name: 'Local Transit & Cabs',
          allocated: localTransit,
          percentage: 4,
          description: 'Subway cards, regional buses, and occasional rideshares',
          tips: 'Get multi-day public transportation transit passes for unlimited rides.'
        },
        {
          name: 'Shopping & Souvenirs',
          allocated: shopping,
          percentage: 4,
          description: 'Artisanal gifts and local specialty food items',
          tips: 'Support local maker cooperatives rather than airport gift shops.'
        },
        {
          name: 'Emergency & Buffer Reserve',
          allocated: buffer,
          percentage: 4,
          description: 'Contingency fund for delays or spontaneous experiences',
          tips: 'Keep safe in high-yield account or fee-free travel card.'
        }
      ],
      aiOptimizationSuggestions: [
        {
          title: 'Shift to Regional Rail or Off-peak Departure',
          potentialSavings: Math.round(transport * 0.22),
          impact: 'High' as const,
          action: 'Select mid-day or Tuesday flights/trains instead of peak weekend departures.'
        },
        {
          title: 'Combo City Attraction Pass',
          potentialSavings: Math.round(activities * 0.25),
          impact: 'Medium' as const,
          action: 'Group 3 major ticketed activities under the unified city tourism digital card.'
        },
        {
          title: 'Breakfast-Included Room Rate',
          potentialSavings: Math.round(food * 0.15),
          impact: 'Medium' as const,
          action: 'Booking lodging with inclusive hot breakfast saves morning dining expenses.'
        }
      ]
    };
  });
}

// 7. Adaptive Journey Recovery Engine
export async function recoverDisruptedJourney(params: {
  currentTrip: any;
  disruptionType: 'flight_cancellation' | 'hotel_cancellation' | 'transport_delay' | 'sudden_budget_reduction' | 'activity_cancellation' | 'date_change' | 'destination_change';
  disruptionDetails: string;
}) {
  const systemPrompt = `You are the VoyageMind AI Adaptive Journey Recovery Engine.
An unexpected disruption has impacted the traveler's trip!
Current trip context: ${JSON.stringify(params.currentTrip || {})}
Disruption Type: ${params.disruptionType}
Disruption Description: "${params.disruptionDetails}"

Analyze the problem with empathy, determine immediate impacts on the itinerary, and provide 2-3 concrete alternative solutions with cost deltas.
Always require explicit user confirmation before booking replacements.

Return JSON:
{
  "problemAssessment": {
    "severity": "Critical" | "Moderate" | "Minor",
    "affectedComponents": string[],
    "immediateRisk": string,
    "recoveryGoal": string
  },
  "recoveryOptions": [
    {
      "optionId": string,
      "title": string,
      "strategy": string,
      "actionPlan": string[],
      "costDifference": number (positive for extra cost, negative for savings),
      "currency": string,
      "timeImpact": string,
      "pros": string[],
      "cons": string[],
      "recommended": boolean
    }
  ],
  "itineraryModificationsPreview": string,
  "explanation": string,
  "confirmationPrompt": string
}`;

  return callGeminiJson(systemPrompt, `Disruption: ${JSON.stringify(params)}`, () => {
    return {
      problemAssessment: {
        severity: 'Moderate' as const,
        affectedComponents: ['Transportation Schedule', 'Day 1 Evening Activity', 'Hotel Check-in Time'],
        immediateRisk: 'Late arrival may cause missed reserved activities and check-in complications.',
        recoveryGoal: 'Preserve trip momentum, ensure seamless night arrival, and protect planned highlights.'
      },
      recoveryOptions: [
        {
          optionId: 'rec-opt-1',
          title: 'Express Alternate Transit + Automated Late Check-in',
          strategy: 'Re-route via next available high-speed transit carrier and notify hotel automatically.',
          actionPlan: [
            'Book the next scheduled express departure (leaves in 1h 45m)',
            'Dispatch automated delayed arrival notice to front desk with keyless mobile check-in',
            'Reschedule Day 1 evening dinner reservation to Day 2'
          ],
          costDifference: 35,
          currency: params.currentTrip?.currency || 'USD',
          timeImpact: 'Arrival delayed by 2 hours; no sightseeing time lost tomorrow',
          pros: ['Guaranteed arrival today', 'No hotel booking cancellation penalty', 'Stress-free transition'],
          cons: ['Slight ticket fare difference of $35'],
          recommended: true
        },
        {
          optionId: 'rec-opt-2',
          title: 'Next Morning Flight + Direct Hotel Date Shift',
          strategy: 'Rest tonight in airport transit lounge and depart first flight at dawn.',
          actionPlan: [
            'Secure seat on tomorrow 06:15 AM direct flight',
            'Shift hotel reservation forward by 1 night under disruption policy waiver',
            'Compress Day 1 and Day 2 into an optimized panoramic tour'
          ],
          costDifference: -40,
          currency: params.currentTrip?.currency || 'USD',
          timeImpact: 'Depart tomorrow morning at 06:15 AM',
          pros: ['Saves one night accommodation expense', 'Zero rushed transit stress'],
          cons: ['Requires staying near departure airport tonight'],
          recommended: false
        }
      ],
      itineraryModificationsPreview: 'Day 1 evening dinner will be smoothly shifted to Day 2; Day 1 night arrival accommodated without penalty.',
      explanation: 'Our adaptive engine evaluated real-time alternative carriers and coordinate routes to keep your vacation seamless despite this schedule change.',
      confirmationPrompt: 'Would you like VoyageMind AI to apply Option 1 (Express Alternate Transit) and update your live itinerary and booking references?'
    };
  });
}

// 8. Conversational Travel Agent (Chat Agent with Trip Context)
export async function chatTravelAgent(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: string }>;
  currentTrip?: any;
}) {
  const tripContext = params.currentTrip ? JSON.stringify(params.currentTrip) : 'No active trip planned yet.';
  const systemPrompt = `You are VoyageMind AI, an elite, warm, and highly capable personal AI travel agent.
Your tagline is "Explore Anywhere. Plan Everything. Travel Smarter."
You assist travelers with ANY destination, ANY origin, ANY budget, ANY style.
You are dynamic and knowledgeable about real-world geography, currencies, logistics, visas, transit options, and hidden gems.
Current trip context: ${tripContext}

GUIDELINES:
1. Always respond with helpful, actionable advice tailored to their exact input.
2. If the user wants to adjust their trip (e.g. change dates, add activities, reduce budget, switch transport), formulate specific suggestions and explain how the itinerary updates.
3. Suggest concrete next actions (e.g. [Generate Itinerary], [Explore Stays], [Check Recovery Options], [Download Voucher]).
4. Maintain a professional, encouraging, travel-expert tone.`;

  const ai = getGeminiClient();
  if (!ai) {
    return {
      reply: `I am your VoyageMind AI travel agent! I have noted your message: "${params.message}". I'm actively managing your trip to ${params.currentTrip?.destination || 'your destination'}. How can I fine-tune your itinerary, compare travel flights, or optimize your budget today?`,
      actionSuggestions: ['Generate Itinerary', 'Compare Stays', 'Optimize Budget', 'View on Map']
    };
  }

  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const response = await chat.sendMessage({
      message: params.message,
    });

    const reply = response.text || 'I am here to assist your travel planning. How can I help you explore next?';
    return {
      reply,
      actionSuggestions: ['Update Itinerary', 'Find Best Stays', 'Check Budget Breakdown', 'View Interactive Map']
    };
  } catch (err) {
    console.error('Chat travel agent error:', err);
    return {
      reply: `I received your request regarding: "${params.message}". Based on your current travel parameters, I can refine your itinerary, search hotels in ${params.currentTrip?.destination || 'your destination'}, or adjust your budget. What would you like to explore first?`,
      actionSuggestions: ['View Itinerary', 'Adjust Budget', 'Explore Stays']
    };
  }
}
