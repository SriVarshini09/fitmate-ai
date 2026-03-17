/**
 * Natural Language Parser for voice-logged fitness data
 * Parses food, water, and workout commands from speech transcripts
 */

export type ParsedType = 'food' | 'water' | 'workout' | 'unknown';

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  confidence: number;
}

export interface VoiceParsedData {
  type: ParsedType;
  confidence: number;
  rawTranscript: string;
  // Food
  foodItems?: FoodItem[];
  meal?: string;
  // Water
  waterAmount?: number; // in ml
  // Workout
  workoutActivity?: string;
}

// ── Unit conversions to ml ──
const WATER_UNIT_TO_ML: Record<string, number> = {
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  'litre': 1000,
  'litres': 1000,
  'cup': 240,
  'cups': 240,
  'glass': 250,
  'glasses': 250,
  'bottle': 500,
  'bottles': 500,
};

// ── Unit normalizer ──
function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    'gram': 'g', 'grams': 'g', 'gm': 'g', 'gms': 'g',
    'kilogram': 'kg', 'kilograms': 'kg',
    'milliliter': 'ml', 'milliliters': 'ml',
    'liter': 'l', 'liters': 'l', 'litre': 'l', 'litres': 'l',
    'cup': 'cup', 'cups': 'cup',
    'tablespoon': 'tbsp', 'tablespoons': 'tbsp',
    'teaspoon': 'tsp', 'teaspoons': 'tsp',
    'piece': 'pcs', 'pieces': 'pcs', 'pcs': 'pcs', 'pc': 'pcs',
    'slice': 'pcs', 'slices': 'pcs',
    'scoop': 'pcs', 'scoops': 'pcs',
    'bowl': 'cup', 'bowls': 'cup',
    'plate': 'pcs', 'plates': 'pcs',
    'serving': 'pcs', 'servings': 'pcs',
  };
  return map[unit.toLowerCase()] || unit.toLowerCase();
}

// ── Workout activity normalizer ──
function normalizeActivity(raw: string): string {
  const map: Record<string, string> = {
    'run': 'running', 'running': 'running', 'jog': 'running', 'jogging': 'running',
    'walk': 'walking', 'walking': 'walking',
    'cycle': 'cycling', 'cycling': 'cycling', 'bike': 'cycling', 'biking': 'cycling', 'ride': 'cycling', 'riding': 'cycling',
    'swim': 'swimming', 'swimming': 'swimming', 'pool': 'swimming',
    'hike': 'hiking', 'hiking': 'hiking', 'trek': 'hiking', 'trekking': 'hiking',
    'interval': 'intervals', 'intervals': 'intervals', 'hiit': 'intervals',
    'strength': 'strength', 'weights': 'strength', 'gym': 'strength', 'lifting': 'strength',
  };
  return map[raw.toLowerCase()] || raw.toLowerCase();
}

// ── Meal time detection ──
function detectMeal(transcript: string): string {
  const t = transcript.toLowerCase();
  if (t.includes('breakfast') || t.includes('morning')) return 'breakfast';
  if (t.includes('lunch') || t.includes('noon') || t.includes('midday')) return 'lunch';
  if (t.includes('dinner') || t.includes('supper') || t.includes('evening')) return 'dinner';
  if (t.includes('snack')) return 'snack';

  // Auto-detect by time
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 17) return 'snack';
  return 'dinner';
}

// ── Number word to digit ──
function wordToNumber(word: string): number | null {
  const map: Record<string, number> = {
    'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'half': 0.5, 'quarter': 0.25, 'couple': 2, 'few': 3,
  };
  return map[word.toLowerCase()] ?? null;
}

function parseNumber(raw: string): number {
  const num = parseFloat(raw);
  if (!isNaN(num)) return num;
  const word = wordToNumber(raw);
  return word ?? 1;
}

// ── Parse food items from transcript ──
function parseFoodItems(transcript: string): FoodItem[] {
  const items: FoodItem[] = [];
  const text = transcript.toLowerCase()
    .replace(/\bfor (breakfast|lunch|dinner|snack)\b/gi, '')
    .replace(/\b(log|add|ate|eaten|had|eat|i had|i ate|record)\b/gi, '')
    .trim();

  // Split by conjunctions to handle multiple items
  const segments = text.split(/\band\b|\bwith\b|,/);

  for (const segment of segments) {
    const s = segment.trim();
    if (!s) continue;

    let matched = false;

    // Pattern 1: "200g chicken breast" or "200 grams chicken"
    const p1 = s.match(/^(\d+\.?\d*)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|pcs|gram|grams|slice|slices|piece|pieces|bowl|bowls|scoop|scoops|serving|servings)\s+(?:of\s+)?(.+)$/i);
    if (p1) {
      items.push({ name: p1[3].trim(), quantity: parseFloat(p1[1]), unit: normalizeUnit(p1[2]), confidence: 0.95 });
      matched = true;
    }

    // Pattern 2: "chicken breast 200g" or "chicken breast 200 grams"
    if (!matched) {
      const p2 = s.match(/^(.+?)\s+(\d+\.?\d*)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|pcs|gram|grams|slice|slices|piece|pieces|bowl|bowls|scoop|scoops|serving|servings)$/i);
      if (p2) {
        items.push({ name: p2[1].trim(), quantity: parseFloat(p2[2]), unit: normalizeUnit(p2[3]), confidence: 0.95 });
        matched = true;
      }
    }

    // Pattern 3: "2 eggs" or "three bananas" (count items)
    if (!matched) {
      const p3 = s.match(/^(a|an|one|two|three|four|five|six|seven|eight|nine|ten|half|couple|\d+\.?\d*)\s+(?:of\s+)?(.+)$/i);
      if (p3) {
        const qty = parseNumber(p3[1]);
        const name = p3[2].trim().replace(/^(the|a|an)\s+/i, '');
        // Exclude water words
        if (!['glass', 'glasses', 'cup', 'cups', 'bottle', 'bottles', 'liter', 'liters'].includes(name)) {
          items.push({ name, quantity: qty, unit: 'pcs', confidence: 0.85 });
          matched = true;
        }
      }
    }

    // Pattern 4: bare food item (no quantity) - assume 1 serving
    if (!matched && s.length > 2) {
      const name = s.replace(/^(the|a|an)\s+/i, '').trim();
      if (name.length > 2 && !name.match(/^\d/)) {
        items.push({ name, quantity: 1, unit: 'pcs', confidence: 0.6 });
      }
    }
  }

  return items;
}

