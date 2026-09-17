import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getChatMembers } from "../api/chats";
import { getMessages, searchMessages, sendMessage } from "../api/messages";
import { useChatSocket } from "../hooks/useChatSocket";
import MessagesList from "./MessagesList";
import Composer from "./Composer";
import MembersPanel from "./MembersPanel";
import { initials } from "../utils/format";

export default function ConversationView({ chat, currentUser, onBack, onResolveTitle }) {
  const chatId = chat.chat_id;

  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [membersPanelOpen, setMembersPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const scrollRef = useRef(null);
  const pendingScrollAdjust = useRef(null);
  const scrollToBottomNext = useRef(true);

  const loginsById = Object.fromEntries(members.map((m) => [m.user_id, m.login]));
  const isAdmin = members.find((m) => m.user_id === currentUser.id)?.role === "admin";

  const otherMember = !chat.is_group ? members.find((m) => m.user_id !== currentUser.id) : null;
  const title = chat.is_group ? chat.name || "Без названия" : otherMember?.login || `Личный чат #${chatId}`;

  const refreshMembers = useCallback(async () => {
    const list = await getChatMembers(chatId);
    setMembers(list);
    if (!chat.is_group) {
      const other = list.find((m) => m.user_id !== currentUser.id);
      if (other) onResolveTitle(chatId, other.login);
    }
  }, [chatId, chat.is_group, currentUser.id, onResolveTitle]);

  // load members + first page of messages whenever the selected chat changes
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setLoadError("");
    setMessages([]);
    setSearchOpen(false);
    setSearchResults(null);
    scrollToBottomNext.current = true;

    (async () => {
      try {
        const [memberList, messageList] = await Promise.all([
          getChatMembers(chatId),
          getMessages(chatId, { limit: 50 }),
        ]);
        if (cancelled) return;
        setMembers(memberList);
        setMessages(messageList);
        setHasMore(messageList.length === 50);
        if (!chat.is_group) {
          const other = memberList.find((m) => m.user_id !== currentUser.id);
          if (other) onResolveTitle(chatId, other.login);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Не удалось загрузить чат");
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const handleIncoming = useCallback((data) => {
    if (data.type && data.type !== "message") return;
    setMessages((prev) => {
      if (prev.some((m) => m.message_id === data.message_id)) return prev;
      scrollToBottomNext.current = true;
      return [...prev, data];
    });
  }, []);

  const { status: wsStatus, send: wsSend } = useChatSocket(chatId, handleIncoming);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (pendingScrollAdjust.current !== null) {
      el.scrollTop = el.scrollHeight - pendingScrollAdjust.current;
      pendingScrollAdjust.current = null;
      return;
    }

    if (scrollToBottomNext.current) {
      el.scrollTop = el.scrollHeight;
      scrollToBottomNext.current = false;
    }
  }, [messages]);

  const loadMore = async () => {
    if (loadingMore || messages.length === 0) return;
    const el = scrollRef.current;
    pendingScrollAdjust.current = el ? el.scrollHeight : null;
    setLoadingMore(true);
    try {
      const earliest = messages[0].message_id;
      const older = await getMessages(chatId, { before: earliest, limit: 50 });
      setMessages((prev) => [...older, ...prev]);
      setHasMore(older.length === 50);
    } catch {
      pendingScrollAdjust.current = null;
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSend = async (text) => {
    const sentViaSocket = wsSend(text);
    if (sentViaSocket) return;
    try {
      const message = await sendMessage(chatId, text);
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === message.message_id)) return prev;
        scrollToBottomNext.current = true;
        return [...prev, message];
      });
    } catch {
      // composer keeps the text on failure would be nicer; kept minimal here
    }
  };

  const runSearch = async (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const results = await searchMessages(chatId, q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchResults(null);
    setSearchQuery("");
  };

  const displayedMessages = searchResults ?? messages;

  return (
    <div className="conversation">
      <div className="conv-head">
        <button className="conv-head__back" onClick={onBack} aria-label="Назад к чатам">
          ‹
        </button>
        <span className="conv-head__avatar">{chat.is_group ? "#" : initials(title)}</span>
        <div>
          <div className="conv-head__title">{title}</div>
          <div className="conv-head__status">
            <span className={`conv-head__dot${wsStatus === "open" ? " conv-head__dot--live" : ""}`} />
            {wsStatus === "open" ? "на линии" : wsStatus === "connecting" ? "соединение…" : "офлайн"}
          </div>
        </div>
        <div className="conv-head__spacer" />
        <button
          className={`conv-head__icon-btn${searchOpen ? " conv-head__icon-btn--active" : ""}`}
          onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
        >
          Поиск
        </button>
        {chat.is_group && (
          <button className="conv-head__icon-btn" onClick={() => setMembersPanelOpen(true)}>
            Участники · {members.length}
          </button>
        )}
      </div>

      {searchOpen && (
        <form className="conv-search" onSubmit={runSearch}>
          <input
            className="field__input"
            placeholder="Искать сообщения в этом чате…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <button className="btn btn--primary btn--small" type="submit" disabled={searching}>
            {searching ? "…" : "Найти"}
          </button>
          <button className="btn btn--ghost btn--small" type="button" onClick={closeSearch}>
            Сброс
          </button>
        </form>
      )}

      {loadError && <div className="conv-toast">{loadError}</div>}

      {!initialLoading && (
        <MessagesList
          ref={scrollRef}
          messages={displayedMessages}
          currentUserId={currentUser.id}
          loginsById={loginsById}
          hasMore={!searchResults && hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          isGroup={chat.is_group}
        />
      )}

      <Composer onSend={handleSend} disabled={initialLoading} />

      {membersPanelOpen && (
        <MembersPanel
          chatId={chatId}
          isAdmin={isAdmin}
          members={members}
          currentUserId={currentUser.id}
          onClose={() => setMembersPanelOpen(false)}
          onRefresh={refreshMembers}
        />
      )}
    </div>
  );
}
