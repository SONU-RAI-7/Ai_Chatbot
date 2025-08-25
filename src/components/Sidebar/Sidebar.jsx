import { useState, useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";

export function Sidebar({
  chats,
  activeChatId,
  onActiveChatIdChange,
  onNewChatCreate,
  onDeleteChat,
  onRenameChat,
  isCollapsed = false,
  onToggleCollapse,
  theme = "light",
}) {
  const [isOpen, setIsOpen] = useState(!isCollapsed);
  const [searchTerm, setSearchTerm] = useState("");
  const [renamingChatId, setRenamingChatId] = useState(null);
  const [renameText, setRenameText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const sidebarRef = useRef(null);

  // Keep sidebar open/collapsed in sync with parent state
  useEffect(() => {
    setIsOpen(!isCollapsed);
  }, [isCollapsed]);

  // Close sidebar if clicked outside on mobile/tablet
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsOpen(false);
        onToggleCollapse?.(true);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onToggleCollapse]);

  const handleSidebarToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggleCollapse?.(!newState);
  };

  const handleChatClick = (chatId) => {
    onActiveChatIdChange(chatId);
    if (window.innerWidth < 768) {
      setIsOpen(false);
      onToggleCollapse?.(true);
    }
    setRenamingChatId(null);
    setDeleteConfirmId(null);
  };

  const handleDeleteClick = (chatId, e) => {
    e.stopPropagation();
    setDeleteConfirmId(chatId);
    setRenamingChatId(null);
  };
  const confirmDelete = (chatId) => {
    onDeleteChat(chatId);
    setDeleteConfirmId(null);
  };
  const cancelDelete = () => setDeleteConfirmId(null);

  const startRename = (chatId, currentTitle, e) => {
    e.stopPropagation();
    setRenamingChatId(chatId);
    setRenameText(currentTitle);
    setDeleteConfirmId(null);
  };

  const handleRenameChange = (e) => setRenameText(e.target.value);
  const commitRename = (chatId) => {
    const trimmed = renameText.trim();
    if (trimmed && onRenameChat) onRenameChat(chatId, trimmed);
    setRenamingChatId(null);
  };
  const handleRenameKeyDown = (e, chatId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename(chatId);
    } else if (e.key === "Escape") {
      setRenamingChatId(null);
    }
  };

  const getChatTitle = (chat) => {
    if (chat.title?.trim()) return chat.title;
    if (chat.messages.length > 0) {
      const firstMsg = chat.messages[0].content || "";
      return firstMsg.length > 30 ? firstMsg.slice(0, 30) + "..." : firstMsg;
    }
    return "Untitled Chat";
  };

  // Filter and sort chats
  const filteredChats = chats
    .filter((chat) =>
      getChatTitle(chat).toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <>
      <button
        className={`${styles.menuButton} ${theme === "dark" ? styles.dark : ""}`}
        onClick={handleSidebarToggle}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        aria-expanded={isOpen}
      >
        ☰
      </button>

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.open : ""} ${
          theme === "dark" ? styles.dark : ""
        }`}
      >
        <header className={styles.header}>
          <button
            className={`${styles.newChatButton} ${theme === "dark" ? styles.dark : ""}`}
            onClick={onNewChatCreate}
          >
            + New Chat
          </button>
          <button
            className={styles.closeButton}
            onClick={handleSidebarToggle}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </header>

        <div className={styles.searchContainer}>
          <input
            type="search"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <ul className={styles.chatList}>
          {filteredChats.length === 0 && (
            <li className={styles.emptyState}>No conversations found</li>
          )}

          {filteredChats.map((chat) => (
            <li
              key={chat.id}
              className={`${styles.chatItem} ${
                chat.id === activeChatId ? styles.active : ""
              }`}
              onClick={() => handleChatClick(chat.id)}
            >
              {renamingChatId === chat.id ? (
                <input
                  value={renameText}
                  onChange={handleRenameChange}
                  onBlur={() => commitRename(chat.id)}
                  onKeyDown={(e) => handleRenameKeyDown(e, chat.id)}
                  autoFocus
                  className={styles.renameInput}
                />
              ) : (
                <div className={styles.chatContent}>
                  <span className={styles.chatTitle}>{getChatTitle(chat)}</span>
                  <div className={styles.chatActions}>
                    {deleteConfirmId === chat.id ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(chat.id);
                          }}
                          className={styles.confirmDelete}
                        >
                          ✔
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelDelete();
                          }}
                          className={styles.cancelDelete}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startRename(chat.id, chat.title, e)}
                          className={styles.renameButton}
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(chat.id, e)}
                          className={styles.deleteButton}
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {isOpen && <div className={styles.overlay} onClick={handleSidebarToggle} />}
    </>
  );
}
