import { api } from "./client";

export function getMessages(chatId, { before, limit = 50 } = {}) {
  return api.get(`/chats/${chatId}/messages`, { before, limit });
}

export function sendMessage(chatId, text) {
  return api.post(`/chats/${chatId}/messages`, { text });
}

export function searchMessages(chatId, query) {
  return api.get(`/chats/${chatId}/messages/search`, { query });
}
