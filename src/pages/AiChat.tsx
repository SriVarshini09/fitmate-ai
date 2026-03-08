import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedQuestions = [
  "How many calories should I eat to lose weight?",
  "What's a good high-protein breakfast?",
  "How to calculate my macros?",
  "Best exercises to burn belly fat?",
];

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! 👋 I'm your AI Fitness Coach. Ask me anything about nutrition, workouts, calories, or your fitness journey. I'm here to help!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (will be replaced with real AI later)
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: "That's a great question! To give you the most accurate advice, I'd recommend tracking your food intake for a few days first. This will help me understand your eating patterns and give you personalized recommendations. Would you like me to help you set up a meal plan?",
      };
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: responses.default },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <motion.div
        className="px-4 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">AI Coach</h1>
            <p className="text-xs text-primary font-body flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Online
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
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
              {msg.role === "assistant" ? (
                <Bot className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4 text-foreground" />
              )}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
              msg.role === "assistant"
                ? "glass-card text-foreground"
                : "bg-primary text-primary-foreground"
            }`}>
              {msg.content}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Suggested questions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-body">Try asking:</p>
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="block w-full text-left glass-card px-4 py-3 rounded-xl text-sm text-foreground/80 hover:border-primary/30 transition-colors font-body"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4">
        <div className="glass-card-strong flex items-center gap-2 px-4 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask your AI coach..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 font-body"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
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
