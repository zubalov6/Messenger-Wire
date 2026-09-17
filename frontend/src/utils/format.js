export function initials(login) {
  if (!login) return "?";
  return login.slice(0, 2).toUpperCase();
}

export function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Сегодня";
  if (sameDay(d, yesterday)) return "Вчера";
  return d.toLocaleDateString([], { day: "numeric", month: "long" });
}

// groups a chronologically-ordered message list into { dayLabel, items[] } chunks
export function groupByDay(messages) {
  const groups = [];
  let lastLabel = null;

  for (const message of messages) {
    const label = formatDay(message.created_at);
    if (label !== lastLabel) {
      groups.push({ label, items: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].items.push(message);
  }

  return groups;
}
