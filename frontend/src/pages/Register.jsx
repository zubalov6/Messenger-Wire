import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Пароли не совпадают");
      return;
    }
    if (form.password.length < 4) {
      setError("Пароль слишком короткий");
      return;
    }

    setBusy(true);
    try {
      await register(form.login, form.password);
      navigate("/chats");
    } catch (err) {
      setError(err.detail || "Не удалось зарегистрироваться");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="signal-dot" />
          <span className="brand-mark">Wire</span>
        </div>
        <p className="auth-tagline">Мессенджер</p>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Позывной</span>
            <input
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              placeholder="login"
              autoComplete="username"
              required
            />
          </label>
          <label className="field">
            <span>Пароль</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="field">
            <span>Повторите пароль</span>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Регистрируем…" : "Создать позывной"}
          </button>
        </form>

        <p className="auth-switch">
          Уже есть позывной? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
