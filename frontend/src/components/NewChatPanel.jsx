import { useState } from "react";
import { createDirectChat, createGroupChat } from "../api/chats";

export default function NewChatPanel({ onCreated, onClose }) {
  const [tab, setTab] = useState("direct");
  const [userId, setUserId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submitDirect = async (e) => {
    e.preventDefault();
    setError("");
    const id = Number(userId);
    if (!id || id <= 0) {
      setError("Укажите числовой ID пользователя");
      return;
    }
    setBusy(true);
    try {
      const res = await createDirectChat(id);
      onCreated(res.chat_id);
    } catch (err) {
      setError(err.message || "Не удалось создать чат");
    } finally {
      setBusy(false);
    }
  };

  const submitGroup = async (e) => {
    e.preventDefault();
    setError("");
    const name = groupName.trim();
    if (!name) {
      setError("Укажите название группы");
      return;
    }
    const ids = memberIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number);

    if (!ids.length || ids.some((id) => !id || id <= 0)) {
      setError("Укажите ID участников через запятую, например 2, 5, 7");
      return;
    }

    setBusy(true);
    try {
      const res = await createGroupChat(name, ids);
      onCreated(res.chat_id);
    } catch (err) {
      setError(err.message || "Не удалось создать группу");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="new-panel">
      <div className="new-panel__tabs">
        <button
          type="button"
          className={`new-panel__tab${tab === "direct" ? " new-panel__tab--active" : ""}`}
          onClick={() => setTab("direct")}
        >
          Личный чат
        </button>
        <button
          type="button"
          className={`new-panel__tab${tab === "group" ? " new-panel__tab--active" : ""}`}
          onClick={() => setTab("group")}
        >
          Группа
        </button>
      </div>

      {tab === "direct" ? (
        <form onSubmit={submitDirect}>
          <p className="new-panel__hint">Введите ID собеседника, чтобы открыть или продолжить с ним личную переписку.</p>
          <div className="new-panel__row">
            <input
              className="field__input"
              inputMode="numeric"
              placeholder="ID пользователя"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoFocus
            />
          </div>
          {error && <div className="auth__error" style={{ marginTop: 10 }}>{error}</div>}
          <div className="new-panel__actions">
            <button className="btn btn--ghost btn--small" type="button" onClick={onClose}>
              Отмена
            </button>
            <button className="btn btn--primary btn--small" type="submit" disabled={busy}>
              {busy ? "Открытие…" : "Открыть чат"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitGroup}>
          <p className="new-panel__hint">Название группы и ID участников через запятую.</p>
          <div className="field" style={{ marginBottom: 8 }}>
            <input
              className="field__input"
              placeholder="Название группы"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <input
              className="field__input"
              placeholder="ID участников: 2, 5, 7"
              value={memberIds}
              onChange={(e) => setMemberIds(e.target.value)}
            />
          </div>
          {error && <div className="auth__error" style={{ marginTop: 10 }}>{error}</div>}
          <div className="new-panel__actions">
            <button className="btn btn--ghost btn--small" type="button" onClick={onClose}>
              Отмена
            </button>
            <button className="btn btn--primary btn--small" type="submit" disabled={busy}>
              {busy ? "Создание…" : "Создать группу"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
