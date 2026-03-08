const STREAK_KEY = "Cals Crumble Fit_streak";

interface StreakData {
  current: number;
  longest: number;
  lastVisitDate: string; // YYYY-MM-DD
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { current: 0, longest: 0, lastVisitDate: "" };
}

function saveStreak(data: StreakData) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function tickStreak(): StreakData {
  const today = getToday();
  const data = loadStreak();

  if (data.lastVisitDate === today) {
    return data;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newCurrent: number;
  if (data.lastVisitDate === yesterdayStr) {
    newCurrent = data.current + 1;
  } else {
    newCurrent = 1;
  }

  const newLongest = Math.max(newCurrent, data.longest);
  const updated: StreakData = { current: newCurrent, longest: newLongest, lastVisitDate: today };
  saveStreak(updated);
  return updated;
}

export function useStreak() {
  const streak = tickStreak();
  return { currentStreak: streak.current, longestStreak: streak.longest };
}
