import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./Theme.module.css";

export function Theme({
  currentTheme = "system",
  onThemeChange,
  showLabel = true,
  variant = "default", // "default" | "compact" | "icon-only"
  position = "bottom-start", // dropdown positioning
}) {
  const [theme, setTheme] = useState(currentTheme);
  const [isOpen, setIsOpen] = useState(false);
  const themeRef = useRef(null);
  const buttonRef = useRef(null);

  // Helper: detect system theme
  const getSystemTheme = useCallback(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Apply theme to root HTML
  const applyTheme = useCallback(
    (newTheme) => {
      const effectiveTheme = newTheme === "system" ? getSystemTheme() : newTheme;
      document.documentElement.setAttribute("data-theme", effectiveTheme);
      onThemeChange?.(newTheme);
      localStorage.setItem("theme", newTheme);
    },
    [getSystemTheme, onThemeChange]
  );

  // On mount: load stored theme, listen for system theme changes
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "system";
    setTheme(storedTheme);
    applyTheme(storedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (storedTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [applyTheme]);

  // Keep sync with parent theme state
  useEffect(() => {
    if (currentTheme !== theme) {
      setTheme(currentTheme);
      applyTheme(currentTheme);
    }
  }, [currentTheme, applyTheme, theme]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const getThemeIcon = (t) => {
    switch (t) {
      case "light":
        return "☀️";
      case "dark":
        return "🌙";
      case "system":
      default:
        return "🌓";
    }
  };

  return (
    <div
      ref={themeRef}
      className={`${styles.themeContainer} ${styles[variant]} ${styles[position]}`}
    >
      {variant !== "icon-only" && showLabel && (
        <span className={styles.label}>Theme:</span>
      )}

      <div className={styles.selectorWrapper}>
        <button
          ref={buttonRef}
          className={styles.selectorButton}
          onClick={toggleDropdown}
          aria-label="Theme selector"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {getThemeIcon(theme)}
          {variant !== "icon-only" && (
            <span className={styles.currentTheme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </span>
          )}
          <span className={styles.dropdownIcon}>▾</span>
        </button>

        {isOpen && (
          <div
            className={styles.dropdownMenu}
            role="listbox"
            tabIndex="-1"
            aria-label="Theme options"
          >
            <button
              role="option"
              aria-selected={theme === "light"}
              className={`${styles.themeOption} ${
                theme === "light" ? styles.active : ""
              }`}
              onClick={() => handleThemeChange("light")}
            >
              ☀️ Light
            </button>
            <button
              role="option"
              aria-selected={theme === "dark"}
              className={`${styles.themeOption} ${
                theme === "dark" ? styles.active : ""
              }`}
              onClick={() => handleThemeChange("dark")}
            >
              🌙 Dark
            </button>
            <button
              role="option"
              aria-selected={theme === "system"}
              className={`${styles.themeOption} ${
                theme === "system" ? styles.active : ""
              }`}
              onClick={() => handleThemeChange("system")}
            >
              🌓 System
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
