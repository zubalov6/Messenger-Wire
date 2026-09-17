import { useState } from "react";
import { addMember, removeMember } from "../api/chats";
import { initials } from "../utils/format";

export default function MembersPanel({ chatId, isAdmin, members, currentUserId, onClose, onRefresh }) {
  const [newUserId, setNewUserId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    const id = Number(newUserId);
    if (!id || id <= 0) {
      setError("Укажите числовой ID пользователя");
      return;
    }
    setBusy(true);
    try {
      await addMember(chatId, id);
      setNewUserId("");
      await onRefresh();
    } catch (err) {
      setError(err.message || "Не удалось добавить участника");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (userId) => {
    setError("");
    try {
      await removeMember(chatId, userId);
      await onRefresh();
    } catch (err) {
      setError(err.message || "Не удалось удалить участника");
    }
  };

  return (
    <div className="members-overlay" onClick={onClose}>
      <div className="members-panel" onClick={(e) => e.stopPropagation()}>
        <div className="members-panel__head">
          <span className="members-panel__title">Участники · {members.length}</span>
          <button className="members-panel__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="members-panel__list">
          {members.map((m) => (
            <div className="member-row" key={m.user_id}>
              <span className="member-row__avatar">{initials(m.login)}</span>
              <span className="member-row__name">{m.login}</span>
              <span className="member-row__role">{m.role === "admin" ? "админ" : "участник"}</span>
              {isAdmin && m.user_id !== currentUserId && (
                <button
                  className="member-row__remove"
                  onClick={() => handleRemove(m.user_id)}
                  aria-label={`Удалить ${m.login}`}
                  title="Удалить из чата"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <form className="members-panel__add" onSubmit={handleAdd}>
            <label className="field__label" htmlFor="add-member">Добавить по ID пользователя</label>
            <div className="members-panel__add-row">
              <input
                id="add-member"
                className="field__input"
                inputMode="numeric"
                placeholder="ID"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
              <button className="btn btn--primary btn--small" type="submit" disabled={busy}>
                Добавить
              </button>
            </div>
            {error && <div className="members-panel__error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
