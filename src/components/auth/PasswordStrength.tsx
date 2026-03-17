import { motion } from "framer-motion";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-400" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-yellow-400" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-blue-400" };
  return { score: 4, label: "Strong", color: "bg-primary" };
}

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? color : "bg-white/10"
            }`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
          />
        ))}
      </div>
      <p className={`text-xs font-body ${score <= 1 ? "text-red-400" : score <= 2 ? "text-yellow-400" : score <= 3 ? "text-blue-400" : "text-primary"}`}>
        {label} password
      </p>
    </div>
  );
};

export default PasswordStrength;
