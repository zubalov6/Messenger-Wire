import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import NewChatModal from "../components/NewChatModal";

export default function ChatsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.getChats();
      setChats(list);

      const directChats = list.filter((c) => !c.is_group);
      const entries = await Promise.all(
        directChats.map(async (c) => {
          try {
            const members = await api.getMembers(c.chat_id);
            const other = members.find((m) => m.user_id !== user.id);
            return [c.chat_id, other?.login || `Чат #${c.chat_id}`];
          } catch {
            return [c.chat_id, `Чат #${c.chat_id}`];
          }
        })
      );
      setLabels(Object.fromEntries(entries));
    } catch (err) {
      setError(err.detail || "Не удалось загрузить чаты");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const displayName = (chat) =>
    chat.is_group ? chat.name || `Группа #${chat.chat_id}` : labels[chat.chat_id] || "…";

  const handleCreated = (chatId) => {
    setModalOpen(false);
    loadChats();
    navigate(`/chats/${chatId}`);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <span className="signal-dot" />
            <span className="brand-mark">RELAY</span>
          </div>
          <button className="icon-btn" onClick={logout} title="Выйти" aria-label="Выйти">
            ⏻
          </button>
        </div>

        <div className="me-strip">
          <span className="me-avatar">{(user?.login || "?")[0]?.toUpperCase()}</span>
          <div>
            <div className="me-login">{user?.login}</div>
            <div className="me-id">ID {user?.id}</div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => setModalOpen(true)}>
          + Новый канал
        </button>

        {error && <div className="form-error">{error}</div>}

        <nav className="chat-list">
          {loading && <div className="empty-hint">Загружаем эфир…</div>}
          {!loading && chats.length === 0 && (
            <div className="empty-hint">Каналов пока нет. Создайте первый.</div>
          )}
          {chats.map((chat) => (
            <NavLink
              key={chat.chat_id}
              to={`/chats/${chat.chat_id}`}
              className={({ isActive }) => `chat-list-item ${isActive ? "active" : ""}`}
            >
              <span className={`chip ${chat.is_group ? "chip-group" : "chip-direct"}`}>
                {chat.is_group ? "GRP" : "DM"}
              </span>
              <span className="chat-list-name">{displayName(chat)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="chat-main">
        <Outlet context={{ chats, labels, refreshChats: loadChats }} />
      </main>

      {modalOpen && (
        <NewChatModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
