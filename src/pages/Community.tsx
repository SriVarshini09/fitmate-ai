import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Send, TrendingUp, Clock, User } from "lucide-react";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  replies: number;
  time: string;
  tag: string;
}

const samplePosts: Post[] = [
  {
    id: "1", author: "FitMike92", avatar: "FM", content: "Just hit my protein goal for 30 days straight! 💪 Anyone else tracking macros consistently?",
    likes: 24, replies: 8, time: "2h ago", tag: "Nutrition",
  },
  {
    id: "2", author: "RunnerSara", avatar: "RS", content: "What's the best way to estimate calories for home-cooked meals? I always feel like I'm guessing.",
    likes: 15, replies: 12, time: "4h ago", tag: "Question",
  },
  {
    id: "3", author: "IronChef_Dev", avatar: "IC", content: "High protein meal prep for the week: chicken breast, quinoa, roasted veggies. ~500 kcal per meal.",
    likes: 42, replies: 6, time: "6h ago", tag: "Meal Prep",
  },
];

const tags = ["All", "Nutrition", "Question", "Meal Prep", "Motivation", "Workouts"];

const Community = () => {
  const [posts, setPosts] = useState(samplePosts);
  const [activeTag, setActiveTag] = useState("All");
  const [newPost, setNewPost] = useState("");

  const filtered = activeTag === "All" ? posts : posts.filter((p) => p.tag === activeTag);

  const submitPost = () => {
    if (!newPost.trim()) return;
    setPosts([
      {
        id: Date.now().toString(), author: "You", avatar: "JD", content: newPost,
        likes: 0, replies: 0, time: "now", tag: "Question",
      },
      ...posts,
    ]);
    setNewPost("");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground font-body">Ask questions, share progress</p>
      </motion.div>

      {/* New post */}
      <div className="glass-card p-4 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary font-display">JD</span>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Ask a question or share something..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
            onKeyDown={(e) => e.key === "Enter" && submitPost()}
          />
          <button onClick={submitPost} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors font-body ${
              activeTag === tag ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {filtered.map((post, i) => (
          <motion.div
            key={post.id}
            className="glass-card p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-foreground font-display">{post.avatar}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground font-display">{post.author}</p>
                <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {post.time}
                </p>
              </div>
              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium font-body">
                {post.tag}
              </span>
            </div>
            <p className="text-sm text-foreground/90 font-body leading-relaxed">{post.content}</p>
            <div className="flex gap-4 mt-4 pt-3 border-t border-border">
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs font-body">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-body">{post.replies} replies</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Community;
