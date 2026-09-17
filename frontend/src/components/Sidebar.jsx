import { useState } from "react";
import NewChatPanel from "./NewChatPanel";
import { initials } from "../utils/format";

export default function Sidebar({ chats, titles, selectedChatId, onSelect, onChatCreated, user, onLogout }) {
  const [showNew, setShowNew] = useState(false);

  const handleCreated = (chatId) => {
    setShowNew(false);
    onChatCreated(chatId);
  };

  return (
    <div className="sidebar">
      <div className="sidebar__head">
        <div className="sidebar__brand">
          <span className="sidebar__brand-mark">◆</span>
          Wire
        </div>
      </div>

      <div className="sidebar__user">
        <span className="sidebar__avatar">{initials(user?.login)}</span>
        <div>
          <div className="sidebar__user-name">{user?.login}</div>
          <div className="sidebar__user-id">ID {user?.id}</div>
        </div>
        <button className="sidebar__logout" onClick={onLogout}>
          Выйти
        </button>
      </div>

      <div className="sidebar__new">
        {!showNew && (
          <button className="sidebar__new-btn" onClick={() => setShowNew(true)}>
            + Новый чат
          </button>
        )}
      </div>

      {showNew && <NewChatPanel onCreated={handleCreated} onClose={() => setShowNew(false)} />}

      <div className="sidebar__list">
        {chats.length === 0 && (
          <div className="sidebar__empty">
            Пока нет ни одного чата. Начните переписку через «Новый чат».
          </div>
        )}
        {chats.map((chat) => {
          const title = chat.is_group ? chat.name || "Без названия" : titles[chat.chat_id] || `Личный чат #${chat.chat_id}`;
          return (
            <button
              key={chat.chat_id}
              className={`chat-row${chat.chat_id === selectedChatId ? " chat-row--active" : ""}`}
              onClick={() => onSelect(chat.chat_id)}
            >
              <span className="chat-row__avatar">{chat.is_group ? "#" : initials(title)}</span>
              <span className="chat-row__body">
                <div className="chat-row__title">{title}</div>
                <div className="chat-row__meta">{chat.is_group ? "группа" : "личный чат"}</div>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
