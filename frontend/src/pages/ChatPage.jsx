import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getChats, getChatMembers } from "../api/chats";
import Sidebar from "../components/Sidebar";
import ConversationView from "../components/ConversationView";
import "../styles/chat.css";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [titles, setTitles] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileView, setMobileView] = useState("list");

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getChats();
      setChats(list);

      const directChats = list.filter((c) => !c.is_group);
      const entries = await Promise.all(
        directChats.map(async (c) => {
          try {
            const members = await getChatMembers(c.chat_id);
            const other = members.find((m) => m.user_id !== user.id);
            return [c.chat_id, other?.login];
          } catch {
            return [c.chat_id, undefined];
          }
        })
      );
      setTitles(Object.fromEntries(entries.filter(([, login]) => login)));
    } catch (err) {
      setError(err.message || "Не удалось загрузить чаты");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleSelect = (chatId) => {
    setSelectedChatId(chatId);
    setMobileView("conversation");
  };

  const handleChatCreated = async (chatId) => {
    await loadChats();
    handleSelect(chatId);
  };

  const handleResolveTitle = useCallback((chatId, login) => {
    setTitles((prev) => (prev[chatId] === login ? prev : { ...prev, [chatId]: login }));
  }, []);

  const selectedChat = chats.find((c) => c.chat_id === selectedChatId) || null;

  return (
    <div className="app" data-view={mobileView}>
      <Sidebar
        chats={chats}
        titles={titles}
        selectedChatId={selectedChatId}
        onSelect={handleSelect}
        onChatCreated={handleChatCreated}
        user={user}
        onLogout={logout}
      />

      {selectedChat ? (
        <ConversationView
          key={selectedChat.chat_id}
          chat={selectedChat}
          currentUser={user}
          onBack={() => setMobileView("list")}
          onResolveTitle={handleResolveTitle}
        />
      ) : (
        <div className="conversation">
          <div className="conversation__empty">
            <span className="conversation__empty-mark">◆</span>
            <span className="conversation__empty-text">
              {loading ? "ЗАГРУЗКА ЧАТОВ…" : error ? error.toUpperCase() : "ВЫБЕРИТЕ ЧАТ ИЛИ СОЗДАЙТЕ НОВЫЙ"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
