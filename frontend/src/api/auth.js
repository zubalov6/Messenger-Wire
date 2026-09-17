import { api } from "./client";

export function register(login, password) {
  return api.post("/register", { login, password }, { auth: false });
}

export function login(login_, password) {
  return api.post("/login", { login: login_, password }, { auth: false });
}

export function fetchMe() {
  return api.get("/me");
}
