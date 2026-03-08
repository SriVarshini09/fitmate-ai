import { motion } from "framer-motion";
import TabletTracker from "@/components/dashboard/TabletTracker";

const Tablets = () => {
  return (
    <motion.div
      className="max-w-2xl mx-auto px-4 py-6 space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        <p className="text-sm text-muted-foreground font-body">Track your daily</p>
        <h1 className="text-2xl font-bold font-display text-gradient-primary">Tablets & Supplements</h1>
      </div>
      <TabletTracker />
    </motion.div>
  );
};

export default Tablets;
