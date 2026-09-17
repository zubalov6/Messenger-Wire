import { forwardRef } from "react";
import MessageBubble from "./MessageBubble";
import { groupByDay } from "../utils/format";

const MessagesList = forwardRef(function MessagesList(
  { messages, currentUserId, loginsById, hasMore, loadingMore, onLoadMore, isGroup },
  scrollRef
) {
  const groups = groupByDay(messages);

  return (
    <div className="messages" ref={scrollRef}>
      {hasMore && (
        <button className="messages__load-more" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? "Загрузка…" : "Показать более ранние"}
        </button>
      )}

      {groups.map((group) => (
        <div key={group.label}>
          <div className="messages__day">{group.label}</div>
          {group.items.map((message) => {
            const own = message.user_id === currentUserId;
            const authorLabel = isGroup ? loginsById[message.user_id] || `#${message.user_id}` : null;
            return (
              <MessageBubble
                key={message.message_id}
                message={message}
                own={own}
                authorLabel={authorLabel}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default MessagesList;
