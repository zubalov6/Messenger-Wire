import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useChatSocket } from "../hooks/useChatSocket";
import MembersPanel from "../components/MembersPanel";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { day: "numeric", month: "long" });
}

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const { chats, labels, refreshChats } = useOutletContext();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState("");

  const listRef = useRef(null);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  const chat = chats.find((c) => c.chat_id === Number(chatId));
  const title = chat?.is_group ? chat.name || `Группа #${chatId}` : labels[chatId] || "…";
  const myMembership = members.find((m) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === "admin";

  const onSocketMessage = useCallback((data) => {
    if (data.type === "error") {
      setError(data.detail);
      return;
    }
    if (!data.message_id || seenIds.current.has(data.message_id)) return;
    seenIds.current.add(data.message_id);
    setMessages((prev) => [...prev, data]);
  }, []);

  const { status, send } = useChatSocket(chatId, onSocketMessage);

  useEffect(() => {
    let cancelled = false;
    seenIds.current = new Set();
    setMessages([]);
    setSearchQuery("");
    setSearchResults(null);
    setHasMore(true);
    setLoadingHistory(true);
    setError("");

    (async () => {
      try {
        const [msgs, mem] = await Promise.all([
          api.getMessages(chatId, { limit: 50 }),
          api.getMembers(chatId),
        ]);
        if (cancelled) return;
        msgs.forEach((m) => seenIds.current.add(m.message_id));
        setMessages(msgs);
        setMembers(mem);
        setHasMore(msgs.length === 50);
      } catch (err) {
        if (!cancelled) setError(err.detail || "Не удалось загрузить сообщения");
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId]);

  useEffect(() => {
    if (!loadingHistory) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [chatId, loadingHistory]);

  useEffect(() => {
    if (!loadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const container = listRef.current;
    const prevHeight = container?.scrollHeight || 0;
    try {
      const oldest = messages[0].message_id;
      const older = await api.getMessages(chatId, { before: oldest, limit: 50 });
      older.forEach((m) => seenIds.current.add(m.message_id));
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    } catch (err) {
      setError(err.detail || "Не удалось загрузить историю");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    if (listRef.current && listRef.current.scrollTop < 80) {
      loadMore();
    }
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    setError("");

    const sentOverSocket = send(value);
    if (!sentOverSocket) {
      try {
        const message = await api.sendMessage(chatId, value);
        if (!seenIds.current.has(message.message_id)) {
          seenIds.current.add(message.message_id);
          setMessages((prev) => [...prev, message]);
        }
      } catch (err) {
        setError(err.detail || "Сообщение не отправлено");
      }
    }
  };

  const runSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      setError("Минимум 2 символа для поиска");
      return;
    }
    setError("");
    try {
      const results = await api.searchMessages(chatId, searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      setError(err.detail || "Поиск не удался");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const shown = searchResults ?? messages;

  let lastDay = null;

  return (
    <div className="room">
      <header className="room-header">
        <div>
          <h1>{title}</h1>
          <span className={`status-pill status-${status}`}>
            {status === "open" ? "на связи" : status === "connecting" ? "выходим на связь" : "не в сети"}
          </span>
        </div>
        <div className="room-actions">
          <form className="search-form" onSubmit={runSearch}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по каналу…"
            />
            {searchResults ? (
              <button type="button" className="text-btn" onClick={clearSearch}>
                сброс
              </button>
            ) : (
              <button type="submit" className="text-btn">
                найти
              </button>
            )}
          </form>
          <button className="btn btn-secondary" onClick={() => setMembersOpen(true)}>
            Участники ({members.length})
          </button>
        </div>
      </header>

      {error && <div className="form-error room-error">{error}</div>}

      <div className="message-list" ref={listRef} onScroll={handleScroll}>
        {loadingHistory && <div className="empty-hint">Поднимаем архив…</div>}
        {loadingMore && <div className="empty-hint">Загружаем историю…</div>}
        {!loadingHistory && shown.length === 0 && (
          <div className="empty-hint">
            {searchResults ? "Ничего не найдено." : "Пока тишина в эфире. Скажите первое слово."}
          </div>
        )}

        {shown.map((m) => {
          const day = formatDay(m.created_at);
          const showDivider = day !== lastDay && !searchResults;
          lastDay = day;
          const mine = m.user_id === user?.id;
          const author = members.find((mm) => mm.user_id === m.user_id)?.login || `#${m.user_id}`;

          return (
            <div key={m.message_id}>
              {showDivider && <div className="day-divider">{day}</div>}
              <div className={`message-row ${mine ? "mine" : ""}`}>
                <div className="message-bubble">
                  {!mine && <div className="message-author">{author}</div>}
                  <div className="message-text">{m.text}</div>
                  <div className="message-time">{formatTime(m.created_at)}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={submitMessage}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Передать сообщение…"
          autoComplete="off"
        />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
          Отправить
        </button>
      </form>

      {membersOpen && (
        <MembersPanel
          chatId={chatId}
          members={members}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          onClose={() => setMembersOpen(false)}
          onChanged={async () => {
            const mem = await api.getMembers(chatId);
            setMembers(mem);
            refreshChats();
          }}
        />
      )}
    </div>
  );
}
