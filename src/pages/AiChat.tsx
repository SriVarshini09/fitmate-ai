import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "What should I eat today based on my goals?",
  "Create a workout plan for me",
  "How am I doing with my calorie target?",
  "Best exercises for my body type?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

function getUserContext() {
  try {
    const raw = localStorage.getItem("Cals Crumble Fit_onboarding");
    if (!raw) return null;
    const data = JSON.parse(raw);

    // Also grab today's calorie data
    const today = new Date().toISOString().slice(0, 10);
    const eatenData = JSON.parse(localStorage.getItem("Cals Crumble Fit_eaten") || "{}");
    const burned = JSON.parse(localStorage.getItem("Cals Crumble Fit_burned") || "[]");
    const todayEaten = typeof eatenData === "object" && !Array.isArray(eatenData)
      ? (eatenData[today] || 0)
      : 0;
    const todayBurned = Array.isArray(burned)
      ? burned
          .filter((e: any) => e.date === today)
          .reduce((sum: number, e: any) => sum + (e.calories || 0), 0)
      : 0;

    return {
      ...data,
      todayCaloriesEaten: todayEaten,
      todayCaloriesBurned: todayBurned,
    };
  } catch {
    return null;
  }
}

async function streamChat({
  messages,
  userContext,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  userContext: any;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, userContext }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }
  onDone();
}

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! 👋 I'm your AI Fitness Coach. I already know your goals, stats, and progress — so just ask me anything and I'll give you personalized advice!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";
    const chatHistory = newMessages
      .filter((m) => m.id !== "1")
      .map((m) => ({ role: m.role, content: m.content }));

    const userContext = getUserContext();

    try {
      await streamChat({
        messages: chatHistory,
        userContext,
        onDelta: (chunk) => {
          assistantContent += chunk;
          const content = assistantContent;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id !== "1") {
              return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
            }
            return [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content }];
          });
        },
        onDone: () => setIsStreaming(false),
      });
    } catch (e: any) {
      console.error(e);
      // Generate contextual response based on question
      const question = text.toLowerCase();
      let mockResponse = "";

      if (question.includes("workout") || question.includes("exercise") || question.includes("train")) {
        mockResponse = `## 🏋️ Personalized Workout Plan\n\nBased on your **${userContext?.goal || 'fitness'}** goal, here's a 4-day split:\n\n**Day 1 - Upper Body Push**\n- Bench Press: 4×8-10\n- Overhead Press: 3×10-12\n- Incline Dumbbell Press: 3×10-12\n- Tricep Dips: 3×12-15\n- Lateral Raises: 3×15\n\n**Day 2 - Lower Body**\n- Squats: 4×8-10\n- Romanian Deadlifts: 3×10-12\n- Leg Press: 3×12-15\n- Lunges: 3×12 each leg\n- Calf Raises: 4×15-20\n\n**Day 3 - Upper Body Pull**\n- Deadlifts: 4×6-8\n- Pull-ups: 3×max\n- Barbell Rows: 3×10-12\n- Face Pulls: 3×15\n- Bicep Curls: 3×12-15\n\n**Day 4 - Full Body/Core**\n- Front Squats: 3×10\n- Bench Press: 3×10\n- Plank: 3×60s\n- Russian Twists: 3×20\n- Cable Crunches: 3×15\n\n💡 Rest 48hrs between muscle groups. Track your sets in the Workout Logger!`;
      } else if (question.includes("eat") || question.includes("meal") || question.includes("food") || question.includes("diet")) {
        const remaining = (userContext?.targetCalories || 2000) - (userContext?.todayCaloriesEaten || 0);
        mockResponse = `## 🥗 Meal Recommendations\n\n**Your Stats:**\n- Target: ${userContext?.targetCalories || 2000} kcal/day\n- Eaten: ${userContext?.todayCaloriesEaten || 0} kcal\n- Remaining: ${remaining} kcal\n- Protein goal: ${userContext?.macros?.protein || 92}g\n\n**Suggested Meals:**\n\n**Breakfast (400 kcal)**\n- 3 eggs scrambled with spinach\n- 2 slices whole grain toast\n- 1 banana\n\n**Lunch (500 kcal)**\n- Grilled chicken breast (200g)\n- Quinoa (1 cup)\n- Mixed vegetables\n- Olive oil dressing\n\n**Dinner (450 kcal)**\n- Baked salmon (180g)\n- Sweet potato (200g)\n- Broccoli & asparagus\n\n**Snacks (250 kcal)**\n- Greek yogurt with berries\n- Handful of almonds\n- Protein shake\n\n💡 Log everything in Food Log for accurate tracking!`;
      } else if (question.includes("progress") || question.includes("doing") || question.includes("target")) {
        const remaining = (userContext?.targetCalories || 2000) - (userContext?.todayCaloriesEaten || 0);
        const percentEaten = Math.round(((userContext?.todayCaloriesEaten || 0) / (userContext?.targetCalories || 2000)) * 100);
        mockResponse = `## 📊 Your Progress Today\n\n**Calories:**\n- Eaten: ${userContext?.todayCaloriesEaten || 0} kcal (${percentEaten}%)\n- Burned: ${userContext?.todayCaloriesBurned || 0} kcal\n- Target: ${userContext?.targetCalories || 2000} kcal\n- Remaining: ${remaining} kcal\n\n**Macros Target:**\n- Protein: ${userContext?.macros?.protein || 92}g\n- Carbs: ${userContext?.macros?.carbs || 92}g\n- Fat: ${userContext?.macros?.fat || 35}g\n\n**Goal:** ${userContext?.goal === 'lose' ? '📉 Weight Loss' : userContext?.goal === 'gain' ? '💪 Muscle Gain' : '⚖️ Maintain'}\n\n${remaining > 0 ? `✅ You're on track! ${remaining} kcal left for today.` : `⚠️ You've exceeded your target by ${Math.abs(remaining)} kcal.`}\n\n💡 Keep logging your meals and workouts to stay on track!`;
      } else {
        mockResponse = `## 🤖 Demo Mode Active\n\nI can help you with:\n\n**📋 Workout Plans**\n- Personalized exercise routines\n- Progressive overload strategies\n- Form tips and alternatives\n\n**🍽️ Nutrition Advice**\n- Meal planning for your goals\n- Macro-friendly recipes\n- Calorie distribution\n\n**📈 Progress Tracking**\n- Daily calorie analysis\n- Goal achievement insights\n- Performance trends\n\n**Your Profile:**\n- Goal: ${userContext?.goal === 'lose' ? '📉 Weight Loss' : userContext?.goal === 'gain' ? '💪 Muscle Gain' : '⚖️ Maintain'}\n- Target: ${userContext?.targetCalories || 2000} kcal/day\n- Today: ${userContext?.todayCaloriesEaten || 0} eaten, ${userContext?.todayCaloriesBurned || 0} burned\n\n💡 Ask me about workouts, meals, or your progress!`;
      }
      
      setMessages((prev) => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: mockResponse 
      }]);
      setIsStreaming(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-6rem)]">
      <motion.div className="px-4 py-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">AI Coach</h1>
            <p className="text-xs text-primary font-body flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Knows your goals & stats
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant" ? "bg-primary/15" : "bg-secondary"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-foreground" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
              msg.role === "assistant" ? "glass-card text-foreground" : "bg-primary text-primary-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </motion.div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-body">Try asking:</p>
            {suggestedQuestions.map((q) => (
              <button key={q} onClick={() => sendMessage(q)}
                className="block w-full text-left glass-card px-4 py-3 rounded-xl text-sm text-foreground/80 hover:border-primary/30 transition-colors font-body"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-4">
        <div className="glass-card-strong flex items-center gap-2 px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask your AI coach..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 font-body"
            disabled={isStreaming}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || isStreaming}
            className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 transition-opacity"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;