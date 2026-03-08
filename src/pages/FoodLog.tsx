import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Search, X, Apple, Coffee, UtensilsCrossed, Moon } from "lucide-react";
import MacroBar from "@/components/dashboard/MacroBar";

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  meal: string;
}

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 - 10:00 AM" },
  { key: "lunch", label: "Lunch", icon: UtensilsCrossed, time: "12:00 - 2:00 PM" },
  { key: "snack", label: "Snack", icon: Apple, time: "3:00 - 5:00 PM" },
  { key: "dinner", label: "Dinner", icon: Moon, time: "6:00 - 9:00 PM" },
];

const sampleFoods: FoodEntry[] = [
  { id: "1", name: "Oatmeal with Banana", calories: 320, protein: 12, carbs: 58, fat: 6, fiber: 5, meal: "breakfast" },
  { id: "2", name: "Greek Yogurt", calories: 150, protein: 15, carbs: 12, fat: 4, fiber: 0, meal: "breakfast" },
  { id: "3", name: "Grilled Chicken Salad", calories: 420, protein: 38, carbs: 15, fat: 22, fiber: 4, meal: "lunch" },
];

const FoodLog = () => {
  const [foods, setFoods] = useState<FoodEntry[]>(sampleFoods);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [newFood, setNewFood] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });

  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);

  const addFood = () => {
    if (!newFood.name || !newFood.calories) return;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: newFood.name,
      calories: parseInt(newFood.calories) || 0,
      protein: parseInt(newFood.protein) || 0,
      carbs: parseInt(newFood.carbs) || 0,
      fat: parseInt(newFood.fat) || 0,
      meal: selectedMeal,
    };
    setFoods([...foods, entry]);
    setNewFood({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setShowAdd(false);
  };

  const removeFood = (id: string) => setFoods(foods.filter((f) => f.id !== id));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Food Log</h1>
        <p className="text-sm text-muted-foreground font-body">{totalCalories} kcal today</p>
      </motion.div>

      {/* Search & Add */}
      <div className="flex gap-3">
        <div className="flex-1 glass-card flex items-center px-4 gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search foods..."
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

      {/* Meals */}
      {MEALS.map((meal) => {
        const mealFoods = foods.filter((f) => f.meal === meal.key);
        const mealCals = mealFoods.reduce((s, f) => s + f.calories, 0);
        return (
          <motion.div
            key={meal.key}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
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
                        P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
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
          >
            <motion.div
              className="w-full max-w-lg glass-card-strong p-6 rounded-t-3xl space-y-4"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-display text-foreground">Add Food</h2>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
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

              <input
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                placeholder="Food name"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              <div className="grid grid-cols-2 gap-3">
                {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                  <input
                    key={field}
                    value={newFood[field]}
                    onChange={(e) => setNewFood({ ...newFood, [field]: e.target.value })}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === "calories" ? " (kcal)" : " (g)")}
                    type="number"
                    className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                  />
                ))}
              </div>

              <button
                onClick={addFood}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary"
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
