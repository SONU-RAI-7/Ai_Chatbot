import { useEffect } from "react";
import styles from "./Notification.module.css";

export function Notification({ message, type = "info", onClose, autoClose = 200000 }) {
  if (!message) return null;

  // Auto close after a set time
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <span className={styles.message}>{message}</span>
      <button
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
}
