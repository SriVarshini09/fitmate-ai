import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ThumbsUp, Send, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  author_initials: string;
  content: string;
  tag: string;
  likes: number;
  created_at: string;
}

const tags = ["All", "Nutrition", "Question", "Meal Prep", "Motivation", "Workouts"];

function getUserInfo(): { name: string; initials: string } {
  try {
    const raw = localStorage.getItem("vitalflow_onboarding");
    if (!raw) return { name: "Anonymous", initials: "ME" };
    const data = JSON.parse(raw);
    const name: string = data.name || data.display_name || data.username || "Anonymous";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    let initials = "ME";
    if (parts.length >= 2) initials = (parts[0][0] + parts[1][0]).toUpperCase();
    else if (parts.length === 1) initials = parts[0].slice(0, 2).toUpperCase();
    return { name, initials };
  } catch { return { name: "Anonymous", initials: "ME" }; }
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const Community = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [newPost, setNewPost] = useState("");
  const [selectedTag, setSelectedTag] = useState("Question");
  const [submitting, setSubmitting] = useState(false);
  const { name: userName, initials: userInitials } = getUserInfo();

  // Load posts
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) setPosts(data as Post[]);
      setLoading(false);
    };
    fetchPosts();

    // Real-time subscription
    const channel = supabase
      .channel("community_posts_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setPosts((prev) => [payload.new as Post, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setPosts((prev) => prev.map((p) => p.id === (payload.new as Post).id ? payload.new as Post : p));
        } else if (payload.eventType === "DELETE") {
          setPosts((prev) => prev.filter((p) => p.id !== (payload.old as Post).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const submitPost = async () => {
    if (!newPost.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: userName,
      author_initials: userInitials,
      content: newPost.trim(),
      tag: selectedTag,
      likes: 0,
    });
    if (error) {
      toast.error("Failed to post. Please try again.");
    } else {
      setNewPost("");
    }
    setSubmitting(false);
  };

  const toggleLike = async (post: Post) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ likes: post.likes + 1 })
      .eq("id", post.id);
    if (error) toast.error("Could not like post.");
  };

  const filtered = activeTag === "All" ? posts : posts.filter((p) => p.tag === activeTag);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-32">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Community</h1>
        <p className="text-sm text-muted-foreground font-body">Ask questions, share progress</p>
      </motion.div>

      {/* New post */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary font-display">{userInitials}</span>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Ask a question or share something..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitPost()}
            />
            <button
              onClick={submitPost}
              disabled={submitting || !newPost.trim()}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <Send className="w-4 h-4 text-primary-foreground" />}
            </button>
          </div>
        </div>
        {/* Post tag selector */}
        <div className="flex gap-1.5 flex-wrap pl-13">
          {tags.slice(1).map((t) => (
            <button key={t} onClick={() => setSelectedTag(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-medium font-body transition-colors ${selectedTag === t ? "bg-primary text-primary-foreground" : "bg-secondary/60 text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Filter tags */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {tags.map((tag) => (
          <button key={tag} onClick={() => setActiveTag(tag)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors font-body ${activeTag === tag ? "bg-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-body text-sm">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, i) => (
            <motion.div key={post.id} className="glass-card p-5"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground font-display">{post.author_initials}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground font-display">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {timeAgo(post.created_at)}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-medium font-body">{post.tag}</span>
              </div>
              <p className="text-sm text-foreground/90 font-body leading-relaxed">{post.content}</p>
              <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                <button onClick={() => toggleLike(post)}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-body">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-body">Reply</span>
                </button>
                {user?.id === post.user_id && (
                  <button onClick={async () => {
                    await supabase.from("community_posts").delete().eq("id", post.id);
                  }} className="ml-auto text-[10px] text-destructive/60 hover:text-destructive font-body transition-colors">
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;
