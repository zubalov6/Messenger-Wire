import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.login, form.password);
      navigate("/chats");
    } catch (err) {
      setError(err.detail || "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand">
          <span className="signal-dot" />
          <span className="brand-mark">MESSENGER</span>
        </div>
        <p className="auth-tagline">Сигнал доходит только по логину и паролю.</p>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Логин</span>
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
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Выходим на связь…" : "Войти в сеть"}
          </button>
        </form>

        <p className="auth-switch">
          Нет логина? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
