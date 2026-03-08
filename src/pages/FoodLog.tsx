import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Search, X, Apple, Coffee, UtensilsCrossed, Moon } from "lucide-react";
import MacroBar from "@/components/dashboard/MacroBar";

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

interface FoodDBEntry {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  defaultServing: number;
  unit: string;
}

const FOOD_DB: FoodDBEntry[] = [
  { name: "Rice (cooked)", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, defaultServing: 150, unit: "g" },
  { name: "Chicken Breast", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, defaultServing: 150, unit: "g" },
  { name: "Egg", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, fiberPer100g: 0, defaultServing: 50, unit: "g" },
  { name: "Banana", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6, defaultServing: 120, unit: "g" },
  { name: "Apple", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4, defaultServing: 180, unit: "g" },
  { name: "Oatmeal", caloriesPer100g: 68, proteinPer100g: 2.4, carbsPer100g: 12, fatPer100g: 1.4, fiberPer100g: 1.7, defaultServing: 250, unit: "g" },
  { name: "Greek Yogurt", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.7, fiberPer100g: 0, defaultServing: 170, unit: "g" },
  { name: "Bread (whole wheat)", caloriesPer100g: 247, proteinPer100g: 13, carbsPer100g: 41, fatPer100g: 3.4, fiberPer100g: 7, defaultServing: 30, unit: "g" },
  { name: "Milk", caloriesPer100g: 42, proteinPer100g: 3.4, carbsPer100g: 5, fatPer100g: 1, fiberPer100g: 0, defaultServing: 250, unit: "ml" },
  { name: "Salmon", caloriesPer100g: 208, proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, fiberPer100g: 0, defaultServing: 150, unit: "g" },
  { name: "Pasta (cooked)", caloriesPer100g: 131, proteinPer100g: 5, carbsPer100g: 25, fatPer100g: 1.1, fiberPer100g: 1.8, defaultServing: 200, unit: "g" },
  { name: "Potato (boiled)", caloriesPer100g: 87, proteinPer100g: 1.9, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 1.8, defaultServing: 150, unit: "g" },
  { name: "Avocado", caloriesPer100g: 160, proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, fiberPer100g: 7, defaultServing: 100, unit: "g" },
  { name: "Peanut Butter", caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6, defaultServing: 32, unit: "g" },
  { name: "Cheese (cheddar)", caloriesPer100g: 403, proteinPer100g: 25, carbsPer100g: 1.3, fatPer100g: 33, fiberPer100g: 0, defaultServing: 30, unit: "g" },
  { name: "Broccoli", caloriesPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, fiberPer100g: 2.6, defaultServing: 100, unit: "g" },
  { name: "Sweet Potato", caloriesPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20, fatPer100g: 0.1, fiberPer100g: 3, defaultServing: 150, unit: "g" },
  { name: "Tuna (canned)", caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 0.8, fiberPer100g: 0, defaultServing: 100, unit: "g" },
  { name: "Lentils (cooked)", caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 8, defaultServing: 150, unit: "g" },
  { name: "Almonds", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12, defaultServing: 30, unit: "g" },
  { name: "Chapati / Roti", caloriesPer100g: 297, proteinPer100g: 9, carbsPer100g: 50, fatPer100g: 7, fiberPer100g: 4, defaultServing: 40, unit: "g" },
  { name: "Dal (cooked)", caloriesPer100g: 104, proteinPer100g: 7, carbsPer100g: 18, fatPer100g: 0.4, fiberPer100g: 5, defaultServing: 150, unit: "g" },
  { name: "Paneer", caloriesPer100g: 265, proteinPer100g: 18, carbsPer100g: 1.2, fatPer100g: 21, fiberPer100g: 0, defaultServing: 100, unit: "g" },
  { name: "Tofu", caloriesPer100g: 76, proteinPer100g: 8, carbsPer100g: 1.9, fatPer100g: 4.8, fiberPer100g: 0.3, defaultServing: 100, unit: "g" },
  { name: "Coffee (black)", caloriesPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0, defaultServing: 250, unit: "ml" },
];

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 - 10:00 AM" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, time: "12:00 - 2:00 PM" },
  { key: "snack", label: "Snack", icon: Apple, time: "3:00 - 5:00 PM" },
  { key: "dinner", label: "Dinner", icon: Moon, time: "6:00 - 9:00 PM" },
];

