import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill, Plus, Check, X, Clock, Trash2, ChevronDown, ChevronUp,
  Sparkles, Heart, Dumbbell, Brain, Eye, Bone, Droplets, Shield
} from "lucide-react";
import { toast } from "sonner";

interface Tablet {
  id: string;
  name: string;
  purpose: string;
  time: string;
  taken: boolean;
  icon: string;
}

const PURPOSE_OPTIONS = [
  { key: "supplement", label: "Supplement", emoji: "💊", icon: Sparkles },
  { key: "vitamin", label: "Vitamin", emoji: "🌟", icon: Eye },
  { key: "heart", label: "Heart Health", emoji: "❤️", icon: Heart },
  { key: "bone", label: "Bone & Joint", emoji: "🦴", icon: Bone },
  { key: "brain", label: "Brain & Focus", emoji: "🧠", icon: Brain },
  { key: "fitness", label: "Fitness / Gym", emoji: "💪", icon: Dumbbell },
  { key: "immunity", label: "Immunity", emoji: "🛡️", icon: Shield },
  { key: "hydration", label: "Hydration / Electrolytes", emoji: "💧", icon: Droplets },
  { key: "other", label: "Other / Prescribed", emoji: "🩺", icon: Pill },
];

const TabletTracker = () => {
  const [tablets, setTablets] = useState<Tablet[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newTime, setNewTime] = useState("08:00");

  const takenCount = tablets.filter((t) => t.taken).length;
  const totalCount = tablets.length;
  const progress = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

  const toggleTaken = (id: string) => {
    setTablets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const newTaken = !t.taken;
          if (newTaken) {
            toast.success(`✅ ${t.name} marked as taken!`);
          }
          return { ...t, taken: newTaken };
        }
        return t;
      })
    );
  };

  const addTablet = () => {
    if (!newName.trim() || !newPurpose) return;
    const purposeOpt = PURPOSE_OPTIONS.find((p) => p.key === newPurpose);
    const tablet: Tablet = {
      id: Date.now().toString(),
      name: newName.trim(),
      purpose: newPurpose,
      time: newTime,
      taken: false,
      icon: purposeOpt?.emoji || "💊",
    };
    setTablets((prev) => [...prev, tablet]);
    setNewName("");
    setNewPurpose("");
    setNewTime("08:00");
    setShowAdd(false);
    toast(`💊 ${tablet.name} added to your schedule`);
  };

  const removeTablet = (id: string) => {
    const tablet = tablets.find((t) => t.id === id);
    setTablets((prev) => prev.filter((t) => t.id !== id));
    if (tablet) toast(`Removed ${tablet.name}`);
  };

  // Sort: untaken first, then by time
  const sorted = [...tablets].sort((a, b) => {
    if (a.taken !== b.taken) return a.taken ? 1 : -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Pill className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-body">Daily Tablets</p>
            <p className="text-xl font-bold font-display text-foreground">
              {takenCount}
              <span className="text-sm font-normal text-muted-foreground"> / {totalCount} taken</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors"
          >
            {showAdd ? <X className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(270 60% 55%), hsl(280 70% 65%))" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {progress >= 100 && (
        <p className="text-[10px] text-center font-bold font-body text-primary">
          🎉 All tablets taken for today!
        </p>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="space-y-3 p-4 rounded-2xl bg-secondary/30 border border-border"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <p className="text-xs font-semibold text-foreground font-display">Add Tablet</p>

            <input
              type="text"
              placeholder="Tablet name (e.g. Vitamin D3)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              autoFocus
            />

            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-2">Purpose</p>
              <div className="grid grid-cols-3 gap-1.5">
                {PURPOSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setNewPurpose(opt.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-left transition-all text-[10px] font-medium font-body ${
                      newPurpose === opt.key
                        ? "bg-primary/15 border border-primary/30 text-primary"
                        : "bg-secondary/60 border border-transparent text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground font-body mb-1.5">Time to take</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              onClick={addTablet}
              disabled={!newName.trim() || !newPurpose}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm font-body hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add to Schedule
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tablet list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="space-y-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {sorted.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4 font-body">
                No tablets added yet. Tap + to add one.
              </p>
            )}
            {sorted.map((tablet) => {
              const purposeOpt = PURPOSE_OPTIONS.find((p) => p.key === tablet.purpose);
              return (
                <motion.div
                  key={tablet.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    tablet.taken
                      ? "bg-primary/5 border-primary/15 opacity-60"
                      : "bg-secondary/30 border-border hover:bg-secondary/50"
                  }`}
                >
                  {/* Take button */}
                  <button
                    onClick={() => toggleTaken(tablet.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      tablet.taken
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border hover:border-primary/40"
                    }`}
                  >
                    {tablet.taken ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-base">{tablet.icon}</span>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold font-display truncate ${tablet.taken ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {tablet.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-body">{purposeOpt?.label || tablet.purpose}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-body flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {tablet.time}
                      </span>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeTablet(tablet.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TabletTracker;
