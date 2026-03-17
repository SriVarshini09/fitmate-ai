import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, X, Apple, Coffee, UtensilsCrossed, Moon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCalorieTracker } from "@/hooks/useCalorieTracker";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Built-in nutrition table per 100g: [kcal, protein, carbs, fat, fiber]
const NUTRITION_TABLE: Record<string, [number, number, number, number, number]> = {
  "rice": [130, 2.7, 28, 0.3, 0.4],
  "white rice": [130, 2.7, 28, 0.3, 0.4],
  "brown rice": [123, 2.6, 26, 1.0, 1.8],
  "ragi": [336, 7.3, 72, 1.9, 3.6],
  "ragi malt": [330, 7.0, 71, 1.8, 3.5],
  "idli": [58, 2, 11.5, 0.4, 0.5],
  "idly": [58, 2, 11.5, 0.4, 0.5],
  "dosa": [168, 3.5, 28, 5, 0.8],
  "sambar": [56, 3.5, 8, 1.5, 2.5],
  "chapati": [297, 9.2, 55, 3.9, 4.6],
  "roti": [297, 9.2, 55, 3.9, 4.6],
  "dal": [116, 9, 20, 0.4, 7.9],
  "lentils": [116, 9, 20, 0.4, 7.9],
  "paneer": [265, 18, 3.4, 20, 0],
  "curd": [98, 3.5, 3.4, 4.3, 0],
  "yogurt": [98, 3.5, 3.4, 4.3, 0],
  "oats": [389, 17, 66, 7, 10.6],
  "egg": [155, 13, 1.1, 11, 0],
  "chicken breast": [165, 31, 0, 3.6, 0],
  "chicken": [165, 31, 0, 3.6, 0],
  "banana": [89, 1.1, 23, 0.3, 2.6],
  "apple": [52, 0.3, 14, 0.2, 2.4],
  "milk": [61, 3.2, 4.8, 3.3, 0],
  "bread": [265, 9, 49, 3.2, 2.7],
  "potato": [77, 2, 17, 0.1, 2.2],
  "almonds": [579, 21, 22, 50, 12.5],
  "peanut butter": [588, 25, 20, 50, 6],
  "pasta": [158, 5.8, 31, 0.9, 1.8],
  "salmon": [208, 20, 0, 13, 0],
  "tuna": [132, 29, 0, 1, 0],
  "broccoli": [34, 2.8, 7, 0.4, 2.6],
  "spinach": [23, 2.9, 3.6, 0.4, 2.2],
  "mango": [60, 0.8, 15, 0.4, 1.6],
  "orange": [47, 0.9, 12, 0.1, 2.4],
  "coffee": [2, 0.3, 0, 0, 0],
  "tea": [1, 0, 0.2, 0, 0],
};

function unitToGrams(qty: number, unit: string): number {
  switch (unit) {
    case "g": return qty;
    case "ml": return qty;
    case "L": return qty * 1000;
    case "cup": return qty * 240;
    case "tbsp": return qty * 15;
    case "tsp": return qty * 5;
    case "pcs": return qty * 100;
    default: return qty;
  }
}

function lookupFallback(name: string, qty: number, unit: string): NutritionResult | null {
  const key = name.toLowerCase().trim();
  const grams = unitToGrams(qty, unit);
  let row = NUTRITION_TABLE[key];
  if (!row) {
    const found = Object.keys(NUTRITION_TABLE).find(k => key.includes(k) || k.includes(key));
    if (found) row = NUTRITION_TABLE[found];
  }
  if (!row) return null;
  const f = grams / 100;
  return {
    name,
    calories: Math.round(row[0] * f),
    protein: Math.round(row[1] * f * 10) / 10,
    carbs: Math.round(row[2] * f * 10) / 10,
    fat: Math.round(row[3] * f * 10) / 10,
    fiber: Math.round(row[4] * f * 10) / 10,
    servingDescription: `${qty}${unit} (~${Math.round(grams)}g) — estimated`,
  };
}

interface FoodEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal: string;
}

interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingDescription: string;
}

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 - 10:00 AM" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, time: "12:00 - 2:00 PM" },
  { key: "snack", label: "Snack", icon: Apple, time: "3:00 - 5:00 PM" },
  { key: "dinner", label: "Dinner", icon: Moon, time: "6:00 - 9:00 PM" },
];

const UNITS = ["g", "ml", "L", "pcs", "cup", "tbsp", "tsp"] as const;
const FOODS_KEY = "Cals Crumble Fit_foods";
const EATEN_KEY = "Cals Crumble Fit_eaten";

function todayISO() { return new Date().toISOString().slice(0, 10); }

