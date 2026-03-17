import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Zap } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <motion.div
        className="text-center space-y-6 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-7xl font-bold font-display text-gradient-primary mb-2">404</h1>
          <p className="text-xl font-semibold font-display text-foreground mb-2">Page not found</p>
          <p className="text-sm text-muted-foreground font-body max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold font-display text-sm glow-primary hover:brightness-110 transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
