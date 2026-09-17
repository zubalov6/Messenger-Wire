import { api } from "./client";

export function getChats() {
  return api.get("/chats");
}

export function createDirectChat(userId) {
  return api.post("/chats/direct", { user_id: userId });
}

export function createGroupChat(name, memberIds) {
  return api.post("/chats/group", { name, member_ids: memberIds });
}

export function getChatMembers(chatId) {
  return api.get(`/chats/${chatId}/members`);
}

export function addMember(chatId, userId) {
  return api.post(`/chats/${chatId}/members`, { user_id: userId });
}

export function removeMember(chatId, userId) {
  return api.delete(`/chats/${chatId}/members/${userId}`);
}
