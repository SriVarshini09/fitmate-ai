import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Ruler, Flame, Droplets, Activity, ChevronDown } from "lucide-react";

type ToolKey = "bmi" | "tdee" | "macro" | "water" | "bodyfat";

const Tools = () => {
  const [activeTool, setActiveTool] = useState<ToolKey>("bmi");

  // BMI
  const [bmiWeight, setBmiWeight] = useState("");
  const [bmiHeight, setBmiHeight] = useState("");
  const bmi = bmiWeight && bmiHeight ? (parseFloat(bmiWeight) / ((parseFloat(bmiHeight) / 100) ** 2)).toFixed(1) : null;
  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese"
    : null;
  const bmiColor = bmiCategory === "Normal" ? "text-primary" : bmiCategory === "Underweight" ? "text-info" : bmiCategory === "Overweight" ? "text-warning" : "text-destructive";

  // TDEE
  const [tdeeWeight, setTdeeWeight] = useState("");
  const [tdeeHeight, setTdeeHeight] = useState("");
  const [tdeeAge, setTdeeAge] = useState("");
  const [tdeeGender, setTdeeGender] = useState("male");
  const [tdeeActivity, setTdeeActivity] = useState(1.55);
  const tdee = tdeeWeight && tdeeHeight && tdeeAge
    ? Math.round(
        (tdeeGender === "male"
          ? 10 * parseFloat(tdeeWeight) + 6.25 * parseFloat(tdeeHeight) - 5 * parseFloat(tdeeAge) + 5
          : 10 * parseFloat(tdeeWeight) + 6.25 * parseFloat(tdeeHeight) - 5 * parseFloat(tdeeAge) - 161
        ) * tdeeActivity
      )
    : null;

  // Macro
  const [macroCalories, setMacroCalories] = useState("");
  const [macroGoal, setMacroGoal] = useState("balanced");
  const macroSplits: Record<string, { p: number; c: number; f: number }> = {
    balanced: { p: 0.3, c: 0.4, f: 0.3 },
    lowcarb: { p: 0.4, c: 0.2, f: 0.4 },
    highprotein: { p: 0.4, c: 0.35, f: 0.25 },
    keto: { p: 0.25, c: 0.05, f: 0.7 },
  };
  const macros = macroCalories
    ? {
        protein: Math.round((parseFloat(macroCalories) * macroSplits[macroGoal].p) / 4),
        carbs: Math.round((parseFloat(macroCalories) * macroSplits[macroGoal].c) / 4),
        fat: Math.round((parseFloat(macroCalories) * macroSplits[macroGoal].f) / 9),
      }
    : null;

  // Water
  const [waterWeight, setWaterWeight] = useState("");
  const [waterActivity, setWaterActivity] = useState("moderate");
  const waterMultiplier = waterActivity === "sedentary" ? 30 : waterActivity === "moderate" ? 35 : 40;
  const waterResult = waterWeight ? Math.round((parseFloat(waterWeight) * waterMultiplier) / 1000 * 10) / 10 : null;

  // Body fat estimate (Navy method)
  const [bfGender, setBfGender] = useState("male");
  const [bfWaist, setBfWaist] = useState("");
  const [bfNeck, setBfNeck] = useState("");
  const [bfHeightVal, setBfHeightVal] = useState("");
  const [bfHip, setBfHip] = useState("");
  const bodyFat = bfWaist && bfNeck && bfHeightVal
    ? bfGender === "male"
      ? (86.01 * Math.log10(parseFloat(bfWaist) - parseFloat(bfNeck)) - 70.041 * Math.log10(parseFloat(bfHeightVal)) + 36.76).toFixed(1)
      : bfHip
        ? (163.205 * Math.log10(parseFloat(bfWaist) + parseFloat(bfHip) - parseFloat(bfNeck)) - 97.684 * Math.log10(parseFloat(bfHeightVal)) - 78.387).toFixed(1)
        : null
    : null;

  const tools: { key: ToolKey; label: string; icon: React.ElementType; color: string }[] = [
    { key: "bmi", label: "BMI", icon: Ruler, color: "bg-primary/15 text-primary" },
    { key: "tdee", label: "TDEE", icon: Flame, color: "bg-warning/15 text-warning" },
    { key: "macro", label: "Macros", icon: Calculator, color: "bg-info/15 text-info" },
    { key: "water", label: "Water", icon: Droplets, color: "bg-info/15 text-info" },
    { key: "bodyfat", label: "Body Fat", icon: Activity, color: "bg-success/15 text-success" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Tools</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Fitness calculators & utilities</p>
      </motion.div>

      {/* Tool selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTool(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors font-body ${
              activeTool === t.key ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* BMI */}
      {activeTool === "bmi" && (
        <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground">BMI Calculator</h3>
          <p className="text-xs text-muted-foreground font-body">Body Mass Index</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Weight (kg)</label>
              <input type="number" value={bmiWeight} onChange={(e) => setBmiWeight(e.target.value)} placeholder="70"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Height (cm)</label>
              <input type="number" value={bmiHeight} onChange={(e) => setBmiHeight(e.target.value)} placeholder="175"
                className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
            </div>
          </div>
          {bmi && (
            <motion.div className="p-4 rounded-xl bg-secondary/50 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <p className={`text-3xl font-bold font-display ${bmiColor}`}>{bmi}</p>
              <p className={`text-sm font-medium font-body ${bmiColor}`}>{bmiCategory}</p>
              <div className="flex gap-1 mt-3">
                {["Underweight", "Normal", "Overweight", "Obese"].map((cat) => (
                  <div key={cat} className={`flex-1 h-2 rounded-full ${cat === bmiCategory ? (bmiColor.replace("text-", "bg-")) : "bg-secondary"}`} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* TDEE */}
      {activeTool === "tdee" && (
        <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground">TDEE Calculator</h3>
          <p className="text-xs text-muted-foreground font-body">Total Daily Energy Expenditure</p>
          <div className="flex gap-2">
            {["male", "female"].map((g) => (
              <button key={g} onClick={() => setTdeeGender(g)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium font-body capitalize transition-colors ${
                  tdeeGender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{g}</button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Weight (kg)</label>
              <input type="number" value={tdeeWeight} onChange={(e) => setTdeeWeight(e.target.value)} placeholder="70"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Height (cm)</label>
              <input type="number" value={tdeeHeight} onChange={(e) => setTdeeHeight(e.target.value)} placeholder="175"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Age</label>
              <input type="number" value={tdeeAge} onChange={(e) => setTdeeAge(e.target.value)} placeholder="25"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-2 block">Activity Level</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: 1.2, l: "Sedentary" }, { v: 1.375, l: "Light" }, { v: 1.55, l: "Moderate" }, { v: 1.725, l: "Active" }, { v: 1.9, l: "Very Active" }].map((a) => (
                <button key={a.v} onClick={() => setTdeeActivity(a.v)}
                  className={`py-2 rounded-xl text-xs font-body transition-colors ${
                    tdeeActivity === a.v ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>{a.l}</button>
              ))}
            </div>
          </div>
          {tdee && (
            <motion.div className="p-4 rounded-xl bg-secondary/50 text-center space-y-2" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <p className="text-3xl font-bold font-display text-primary">{tdee}</p>
              <p className="text-sm text-muted-foreground font-body">kcal/day to maintain</p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2 rounded-lg bg-primary/10"><p className="text-sm font-bold font-display text-foreground">{tdee - 500}</p><p className="text-[9px] text-muted-foreground font-body">Lose 0.5kg/wk</p></div>
                <div className="p-2 rounded-lg bg-primary/10"><p className="text-sm font-bold font-display text-primary">{tdee}</p><p className="text-[9px] text-muted-foreground font-body">Maintain</p></div>
                <div className="p-2 rounded-lg bg-primary/10"><p className="text-sm font-bold font-display text-foreground">{tdee + 500}</p><p className="text-[9px] text-muted-foreground font-body">Gain 0.5kg/wk</p></div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Macro */}
      {activeTool === "macro" && (
        <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground">Macro Calculator</h3>
          <input type="number" value={macroCalories} onChange={(e) => setMacroCalories(e.target.value)} placeholder="Daily calories (e.g. 2000)"
            className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
          <div className="grid grid-cols-2 gap-2">
            {[{ k: "balanced", l: "Balanced" }, { k: "lowcarb", l: "Low Carb" }, { k: "highprotein", l: "High Protein" }, { k: "keto", l: "Keto" }].map((g) => (
              <button key={g.k} onClick={() => setMacroGoal(g.k)}
                className={`py-2 rounded-xl text-xs font-body transition-colors ${
                  macroGoal === g.k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{g.l}</button>
            ))}
          </div>
          {macros && (
            <motion.div className="grid grid-cols-3 gap-3" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="p-4 rounded-xl bg-primary/10 text-center">
                <p className="text-2xl font-bold font-display text-primary">{macros.protein}g</p>
                <p className="text-[10px] text-muted-foreground font-body">Protein</p>
              </div>
              <div className="p-4 rounded-xl bg-info/10 text-center">
                <p className="text-2xl font-bold font-display text-info">{macros.carbs}g</p>
                <p className="text-[10px] text-muted-foreground font-body">Carbs</p>
              </div>
              <div className="p-4 rounded-xl bg-warning/10 text-center">
                <p className="text-2xl font-bold font-display text-warning">{macros.fat}g</p>
                <p className="text-[10px] text-muted-foreground font-body">Fat</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Water */}
      {activeTool === "water" && (
        <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground">Water Intake Calculator</h3>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Weight (kg)</label>
            <input type="number" value={waterWeight} onChange={(e) => setWaterWeight(e.target.value)} placeholder="70"
              className="w-full bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" />
          </div>
          <div className="flex gap-2">
            {["sedentary", "moderate", "active"].map((a) => (
              <button key={a} onClick={() => setWaterActivity(a)}
                className={`flex-1 py-2 rounded-xl text-xs font-body capitalize transition-colors ${
                  waterActivity === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{a}</button>
            ))}
          </div>
          {waterResult && (
            <motion.div className="p-4 rounded-xl bg-info/10 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <p className="text-3xl font-bold font-display text-info">{waterResult}L</p>
              <p className="text-sm text-muted-foreground font-body">~{Math.round(waterResult / 0.25)} glasses per day</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Body Fat */}
      {activeTool === "bodyfat" && (
        <motion.div className="glass-card p-5 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="text-sm font-semibold font-display text-foreground">Body Fat Estimator</h3>
          <p className="text-xs text-muted-foreground font-body">US Navy Method — measurements in cm</p>
          <div className="flex gap-2">
            {["male", "female"].map((g) => (
              <button key={g} onClick={() => setBfGender(g)}
                className={`flex-1 py-2 rounded-xl text-xs font-body capitalize transition-colors ${
                  bfGender === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>{g}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Height (cm)</label>
              <input type="number" value={bfHeightVal} onChange={(e) => setBfHeightVal(e.target.value)} placeholder="175"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Waist (cm)</label>
              <input type="number" value={bfWaist} onChange={(e) => setBfWaist(e.target.value)} placeholder="80"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            <div><label className="text-xs text-muted-foreground font-body mb-1 block">Neck (cm)</label>
              <input type="number" value={bfNeck} onChange={(e) => setBfNeck(e.target.value)} placeholder="37"
                className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            {bfGender === "female" && (
              <div><label className="text-xs text-muted-foreground font-body mb-1 block">Hip (cm)</label>
                <input type="number" value={bfHip} onChange={(e) => setBfHip(e.target.value)} placeholder="95"
                  className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none font-body" /></div>
            )}
          </div>
          {bodyFat && parseFloat(bodyFat) > 0 && (
            <motion.div className="p-4 rounded-xl bg-success/10 text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <p className="text-3xl font-bold font-display text-success">{bodyFat}%</p>
              <p className="text-sm text-muted-foreground font-body">Estimated body fat</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Tools;
