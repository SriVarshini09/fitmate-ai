import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Target, RefreshCw, CheckCircle2, Flame } from "lucide-react";

const QUOTES = [
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: "Unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
];

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  total: number;
  category: string;
  emoji: string;
  active: boolean;
}

const challenges: Challenge[] = [
  { id: "1", title: "10K Steps Challenge", description: "Walk 10,000 steps every day for 7 days", duration: "7 days", progress: 5, total: 7, category: "Steps", emoji: "👟", active: true },
  { id: "2", title: "Protein Champion", description: "Hit your protein goal for 14 consecutive days", duration: "14 days", progress: 8, total: 14, category: "Nutrition", emoji: "🥩", active: true },
  { id: "3", title: "Hydration Hero", description: "Drink 8 glasses of water daily for 7 days", duration: "7 days", progress: 7, total: 7, category: "Water", emoji: "💧", active: true },
  { id: "4", title: "Early Bird", description: "Sleep before 11 PM for 5 days straight", duration: "5 days", progress: 2, total: 5, category: "Sleep", emoji: "🌅", active: true },
  { id: "5", title: "No Sugar Week", description: "Avoid added sugar for a full week", duration: "7 days", progress: 3, total: 7, category: "Nutrition", emoji: "🚫", active: true },
];

const milestones = [
  { title: "First Workout Logged", earned: true, date: "Jan 15", emoji: "💪" },
  { title: "7-Day Streak", earned: true, date: "Jan 22", emoji: "🔥" },
  { title: "10,000 Steps Day", earned: true, date: "Feb 1", emoji: "🏃" },
  { title: "30 Meals Tracked", earned: true, date: "Feb 10", emoji: "🍽️" },
  { title: "Lost First 2kg", earned: true, date: "Feb 20", emoji: "⚖️" },
  { title: "100 Workouts", earned: false, date: "", emoji: "🏆" },
  { title: "Marathon Steps (42K in a day)", earned: false, date: "", emoji: "🥇" },
];

const Motivation = () => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState(challenges);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const nextQuote = () => setQuoteIndex((quoteIndex + 1) % QUOTES.length);
  const quote = QUOTES[quoteIndex];

  const completeDay = (id: string) => {
    setActiveChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, progress: Math.min(c.progress + 1, c.total) } : c))
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-warning" />
          <h1 className="text-2xl font-bold font-display text-foreground">Motivation</h1>
        </div>
        <p className="text-sm text-muted-foreground font-body">Stay inspired, stay on track</p>
      </motion.div>

      {/* Daily quote */}
      <motion.div className="glass-card p-6 relative overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="absolute -top-4 -left-4 text-6xl opacity-10 select-none">"</div>
        <AnimatePresence mode="wait">
          <motion.div key={quoteIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <p className="text-base font-medium text-foreground font-body leading-relaxed mb-2 italic">"{quote.text}"</p>
            <p className="text-xs text-primary font-body">— {quote.author}</p>
          </motion.div>
        </AnimatePresence>
        <button onClick={nextQuote} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Active challenges */}
      <div>
        <h3 className="text-sm font-semibold font-display text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Active Challenges
        </h3>
        <div className="space-y-3">
          {activeChallenges.map((challenge, i) => {
            const pct = (challenge.progress / challenge.total) * 100;
            const isComplete = pct >= 100;
            return (
              <motion.div
                key={challenge.id}
                className={`glass-card p-4 ${isComplete ? "ring-1 ring-primary/30" : ""}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{challenge.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold font-display text-foreground">{challenge.title}</p>
                      {isComplete && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{challenge.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${isComplete ? "bg-primary" : "bg-primary/70"}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap">{challenge.progress}/{challenge.total}</span>
                    </div>
                  </div>
                  {!isComplete && (
                    <button
                      onClick={() => completeDay(challenge.id)}
                      className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center hover:bg-primary/25 transition-colors flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-badge-gold" /> Milestones
        </h3>
        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-secondary" />
          <div className="space-y-4">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                className={`flex items-center gap-4 relative ${!m.earned ? "opacity-40" : ""}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: m.earned ? 1 : 0.4, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  m.earned ? "bg-primary/20" : "bg-secondary"
                }`}>
                  <span className="text-sm">{m.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground font-body">{m.title}</p>
                  {m.date && <p className="text-[10px] text-muted-foreground font-body">{m.date}</p>}
                </div>
                {m.earned && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily tip */}
      <div className="glass-card p-5 bg-gradient-to-br from-card/60 to-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold font-display text-foreground">Today's Tip</h3>
        </div>
        <p className="text-sm text-foreground/80 font-body leading-relaxed">
          Try eating a high-protein breakfast within an hour of waking up. It helps regulate appetite, stabilize blood sugar, and can reduce cravings later in the day. Aim for 25-30g of protein! 🥚
        </p>
      </div>
    </div>
  );
};

export default Motivation;
