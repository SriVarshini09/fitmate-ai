import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { VoiceState } from "@/hooks/useVoiceInput";

interface VoiceButtonProps {
  state: VoiceState;
  interimTranscript: string;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onDismiss: () => void;
}

const VoiceButton = ({ state, interimTranscript, isSupported, onStart, onStop, onDismiss }: VoiceButtonProps) => {
  if (!isSupported) return null;

  return (
    <>
      {/* Transcript bubble */}
      <AnimatePresence>
        {state === "listening" && interimTranscript && (
          <motion.div
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="glass-card-strong px-4 py-3 rounded-2xl text-center">
              <p className="text-sm text-foreground font-body italic">"{interimTranscript}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Listening label */}
      <AnimatePresence>
        {state === "listening" && (
          <motion.div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-xs text-primary font-body font-medium">Listening... tap to stop</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating mic button */}
      <div className="fixed bottom-20 right-5 z-50 flex flex-col items-center gap-2">
        <AnimatePresence>
          {state === "listening" && (
            <motion.button
              key="dismiss"
              onClick={onDismiss}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shadow-lg"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button
          onClick={state === "listening" ? onStop : onStart}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors ${
            state === "listening"
              ? "bg-destructive"
              : "bg-primary glow-primary"
          }`}
          whileTap={{ scale: 0.92 }}
        >
          {/* Pulse rings when listening */}
          {state === "listening" && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full bg-destructive/40"
                animate={{ scale: [1, 1.7, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-destructive/20"
                animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
          {state === "listening" ? (
            <MicOff className="w-6 h-6 text-white relative z-10" />
          ) : (
            <Mic className="w-6 h-6 text-primary-foreground relative z-10" />
          )}
        </motion.button>
      </div>
    </>
  );
};

export default VoiceButton;