// ── Parse water amount from transcript ──
function parseWater(transcript: string): number | null {
  const t = transcript.toLowerCase();

  // Pattern: "3 glasses" / "500ml" / "2 cups" / "1.5 liters"
  const patterns = [
    /(\d+\.?\d*)\s*(ml|milliliters?|l|liters?|litres?|glass(?:es)?|cup(?:s)?|bottle(?:s)?)/i,
    /(one|two|three|four|five|six|seven|eight|nine|ten|a|an)\s+(glass(?:es)?|cup(?:s)?|bottle(?:s)?|liter(?:s)?|litre(?:s)?)/i,
  ];

  for (const pattern of patterns) {
    const match = t.match(pattern);
    if (match) {
      const qty = parseNumber(match[1]);
      const unit = match[2].toLowerCase().replace(/s$/, ''); // remove plural
      const unitKey = match[2].toLowerCase();
      // Find ml conversion
      const mlPer = WATER_UNIT_TO_ML[unitKey] || WATER_UNIT_TO_ML[unit] || 250;
      return Math.round(qty * mlPer);
    }
  }

  return null;
}

// ── Parse workout activity from transcript ──
function parseWorkout(transcript: string): string | null {
  const t = transcript.toLowerCase();

  const activities = ['running', 'run', 'jogging', 'jog', 'walking', 'walk', 'cycling', 'cycle', 'biking', 'bike', 'ride', 'riding', 'swimming', 'swim', 'hiking', 'hike', 'trekking', 'intervals', 'hiit', 'strength', 'weights', 'gym', 'lifting', 'workout'];

  for (const activity of activities) {
    if (t.includes(activity)) {
      return normalizeActivity(activity);
    }
  }

  return null;
}

// ── Detect command type ──
function detectType(transcript: string): ParsedType {
  const t = transcript.toLowerCase();

  const workoutTriggers = ['start', 'begin', 'launch', 'open', 'workout', 'exercise', 'session', 'training'];
  const waterTriggers = ['water', 'drink', 'drinking', 'drank', 'glass', 'glasses', 'bottle', 'hydrat'];
  const foodTriggers = ['log', 'add', 'ate', 'eaten', 'had', 'eat', 'record', 'track', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'snack'];

  const hasWorkoutTrigger = workoutTriggers.some(w => t.includes(w));
  const hasWaterTrigger = waterTriggers.some(w => t.includes(w));
  const hasFoodTrigger = foodTriggers.some(w => t.includes(w));

  const hasWorkoutActivity = parseWorkout(transcript) !== null;
  const hasWaterAmount = parseWater(transcript) !== null;

  if (hasWorkoutTrigger && hasWorkoutActivity && !hasWaterTrigger && !hasFoodTrigger) return 'workout';
  if (hasWaterTrigger && hasWaterAmount) return 'water';
  if (hasFoodTrigger || (!hasWaterTrigger && !hasWorkoutTrigger)) return 'food';
  if (hasWaterAmount) return 'water';
  if (hasWorkoutActivity) return 'workout';

  return 'food'; // default to food
}

// ── Main parser ──
export function parseVoiceCommand(transcript: string): VoiceParsedData {
  const type = detectType(transcript);

  if (type === 'water') {
    const ml = parseWater(transcript);
    return {
      type: 'water',
      confidence: ml ? 0.9 : 0.5,
      rawTranscript: transcript,
      waterAmount: ml ?? 250,
    };
  }

  if (type === 'workout') {
    const activity = parseWorkout(transcript);
    return {
      type: 'workout',
      confidence: activity ? 0.9 : 0.5,
      rawTranscript: transcript,
      workoutActivity: activity ?? 'running',
    };
  }

  // Food
  const foodItems = parseFoodItems(transcript);
  const meal = detectMeal(transcript);
  return {
    type: 'food',
    confidence: foodItems.length > 0 ? 0.85 : 0.4,
    rawTranscript: transcript,
    foodItems: foodItems.length > 0 ? foodItems : [{ name: transcript.replace(/^(log|add|ate|had|eat)\s+/i, '').trim(), quantity: 1, unit: 'pcs', confidence: 0.4 }],
    meal,
  };
}
