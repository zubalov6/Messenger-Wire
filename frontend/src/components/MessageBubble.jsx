import { formatTime } from "../utils/format";

export default function MessageBubble({ message, own, authorLabel }) {
  return (
    <div className={`bubble-row${own ? " bubble-row--own" : ""}`}>
      <div className="bubble">
        {!own && authorLabel && <div className="bubble__author">{authorLabel}</div>}
        <div className="bubble__text">{message.text}</div>
        <div className="bubble__time">{formatTime(message.created_at)}</div>
      </div>
    </div>
  );
}
