import { motion } from "framer-motion";
import { Zap } from "lucide-react";

/**
 * Unified Skillora Logo Component
 * Ensures identical brand icon, gradient, squircle corners, and text styling across the app.
 */
const Logo = ({ size = "md", showText = true, textClass = "", className = "" }) => {
  const sizes = {
    sm: { box: "w-7 h-7 rounded-lg", icon: 14, text: "text-base" },
    md: { box: "w-9 h-9 rounded-xl", icon: 17, text: "text-lg" },
    lg: { box: "w-11 h-11 rounded-2xl", icon: 22, text: "text-2xl" },
  }[size] || { box: "w-9 h-9 rounded-xl", icon: 17, text: "text-lg" };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative shrink-0">
        {/* Glow backdrop */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #7C6FFF 0%, #5B52F0 100%)",
            filter: "blur(10px)",
            opacity: 0.65,
            transform: "scale(1.15)",
          }}
        />
        {/* Icon box container */}
        <div
          className={`relative ${sizes.box} flex items-center justify-center`}
          style={{
            background: "linear-gradient(145deg, #7C6FFF 0%, #5B52F0 100%)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.18), 0 4px 16px rgba(91,82,240,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <Zap size={sizes.icon} className="text-white fill-white" strokeWidth={2.8} />
        </div>
      </div>

      {showText && (
        <span
          className={`font-black tracking-tight ${sizes.text} ${textClass}`}
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #C4B5FD 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "Sora, Inter, sans-serif",
          }}
        >
          Skillora
        </span>
      )}
    </div>
  );
};

export default Logo;