function calcNutrition(food: FoodDBEntry, qty: number) {
  const factor = qty / 100;
  return {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round(food.fiberPer100g * factor * 10) / 10,
  };
}

const FoodLog = () => {
  const [foods, setFoods] = useState<FoodEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");

  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);

  // Auto-match typed food name to DB for nutrition lookup
  const matchedFood = useMemo(() => {
    if (!foodName.trim()) return null;
    const lower = foodName.toLowerCase();
    return FOOD_DB.find((f) => f.name.toLowerCase().includes(lower) || lower.includes(f.name.toLowerCase())) || null;
  }, [foodName]);

  const preview = useMemo(() => {
    if (!matchedFood) return null;
    const qty = parseFloat(quantity) || matchedFood.defaultServing;
    return calcNutrition(matchedFood, qty);
  }, [matchedFood, quantity]);

  const addFood = () => {
    if (!foodName.trim()) return;
    const qty = parseFloat(quantity) || matchedFood?.defaultServing || 100;
    const nutrition = matchedFood ? calcNutrition(matchedFood, qty) : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: foodName.trim(),
      quantity: qty,
      unit: matchedFood?.unit || "g",
      ...nutrition,
      meal: selectedMeal,
    };
    setFoods([...foods, entry]);
    setFoodName("");
    setQuantity("");
    setShowAdd(false);
  };

  const removeFood = (id: string) => setFoods(foods.filter((f) => f.id !== id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Food Log</h1>
        <p className="text-sm text-muted-foreground font-body">{totalCalories} kcal today</p>
      </motion.div>

      <div className="flex gap-3">
        <div className="flex-1 glass-card flex items-center px-4 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logged foods..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-3 font-body"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center glow-primary"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
        <button className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center">
          <Camera className="w-5 h-5 text-primary" />
        </button>
      </div>

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
              <span className="text-sm font-semibold text-foreground font-display">{mealCals} kcal</span>
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
            onClick={() => { setShowAdd(false); setFoodName(""); setQuantity(""); }}
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
                <h2 className="text-lg font-bold font-display text-foreground">Add Food</h2>
                <button onClick={() => { setShowAdd(false); setFoodName(""); setQuantity(""); }}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Meal selector */}
              <div className="flex gap-2">
                {MEALS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMeal(m.key)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium font-body transition-colors ${
                      selectedMeal === m.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Food name input */}
              <input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Enter food name (e.g. Rice, Chicken)"
                autoFocus
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              {/* Quantity input */}
              <div className="flex items-center gap-3">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  type="number"
                  placeholder={`Quantity (${matchedFood ? matchedFood.defaultServing + matchedFood.unit : "g"})`}
                  className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <span className="text-sm text-muted-foreground font-body min-w-[20px]">{matchedFood?.unit || "g"}</span>
              </div>

              {/* Nutrition preview */}
              {matchedFood && preview && (
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground font-body mb-2">
                    Matched: <span className="text-foreground font-medium">{matchedFood.name}</span>
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "Cal", value: preview.calories, unit: "" },
                      { label: "Protein", value: preview.protein, unit: "g" },
                      { label: "Carbs", value: preview.carbs, unit: "g" },
                      { label: "Fat", value: preview.fat, unit: "g" },
                      { label: "Fiber", value: preview.fiber, unit: "g" },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className="text-xs text-muted-foreground font-body">{m.label}</p>
                        <p className="text-sm font-semibold text-foreground font-display">{m.value}{m.unit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!matchedFood && foodName.trim() && (
                <p className="text-xs text-muted-foreground font-body text-center">
                  Food not in database — will be logged without nutrition data
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
