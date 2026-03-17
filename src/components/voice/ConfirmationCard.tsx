import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Mic, Droplets, Dumbbell, ChevronDown } from "lucide-react";
import { VoiceParsedData, FoodItem } from "@/lib/naturalLanguageParser";

// Basic nutrition lookup (kcal per 100g)
const NUTRITION_TABLE: Record<string, [number, number, number, number]> = {
  "rice": [130, 2.7, 28, 0.3], "white rice": [130, 2.7, 28, 0.3],
  "brown rice": [123, 2.6, 26, 1.0], "oats": [389, 17, 66, 7],
  "idli": [58, 2, 11.5, 0.4], "dosa": [168, 3.5, 28, 5],
  "chapati": [297, 9.2, 55, 3.9], "roti": [297, 9.2, 55, 3.9],
  "dal": [116, 9, 20, 0.4], "egg": [155, 13, 1.1, 11],
  "eggs": [155, 13, 1.1, 11], "chicken breast": [165, 31, 0, 3.6],
  "chicken": [165, 31, 0, 3.6], "paneer": [265, 18, 3.4, 20],
  "curd": [98, 3.5, 3.4, 4.3], "yogurt": [98, 3.5, 3.4, 4.3],
  "banana": [89, 1.1, 23, 0.3], "apple": [52, 0.3, 14, 0.2],
  "milk": [61, 3.2, 4.8, 3.3], "bread": [265, 9, 49, 3.2],
  "toast": [265, 9, 49, 3.2], "potato": [77, 2, 17, 0.1],
  "almonds": [579, 21, 22, 50], "peanut butter": [588, 25, 20, 50],
  "pasta": [158, 5.8, 31, 0.9], "salmon": [208, 20, 0, 13],
  "tuna": [132, 29, 0, 1], "broccoli": [34, 2.8, 7, 0.4],
  "spinach": [23, 2.9, 3.6, 0.4], "mango": [60, 0.8, 15, 0.4],
  "orange": [47, 0.9, 12, 0.1], "coffee": [2, 0.3, 0, 0],
  "tea": [1, 0, 0.2, 0], "sambar": [56, 3.5, 8, 1.5],
};

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, kg: 1000, ml: 1, l: 1000,
  cup: 240, tbsp: 15, tsp: 5, pcs: 100,
};

function estimateNutrition(item: FoodItem): { calories: number; protein: number } {
  const key = item.name.toLowerCase().trim();
  let row = NUTRITION_TABLE[key];
  if (!row) {
    const found = Object.keys(NUTRITION_TABLE).find(k => key.includes(k) || k.includes(key));
    if (found) row = NUTRITION_TABLE[found];
  }
  if (!row) return { calories: 0, protein: 0 };

  const grams = item.quantity * (UNIT_TO_GRAMS[item.unit] || 100);
  const factor = grams / 100;
  return {
    calories: Math.round(row[0] * factor),
    protein: Math.round(row[1] * factor * 10) / 10,
  };
}

interface EditableFoodRow {
  item: FoodItem;
  onChange: (updated: FoodItem) => void;
}