const FoodLog = () => {
  const { logEaten, profile } = useCalorieTracker();
  const { user } = useAuth();
  const [foods, setFoods] = useState<FoodEntry[]>(() => {
    try {
      const raw = localStorage.getItem(FOODS_KEY);
      if (!raw) return [];
      const all = JSON.parse(raw) as (FoodEntry & { date: string })[];
      return all.filter((f) => f.date === todayISO());
    } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("g");

  // AI lookup state
  const [aiResult, setAiResult] = useState<NutritionResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = foods.reduce((s, f) => s + f.carbs, 0);
  const totalFat = foods.reduce((s, f) => s + f.fat, 0);
  const totalFiber = foods.reduce((s, f) => s + f.fiber, 0);

  const goals = profile?.macros ?? { protein: 92, carbs: 92, fat: 35, fiber: 25 };

  // Load today's food from Supabase on mount
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const today = todayISO();
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => setLoading(false), 3000);
    
    (async () => {
      try {
        const { data, error } = await supabase
          .from("food_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("logged_date", today)
          .order("created_at", { ascending: true });
        
        clearTimeout(timeout);
        if (error) { console.error(error); setLoading(false); return; }
        if (data && data.length > 0) {
          const mapped: FoodEntry[] = data.map((r) => ({
            id: r.id,
            name: r.name,
            quantity: r.quantity,
            unit: r.unit,
            calories: r.calories,
            protein: r.protein,
            carbs: r.carbs,
            fat: r.fat,
            fiber: r.fiber,
            meal: r.meal,
          }));
          setFoods(mapped);
          saveAndSync(mapped);
        }
        setLoading(false);
      } catch (err) {
        clearTimeout(timeout);
        console.error(err);
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Nutrition lookup: built-in table first, then generic estimate
  const lookupNutrition = useCallback((name: string, qty: string, unit: string) => {
    if (!name.trim() || name.trim().length < 2) {
      setAiResult(null);
      return;
    }
    const parsedQty = parseFloat(qty) || 100;
    const grams = unitToGrams(parsedQty, unit);

    // 1. Built-in table
    const fallback = lookupFallback(name, parsedQty, unit);
    if (fallback) {
      setAiResult(fallback);
      return;
    }

    // 2. Generic estimate: 2 kcal/g
    setAiResult({
      name,
      calories: Math.round(grams * 2),
      protein: Math.round(grams * 0.05 * 10) / 10,
      carbs: Math.round(grams * 0.25 * 10) / 10,
      fat: Math.round(grams * 0.05 * 10) / 10,
      fiber: 0,
      servingDescription: `${parsedQty}${unit} — rough estimate`,
    });
  }, []);

  // Debounce the AI lookup when food name, quantity, or unit changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!showAdd) return;

    debounceRef.current = setTimeout(() => {
      lookupNutrition(foodName, quantity, selectedUnit);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [foodName, quantity, selectedUnit, showAdd, lookupNutrition]);

  const saveAndSync = useCallback((updated: FoodEntry[]) => {
    const today = todayISO();
    // Persist today's foods
    try {
      const raw = localStorage.getItem(FOODS_KEY);
      const all: (FoodEntry & { date: string })[] = raw ? JSON.parse(raw) : [];
      const otherDays = all.filter((f) => f.date !== today);
      const withDate = updated.map((f) => ({ ...f, date: today }));
      localStorage.setItem(FOODS_KEY, JSON.stringify([...otherDays, ...withDate]));
    } catch {}
    // Sync total calories eaten today
    try {
      const total = updated.reduce((s, f) => s + f.calories, 0);
      const eatenRaw = localStorage.getItem(EATEN_KEY);
      const eatenData = eatenRaw ? JSON.parse(eatenRaw) : {};
      eatenData[today] = total;
      localStorage.setItem(EATEN_KEY, JSON.stringify(eatenData));
    } catch {}
  }, []);

  const addFood = async () => {
    if (!foodName.trim()) return;
    const qty = parseFloat(quantity) || 1;
    const nutrition = aiResult || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const today = todayISO();

    // Optimistic local update
    const tempId = Date.now().toString();
    const entry: FoodEntry = {
      id: tempId,
      name: aiResult?.name || foodName.trim(),
      quantity: qty,
      unit: selectedUnit,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      meal: selectedMeal,
    };
    const updated = [...foods, entry];
    setFoods(updated);
    saveAndSync(updated);
    if (nutrition.calories > 0) logEaten(0);
    setFoodName("");
    setQuantity("");
    setSelectedUnit("g");
    setAiResult(null);
    setShowAdd(false);
    toast.success(`Added ${entry.name} — ${entry.calories} kcal`);

    // Persist to Supabase
    if (user) {
      const { data, error } = await supabase.from("food_logs").insert({
        user_id: user.id,
        name: entry.name,
        meal: entry.meal,
        quantity: entry.quantity,
        unit: entry.unit,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        fiber: entry.fiber,
        logged_date: today,
      }).select().single();
      if (!error && data) {
        // Replace temp id with real UUID
        setFoods((prev) => {
          const real = prev.map((f) => f.id === tempId ? { ...f, id: data.id } : f);
          saveAndSync(real);
          return real;
        });
      }
    }
  };

  const removeFood = async (id: string) => {
    const updated = foods.filter((f) => f.id !== id);
    setFoods(updated);
    saveAndSync(updated);
    if (user) {
      await supabase.from("food_logs").delete().eq("id", id).eq("user_id", user.id);
    }
  };

  const closeModal = () => {
    setShowAdd(false);
    setFoodName("");
    setQuantity("");
    setAiResult(null);
  };

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
      <div className="h-8 w-40 bg-secondary rounded-xl animate-pulse" />
      {[1,2,3].map((i) => <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Food Log</h1>
        <p className="text-sm text-muted-foreground font-body">{totalCalories} kcal today</p>
      </motion.div>

      {/* Macros Summary Card */}
      <motion.div 
        className="glass-card p-5"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-sm font-semibold font-display text-foreground mb-4">Macros</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Protein", value: totalProtein, goal: goals.protein, color: "bg-success" },
            { label: "Carbs", value: totalCarbs, goal: goals.carbs, color: "bg-info" },
            { label: "Fat", value: totalFat, goal: goals.fat, color: "bg-warning" },
            { label: "Fiber", value: totalFiber, goal: goals.fiber, color: "bg-success" },
          ].map((macro) => {
            const percent = Math.min((macro.value / macro.goal) * 100, 100);
            return (
              <div key={macro.label}>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-xs text-muted-foreground font-body">{macro.label}</span>
                  <span className="text-sm font-bold text-foreground font-display ml-auto">
                    {Math.round(macro.value)}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">/{macro.goal}g</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${macro.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>


      {MEALS.map((meal) => {
        const mealFoods = foods.filter((f) => f.meal === meal.key && (!searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())));
        const mealCals = mealFoods.reduce((s, f) => s + f.calories, 0);
        return (
          <motion.div key={meal.key} className="glass-card p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <meal.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">{meal.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{meal.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground font-display">{mealCals} kcal</span>
                <button
                  onClick={() => { setSelectedMeal(meal.key); setShowAdd(true); }}
                  className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
                <button className="w-8 h-8 rounded-xl bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors">
                  <Camera className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>
            {mealFoods.length > 0 ? (
              <div className="space-y-2">
                {mealFoods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground font-body">{food.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {food.quantity}{food.unit} · P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground font-display">{food.calories}</span>
                      <button onClick={() => removeFood(food.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 font-body">No foods logged</p>
            )}
          </motion.div>
        );
      })}

      {/* Add Food Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">
                  Add to {MEALS.find((m) => m.key === selectedMeal)?.label}
                </h2>
                <button onClick={closeModal}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Food name input */}
              <input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Type any food, dish, or drink..."
                autoFocus
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              {/* Quantity + unit */}
              <div className="flex items-center gap-2">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  placeholder="Qty"
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <div className="flex gap-1.5 overflow-x-auto">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUnit(u)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium font-body whitespace-nowrap transition-colors ${
                        selectedUnit === u ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Nutrition Preview */}
              {aiResult && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-body">
                      AI Match: <span className="text-foreground font-medium">{aiResult.name}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground font-body">{aiResult.servingDescription}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Cal", value: aiResult.calories, unit: "" },
                      { label: "Protein", value: aiResult.protein, unit: "g" },
                      { label: "Carbs", value: aiResult.carbs, unit: "g" },
                      { label: "Fat", value: aiResult.fat, unit: "g" },
                      { label: "Fiber", value: aiResult.fiber, unit: "g" },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-muted-foreground font-body">{m.label}</p>
                        <p className="text-sm font-semibold text-foreground font-display">{m.value}{m.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!aiResult && foodName.trim().length >= 2 && (
                <p className="text-xs text-muted-foreground font-body text-center">
                  Searching nutrition database...
                </p>
              )}

              <button
                onClick={addFood}
                disabled={!foodName.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-50"
              >
                Add to {MEALS.find((m) => m.key === selectedMeal)?.label}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FoodLog;
