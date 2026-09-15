import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/50 ${
        isDark
          ? "bg-[#1E293B] text-[#FFD21A] hover:bg-[#334155] border border-[#334155] shadow-sm shadow-black/20"
          : "bg-[#FAF9FD] text-[#5851A4] hover:text-[#1E2746] hover:bg-[#EAE4F7] border border-[#EAE4F7] shadow-xs"
      } ${className}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun
          className={`w-4 h-4 transition-all duration-200 transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100 text-[#FFD21A]"
              : "rotate-90 scale-0 opacity-0 absolute"
          }`}
          aria-hidden="true"
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 transition-all duration-200 transform ${
            !isDark
              ? "rotate-0 scale-100 opacity-100 text-[#5851A4]"
              : "-rotate-90 scale-0 opacity-0 absolute"
          }`}
          aria-hidden="true"
        />
      </div>

      {showLabel && (
        <span className="ml-2 text-xs font-bold select-none">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