const EditableFoodRow = ({ item, onChange }: EditableFoodRow) => {
  const { calories, protein } = estimateNutrition(item);
  const UNITS = ["g", "kg", "ml", "l", "cup", "tbsp", "tsp", "pcs"];

  return (
    <div className="p-3 rounded-xl bg-secondary/50 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-semibold font-display text-foreground outline-none border-b border-border/40 pb-0.5 capitalize"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange({ ...item, quantity: parseFloat(e.target.value) || 1 })}
          className="w-16 bg-secondary rounded-lg px-2 py-1 text-sm text-foreground text-center outline-none font-body"
        />
        <div className="relative">
          <select
            value={item.unit}
            onChange={e => onChange({ ...item, unit: e.target.value })}
            className="appearance-none bg-secondary rounded-lg px-3 py-1 pr-6 text-sm text-foreground outline-none font-body cursor-pointer"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
        <div className="ml-auto text-right">
          {calories > 0 ? (
            <>
              <p className="text-sm font-bold font-display text-foreground">{calories} kcal</p>
              {protein > 0 && <p className="text-[10px] text-muted-foreground font-body">{protein}g protein</p>}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground font-body italic">unknown</p>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConfirmationCardProps {
  parsedData: VoiceParsedData;
  onConfirm: (data: VoiceParsedData) => void;
  onDismiss: () => void;
  onReRecord: () => void;
}

const ConfirmationCard = ({ parsedData, onConfirm, onDismiss, onReRecord }: ConfirmationCardProps) => {
  const [data, setData] = useState<VoiceParsedData>(parsedData);

  const updateFoodItem = (index: number, updated: FoodItem) => {
    if (!data.foodItems) return;
    const newItems = [...data.foodItems];
    newItems[index] = updated;
    setData({ ...data, foodItems: newItems });
  };

  const totalCalories = data.foodItems?.reduce((sum, item) => sum + estimateNutrition(item).calories, 0) ?? 0;

  const headerConfig = {
    food: { icon: "🍽️", label: "Food Logged", color: "text-success" },
    water: { icon: "💧", label: "Water Added", color: "text-info" },
    workout: { icon: "🏃", label: "Start Workout", color: "text-primary" },
    unknown: { icon: "🤔", label: "Not Understood", color: "text-muted-foreground" },
  }[data.type];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
    >
      <motion.div
        className="w-full max-w-lg glass-card-strong rounded-t-3xl p-6 space-y-4"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{headerConfig.icon}</span>
            <div>
              <h3 className={`text-base font-bold font-display ${headerConfig.color}`}>{headerConfig.label}</h3>
              <p className="text-xs text-muted-foreground font-body italic">"{data.rawTranscript}"</p>
            </div>
          </div>
          <button onClick={onDismiss} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Food items */}
        {data.type === "food" && data.foodItems && (
          <div className="space-y-2">
            {data.foodItems.map((item, i) => (
              <EditableFoodRow key={i} item={item} onChange={updated => updateFoodItem(i, updated)} />
            ))}
            {totalCalories > 0 && (
              <div className="flex items-center justify-between px-1">
                <p className="text-xs text-muted-foreground font-body">Total estimate</p>
                <p className="text-sm font-bold font-display text-foreground">{totalCalories} kcal</p>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground font-body px-1">
              Meal: <span className="capitalize text-foreground">{data.meal}</span>
            </p>
          </div>
        )}

        {/* Water */}
        {data.type === "water" && (
          <div className="p-4 rounded-xl bg-info/10 flex items-center gap-4">
            <Droplets className="w-8 h-8 text-info" />
            <div className="flex-1">
              <p className="text-lg font-bold font-display text-foreground">{data.waterAmount} ml</p>
              <p className="text-xs text-muted-foreground font-body">
                ≈ {Math.round((data.waterAmount ?? 0) / 250)} glass{Math.round((data.waterAmount ?? 0) / 250) !== 1 ? "es" : ""}
              </p>
            </div>
            <input
              type="number"
              value={data.waterAmount}
              onChange={e => setData({ ...data, waterAmount: parseInt(e.target.value) || 250 })}
              className="w-20 bg-secondary rounded-xl px-3 py-2 text-sm text-foreground text-center outline-none font-body"
            />
          </div>
        )}

        {/* Workout */}
        {data.type === "workout" && (
          <div className="p-4 rounded-xl bg-primary/10 flex items-center gap-4">
            <Dumbbell className="w-8 h-8 text-primary" />
            <div>
              <p className="text-lg font-bold font-display text-foreground capitalize">{data.workoutActivity}</p>
              <p className="text-xs text-muted-foreground font-body">Live session will start</p>
            </div>
          </div>
        )}

        {/* Unknown */}
        {data.type === "unknown" && (
          <div className="p-4 rounded-xl bg-secondary text-center">
            <p className="text-sm text-muted-foreground font-body">Couldn't understand that. Try again?</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onReRecord}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-body hover:bg-secondary/80 transition-colors"
          >
            <Mic className="w-4 h-4" /> Try again
          </button>
          <button
            onClick={() => onConfirm(data)}
            disabled={data.type === "unknown"}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold font-display glow-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Check className="w-4 h-4" /> Confirm & Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationCard;
