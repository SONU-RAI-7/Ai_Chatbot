import { useEffect, useState, useRef } from "react";
import { Loader } from "../Loader/Loader";
import { Controls } from "../Controls/Controls";
import styles from "./Chat.module.css";

// Simple function to strip markdown for AI messages
function cleanMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")   // bold
    .replace(/\*(.*?)\*/g, "$1")       // italics
    .replace(/(^|\n)[*-] /g, "$1")     // bullets
    .replace(/^#+\s+/gm, "")           // headers
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1"); // inline code
}

export function Chat({
  assistant,
  isActive = false,
  chatId,
  chatMessages,
  onChatMessagesUpdate,
  theme = "light",
  onChatTitleChange,
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);
  const localUpdateRef = useRef(false); // loop guard

  const formatTimestamp = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Listen on scroll to show/hide scroll down button
  useEffect(() => {
    const chatEl = chatContentRef.current;
    if (!chatEl) return;

    const onScroll = () => {
      const atBottom =
        Math.abs(chatEl.scrollHeight - chatEl.scrollTop - chatEl.clientHeight) < 20;
      setShowScrollDown(!atBottom);
    };

    chatEl.addEventListener("scroll", onScroll);
    return () => chatEl.removeEventListener("scroll", onScroll);
  }, []);

  /** Init from parent memory */
  useEffect(() => {
    const initializedMessages = chatMessages.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString(),
    }));
    setMessages(initializedMessages);
    if (assistant?.name === "googleai") assistant.createChat(initializedMessages);
    setTimeout(scrollToBottom, 100);
  }, [chatId, chatMessages, assistant]);

  /** Push local changes up to parent */
  useEffect(() => {
    if (localUpdateRef.current) {
      onChatMessagesUpdate(chatId, messages);
      localUpdateRef.current = false;
    }
    setTimeout(scrollToBottom, 50);
  }, [messages, chatId, onChatMessagesUpdate]);

  /** Utilities */
  const addMessage = (msg) => {
    localUpdateRef.current = true;
    setMessages((prev) => [
      ...prev,
      { ...msg, timestamp: msg.timestamp || new Date().toISOString() },
    ]);
  };

  const updateLastMessageContent = (content) => {
    localUpdateRef.current = true;
    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === prev.length - 1
          ? {
              ...m,
              content: `${m.content}${content}`,
              timestamp: new Date().toISOString(),
            }
          : m
      )
    );
  };

  const handleCopy = (text) => navigator.clipboard.writeText(text);
  const handleEdit = (i, c) => {
    setEditingIndex(i);
    setEditedContent(c);
  };
  const cancelEdit = () => setEditingIndex(null);

  /** Regenerate after edit */
  const regenerateResponse = async (editedIndex) => {
    const conversationHistory = messages.slice(0, editedIndex + 1);
    setIsLoading(true);
    try {
      if (messages[editedIndex + 1]?.role === "assistant") {
        localUpdateRef.current = true;
        setMessages((prev) => prev.slice(0, editedIndex + 1));
      }
      await processAssistantStream(
        conversationHistory[editedIndex].content,
        conversationHistory.filter(({ role }) => role !== "system")
      );
    } catch (err) {
      addMessage({ content: err?.message || "Error occurred.", role: "system" });
    }
  };

  const saveEdit = async (index) => {
    if (!editedContent.trim()) return;
    localUpdateRef.current = true;
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, content: editedContent, timestamp: new Date().toISOString() } : msg
      )
    );
    setEditingIndex(null);
    await regenerateResponse(index);
  };

  /** streaming assistant response handling (unchanged) */
  const processAssistantStream = async (userContent, history) => {
    const result = await assistant.chatStream(userContent, history);
    let isFirstChunk = false;
    let buffer = "";

    const imageRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif))/i;
    const videoRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm))/i;

    for await (const chunk of result) {
      buffer += chunk;

      if (imageRegex.test(buffer)) {
        addMessage({
          type: "image",
          content: buffer.match(imageRegex)[0],
          role: "assistant",
        });
        buffer = "";
        continue;
      }
      if (videoRegex.test(buffer)) {
        addMessage({
          type: "video",
          content: buffer.match(videoRegex)[0],
          role: "assistant",
        });
        buffer = "";
        continue;
      }

      try {
        const parsed = JSON.parse(buffer);
        if (parsed.buttons) {
          addMessage({ type: "buttons", buttons: parsed.buttons, role: "assistant" });
          buffer = "";
          continue;
        }
      } catch {}

      if (!isFirstChunk) {
        isFirstChunk = true;
        addMessage({ content: "", role: "assistant" });
        setIsLoading(false);
        setIsStreaming(true);
      }
      updateLastMessageContent(chunk);
    }

    if (buffer.trim()) {
      addMessage({ type: "text", content: buffer.trim(), role: "assistant" });
    }
    setIsStreaming(false);
  };

  /** Handle send new user input */
  const handleContentSend = async (content) => {
    if (!content.trim()) return;
    addMessage({ type: "text", content, role: "user" });

    if ((!chatMessages.title || !chatMessages.title.trim()) && onChatTitleChange) {
      const newTitle = content.length > 30 ? content.slice(0, 30) + "..." : content;
      onChatTitleChange(chatId, newTitle);
    }

    setIsLoading(true);
    try {
      await processAssistantStream(
        content,
        messages.filter(({ role }) => role !== "system")
      );
    } catch (err) {
      addMessage({ type: "text", content: err?.message || "Error occurred.", role: "system" });
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  /** Render content, removing Markdown for AI text */
  const renderMessageContent = (m) => {
    switch (m.type) {
      case "image":
        return <img src={m.content} alt="sent" className={styles.messageImage} />;
      case "video":
        return (
          <video controls className={styles.messageVideo}>
            <source src={m.content} type="video/mp4" />
          </video>
        );
      case "buttons":
        return (
          <div className={styles.quickReplies}>
            {m.buttons?.map((btn, i) => (
              <button
                key={i}
                onClick={() => handleContentSend(btn.value)}
                className={styles.quickReplyButton}
              >
                {btn.label}
              </button>
            ))}
          </div>
        );
      case "text":
      default:
        return <>{m.role === "assistant" ? cleanMarkdown(m.content) : m.content}</>;
    }
  };

  if (!isActive) return null;

  return (
    <div className={`${styles.chatContainer} ${theme === "dark" ? styles.dark : ""}`}>
      {isLoading && <Loader />}
      <div ref={chatContentRef} className={styles.chatContent}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.message} ${m.role === "user" ? styles.user : styles.assistant}`}
          >
            {editingIndex === i ? (
              <div className={styles.editContainer}>
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className={styles.editInput}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button onClick={() => saveEdit(i)} className={styles.editButton}>
                    Save &amp; Regenerate
                  </button>
                  <button onClick={cancelEdit} className={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.messageHeader}>
                  <span className={styles.timestamp}>{formatTimestamp(m.timestamp)}</span>
                  <div className={styles.messageActions}>
                    <button
                      onClick={() => handleCopy(m.content)}
                      title="Copy"
                      className={styles.actionButton}
                    >
                      ⎘
                    </button>
                    {m.role === "user" && (
                      <button
                        onClick={() => handleEdit(i, m.content)}
                        title="Edit"
                        className={styles.actionButton}
                      >
                        ✎
                      </button>
                    )}
                  </div>
                </div>
                <div className={styles.messageContent}>{renderMessageContent(m)}</div>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll down arrow */}
      {showScrollDown && (
        <button
          className={styles.scrollDownButton}
          onClick={() =>
            chatContentRef.current.scrollTo({
              top: chatContentRef.current.scrollHeight,
              behavior: "smooth",
            })
          }
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      <Controls isDisabled={isLoading || isStreaming} onSend={handleContentSend} theme={theme} />
    </div>
  );
}
