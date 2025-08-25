import { useEffect, useMemo, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

import { Sidebar } from "./components/Sidebar/Sidebar";
import { Chat } from "./components/Chat/Chat";
import { Assistant } from "./components/Assistant/Assistant";
import { Theme } from "./components/Theme/Theme";
import { SettingsModal } from "./components/SettingsModal/SettingsModal";
import { ExportImport } from "./components/ExportImport/ExportImport";
import { Notification } from "./components/Notification/Notification";


import styles from "./App.module.css";

function App() {
  const [assistant, setAssistant] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [theme, setTheme] = useState("light");
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const activeChat = useMemo(
    () => chats.find(({ id }) => id === activeChatId),
    [chats, activeChatId]
  );

  /** STEP 1 — load chats and theme on mount */
useEffect(() => {
    const savedChats = localStorage.getItem("chatHistory");
    const savedActiveChatId = localStorage.getItem("activeChatId");

    if (savedChats) {
      try {
        const parsed = JSON.parse(savedChats);
        setChats(parsed); // restore all chats

        // Restore active chat
        if (savedActiveChatId && parsed.some(c => c.id === savedActiveChatId)) {
          setActiveChatId(savedActiveChatId);
        } else if (parsed.length > 0) {
          setActiveChatId(parsed[parsed.length - 1].id);
        }
      } catch {
        console.error("Error restoring chat history");
      }
    }
  }, []); // ← runs only once on load


  /** persist changes */
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (activeChatId) {
      localStorage.setItem("activeChatId", activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Load theme
useEffect(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) setTheme(savedTheme);
}, []);

// Save theme
useEffect(() => {
  localStorage.setItem("theme", theme);
}, [theme]);


  const showNotification = useCallback((message, type = "info", duration = 3000) => {
    setNotification({ message, type });
    const timer = setTimeout(() => setNotification(null), duration);
    return () => clearTimeout(timer);
  }, []);

  const handleAssistantChange = useCallback((assistantObj) => {
    setAssistant(assistantObj);
    showNotification(`Assistant changed to ${assistantObj.name}`, "success");
  }, [showNotification]);

  const handleChatMessagesUpdate = useCallback((id, messages) => {
    const firstUserMsg = messages.find(m => m.role === "user");
    const dynamicTitle = firstUserMsg
      ? firstUserMsg.content.split(" ").slice(0, 7).join(" ")
      : "Untitled Chat";
    setChats(prev =>
      prev.map(chat =>
        chat.id === id
          ? { ...chat,
              title: chat.title?.trim() ? chat.title : dynamicTitle,
              messages,
              updatedAt: new Date().toISOString() }
          : chat
      )
    );
  }, []);

  const handleNewChatCreate = useCallback(() => {
    const id = uuidv4();
    const newChat = {
      id,
      title: "",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setChats(prev => [...prev, newChat]);
    setActiveChatId(id);
    showNotification("New chat created", "success");
  }, [showNotification]);

  const handleActiveChatIdChange = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const handleDeleteChat = useCallback((id) => {
    setChats(prev => prev.filter(chat => chat.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter(chat => chat.id !== id);
      if (remaining.length) {
        setActiveChatId(remaining[remaining.length - 1].id);
      } else {
        handleNewChatCreate();
      }
    }
    showNotification("Chat deleted", "warning");
  }, [activeChatId, chats, handleNewChatCreate, showNotification]);

  const handleExportChats = useCallback(() => {
    try {
      const data = JSON.stringify(chats, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      showNotification("Chats exported successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showNotification("Export failed", "error");
    }
  }, [chats, showNotification]);

  const handleImportChats = useCallback((data) => {
    try {
      if (!Array.isArray(data)) throw new Error("Invalid format");
      setChats(data);
      if (data.length > 0) {
        setActiveChatId(data[data.length - 1].id);
      } else {
        handleNewChatCreate();
      }
      showNotification("Chats imported successfully", "success");
    } catch (err) {
      console.error("Import failed:", err);
      showNotification("Import failed - invalid format", "error");
    }
  }, [handleNewChatCreate, showNotification]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <div className={`${styles.App} ${theme === "dark" ? styles.dark : ""}`}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <header className={styles.Header}>
        <img className={styles.Logo} src="/chat-bot.png" alt="Chatbot Logo" />
        <h2 className={styles.Title}>AI Chatbot</h2>
        <button
          className={styles.SettingsButton}
          onClick={() => setShowSettings(true)}
          aria-label="Open settings"
        >
          ⚙️
        </button>
      </header>

      <div className={styles.Content}>
        <Sidebar
          chats={chats}
          activeChatId={activeChatId}
          isCollapsed={isSidebarCollapsed}
          onActiveChatIdChange={handleActiveChatIdChange}
          onNewChatCreate={handleNewChatCreate}
          onDeleteChat={handleDeleteChat}
          onToggleCollapse={toggleSidebar}
          theme={theme}
        />

        <main className={`${styles.Main} ${isSidebarCollapsed ? styles.expanded : ""}`}>
          {activeChat && (
            <Chat
              key={activeChat.id}
              assistant={assistant}
              isActive
              chatId={activeChat.id}
              chatMessages={activeChat.messages}
              onChatMessagesUpdate={handleChatMessagesUpdate}
              theme={theme}
            />
          )}

          <div className={styles.Configuration}>
            <Assistant
              onAssistantChange={handleAssistantChange}
              currentAssistant={assistant?.name}
              theme={theme}
            />
            <Theme currentTheme={theme} onThemeChange={setTheme} />
            <ExportImport
              onExport={handleExportChats}
              onImport={handleImportChats}
              theme={theme}
            />
          </div>
        </main>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      )}
    </div>
  );
}

export default App;
