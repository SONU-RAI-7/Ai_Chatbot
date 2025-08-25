import { useRef, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import styles from "./Messages.module.css";

export function Messages({ messages, isStreaming, showTimestamps = true }) {
  const messagesEndRef = useRef(null);

  const messagesGroups = useMemo(
    () =>
      messages.reduce((groups, message) => {
        if (message.role === "user") groups.push([]);
        groups[groups.length - 1].push(message);
        return groups;
      }, []),
    [messages]
  );

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Smooth scroll to bottom when messages or streaming state changes
  useEffect(() => {
    // Small delay ensures DOM is updated before scrolling
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timeout);
  }, [messages, isStreaming]);

  return (
    <div className={styles.Messages}>
      {messagesGroups.map((groupMessages, groupIndex) => (
        <div key={groupIndex} className={styles.Group}>
          {groupMessages.map(({ role, content, timestamp }, index) => (
            <div key={index} className={styles.Message} data-role={role}>
              <Markdown>{content}</Markdown>
              {showTimestamps && (
                <span className={styles.timestamp}>{formatTime(timestamp)}</span>
              )}
            </div>
          ))}
        </div>
      ))}

      {isStreaming && (
        <div className={styles.Message} data-role="assistant">
          <TypingDots />
        </div>
      )}

      <div ref={messagesEndRef} /> {/* End marker */}
    </div>
  );
}

function TypingDots() {
  return (
    <span className={styles.TypingWrapper}>
      <span className={styles.typingDot}></span>
      <span className={styles.typingDot}></span>
      <span className={styles.typingDot}></span>
    </span>
  );
}
