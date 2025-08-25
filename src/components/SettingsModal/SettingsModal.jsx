import { useEffect, useRef, useState } from "react";
import styles from "./SettingsModal.module.css";

export function SettingsModal({
  onClose,
  currentTheme,
  onThemeChange,
  currentFontSize = "medium",
  onFontSizeChange,
  currentBubbleStyle = "rounded",
  onBubbleStyleChange,
  showTimestamps = true,
  onToggleTimestamps,
  onSave
}) {
  const overlayRef = useRef(null);

  // Local state so changes aren't applied until Save
  const [theme, setTheme] = useState(currentTheme);
  const [fontSize, setFontSize] = useState(currentFontSize);
  const [bubbleStyle, setBubbleStyle] = useState(currentBubbleStyle);
  const [timestamps, setTimestamps] = useState(showTimestamps);

  // Close on outside click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Save changes and call callback
  const handleSave = () => {
    onThemeChange(theme);
    onFontSizeChange?.(fontSize);
    onBubbleStyleChange?.(bubbleStyle);
    onToggleTimestamps?.(timestamps);
    onSave?.({ theme, fontSize, bubbleStyle, timestamps });
    onClose();
  };

  return (
    <div
      className={styles.modalOverlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>⚙ Settings</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            &times;
          </button>
        </div>

        <div className={styles.settingsGroup}>
          <h3>🎨 Appearance</h3>

          <div className={styles.settingItem}>
            <label>Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={styles.select}
            >
              <option value="light">☀ Light</option>
              <option value="dark">🌙 Dark</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <label>Font Size</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className={styles.select}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <label>Chat Bubble Style</label>
            <select
              value={bubbleStyle}
              onChange={(e) => setBubbleStyle(e.target.value)}
              className={styles.select}
            >
              <option value="classic">Classic</option>
              <option value="rounded">Rounded</option>
            </select>
          </div>

          <div className={styles.settingItem}>
            <label>
              <input
                type="checkbox"
                checked={timestamps}
                onChange={(e) => setTimestamps(e.target.checked)}
              />
              Show message timestamps
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
