import { useTheme } from "../../context/ThemeContext";

const DarkModeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition"
    >
      {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
    </button>
  );
};

export default DarkModeToggle;