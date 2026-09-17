import { useState } from "react";
import { api } from "../api/client";

export default function NewChatModal({ onClose, onCreated }) {
  const [mode, setMode] = useState("direct"); // direct | group
  const [userId, setUserId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      let chat;
      if (mode === "direct") {
        const id = Number(userId);
        if (!id) throw { detail: "Укажите числовой ID пользователя" };
        chat = await api.createDirectChat(id);
      } else {
        const ids = memberIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number);
        if (!groupName.trim()) throw { detail: "Укажите название группы" };
        if (ids.length === 0 || ids.some((n) => !n)) {
          throw { detail: "Укажите ID участников через запятую" };
        }
        chat = await api.createGroupChat(groupName.trim(), ids);
      }
      onCreated(chat.chat_id);
    } catch (err) {
      setError(err.detail || "Не удалось создать чат");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Новый канал</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="segmented">
          <button
            type="button"
            className={mode === "direct" ? "active" : ""}
            onClick={() => setMode("direct")}
          >
            Личный
          </button>
          <button
            type="button"
            className={mode === "group" ? "active" : ""}
            onClick={() => setMode("group")}
          >
            Группа
          </button>
        </div>

        <form onSubmit={submit} className="modal-form">
          {mode === "direct" ? (
            <label className="field">
              <span>ID собеседника</span>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="напр. 4"
                inputMode="numeric"
                required
              />
            </label>
          ) : (
            <>
              <label className="field">
                <span>Название группы</span>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Позывной группы"
                  required
                />
              </label>
              <label className="field">
                <span>ID участников (через запятую)</span>
                <input
                  value={memberIds}
                  onChange={(e) => setMemberIds(e.target.value)}
                  placeholder="напр. 2, 5, 7"
                  required
                />
              </label>
            </>
          )}

          <p className="hint">
            Пока в системе нет поиска пользователей по имени — узнайте числовой ID у
            собеседника.
          </p>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Открываем канал…" : "Создать"}
          </button>
        </form>
      </div>
    </div>
  );
}
