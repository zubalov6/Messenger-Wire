import { useEffect, useRef, useState } from "react";
import { getToken, getWsUrl } from "../api/client";

export function useChatSocket(chatId, onMessage) {
  const [status, setStatus] = useState("idle");
  const socketRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!chatId) return undefined;

    const token = getToken();
    if (!token) return undefined;

    setStatus("connecting");
    const url = getWsUrl(`/ws/chats/${chatId}?token=${encodeURIComponent(token)}`);
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => setStatus("open");
    socket.onclose = () => setStatus("closed");
    socket.onerror = () => setStatus("closed");
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current?.(data);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [chatId]);

  const send = (text) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ text }));
      return true;
    }
    return false;
  };

  return { status, send };
}
