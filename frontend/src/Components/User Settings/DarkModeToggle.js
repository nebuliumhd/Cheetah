/** ABSTRACT: DarkModeToggle.js
 *
 *  DESCRIPTION:
 *  Provides a UI control for switching between light and dark themes.
 *  Uses ThemeContext to read the current theme state and to toggle the theme.
 *  Dynamically updates the button label and styling based on the active theme.
 *
 *  RESPONSIBILITIES:
 *  - Access the current theme (darkMode) via ThemeContext.
 *  - Trigger the toggleTheme function when the button is clicked.
 *  - Update the button text and styling according to the theme state.
 *
 *  FUNCTIONS:
 *  - DarkModeToggle():
 *      Functional component that renders the toggle button and handles click events.
 *
 *  HOOKS / STATE:
 *  - useTheme():
 *      Provides darkMode boolean and toggleTheme function from the ThemeContext.
 *
 *  REVISION HISTORY ABSTRACT:
 *  PROGRAMMER: Aabaan Samad
 *
 *  END ABSTRACT
 **/

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