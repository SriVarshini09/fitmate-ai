import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, X, ChevronLeft, ChevronRight, UtensilsCrossed, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

interface PlannedMeal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}

type WeekPlan = Record<string, Record<string, PlannedMeal[]>>;

const defaultWeek: WeekPlan = Object.fromEntries(
  DAYS.map((d) => [d, Object.fromEntries(MEALS.map((m) => [m, []]))])
);


const WeeklyPlanner = () => {
  const [weekPlan, setWeekPlan] = useState<WeekPlan>(defaultWeek);
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [addMealType, setAddMealType] = useState<string>("Breakfast");
  const [newMeal, setNewMeal] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const dayIndex = DAYS.indexOf(selectedDay);

  const navigateDay = (dir: -1 | 1) => {
    const next = (dayIndex + dir + 7) % 7;
    setSelectedDay(DAYS[next]);
  };

  const dayTotal = MEALS.reduce((sum, meal) => {
    return sum + (weekPlan[selectedDay]?.[meal]?.reduce((s, f) => s + f.calories, 0) || 0);
  }, 0);

  const openAdd = (mealType: string) => {
    setAddMealType(mealType);
    setNewMeal({ name: "", calories: "", protein: "", carbs: "", fat: "" });
    setImagePreview(null);
    setShowAdd(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addMeal = () => {
    if (!newMeal.name) return;
    const entry: PlannedMeal = {
      id: Date.now().toString(),
      name: newMeal.name,
      calories: parseInt(newMeal.calories) || 0,
      protein: parseInt(newMeal.protein) || 0,
      carbs: parseInt(newMeal.carbs) || 0,
      fat: parseInt(newMeal.fat) || 0,
      imageUrl: imagePreview || undefined,
    };
    setWeekPlan((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [addMealType]: [...(prev[selectedDay]?.[addMealType] || []), entry],
      },
    }));
    setShowAdd(false);
  };

  const removeMeal = (mealType: string, id: string) => {
    setWeekPlan((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: prev[selectedDay][mealType].filter((m) => m.id !== id),
      },
    }));
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Meal Planner</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Plan your week, hit your goals</p>
      </motion.div>

      {/* Day selector */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigateDay(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <div className="text-center">
            <p className="text-lg font-bold font-display text-foreground">{selectedDay}</p>
            <p className="text-xs text-muted-foreground font-body">{dayTotal} kcal planned</p>
          </div>
          <button onClick={() => navigateDay(1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {/* Day pills */}
        <div className="flex gap-1.5">
          {DAYS.map((day) => {
            const isActive = day === selectedDay;
            const hasMeals = MEALS.some((m) => (weekPlan[day]?.[m]?.length || 0) > 0);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-medium font-body transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : hasMeals
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meal sections */}
      {MEALS.map((mealType) => {
        const meals = weekPlan[selectedDay]?.[mealType] || [];
        const mealCals = meals.reduce((s, f) => s + f.calories, 0);
        return (
          <motion.div
            key={mealType}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">{mealType}</p>
                  {mealCals > 0 && (
                    <p className="text-xs text-muted-foreground font-body">{mealCals} kcal</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openAdd(mealType)}
                className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
              >
                <Plus className="w-4 h-4 text-primary" />
              </button>
            </div>

            {meals.length > 0 ? (
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div key={meal.id} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-secondary/50">
                    {meal.imageUrl && (
                      <img
                        src={meal.imageUrl}
                        alt={meal.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground font-body truncate">{meal.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {meal.calories} kcal · P:{meal.protein}g · C:{meal.carbs}g · F:{meal.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() => removeMeal(mealType, meal.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3 font-body">
                Tap + to plan your {mealType.toLowerCase()}
              </p>
            )}
          </motion.div>
        );
      })}

      {/* Weekly overview */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-3">Weekly Overview</h3>
        <div className="space-y-2">
          {DAYS.map((day) => {
            const total = MEALS.reduce((s, m) => s + (weekPlan[day]?.[m]?.reduce((a, f) => a + f.calories, 0) || 0), 0);
            const pct = Math.min((total / 2100) * 100, 100);
            return (
              <div key={day} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-8 font-body ${day === selectedDay ? "text-primary" : "text-muted-foreground"}`}>
                  {day.slice(0, 3)}
                </span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${total > 0 ? "bg-primary" : ""}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-body w-14 text-right">{total > 0 ? `${total} kcal` : "—"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add meal modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
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
                  Plan {addMealType} — {selectedDay}
                </h2>
                <button onClick={() => setShowAdd(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Image upload */}
              <div className="flex gap-3">
                <label className="flex-1 glass-card flex flex-col items-center justify-center py-6 cursor-pointer hover:border-primary/30 transition-colors">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground font-body">Add a photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <input
                value={newMeal.name}
                onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                placeholder="What are you planning to eat?"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              />

              <div className="grid grid-cols-2 gap-3">
                {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
                  <input
                    key={field}
                    value={newMeal[field]}
                    onChange={(e) => setNewMeal({ ...newMeal, [field]: e.target.value })}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === "calories" ? " (kcal)" : " (g)")}
                    type="number"
                    className="bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                  />
                ))}
              </div>

              <button
                onClick={addMeal}
                disabled={!newMeal.name}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display glow-primary disabled:opacity-40 transition-opacity"
              >
                Add to Plan
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeeklyPlanner;
