import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.login.trim(), form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Не удалось войти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__frame">
        <div className="auth__brand">
          <span className="auth__jack"></span>
          <div className="auth__brand-text">
            <span className="auth__title">Wire</span>
            <span className="auth__subtitle">МЕССЕНДЖЕР</span>
          </div>
        </div>

        <div className="auth__panel">
          <h1 className="auth__heading">Вход в сеть</h1>
          <p className="auth__lede">Введите логин и пароль, чтобы подключиться к своим чатам.</p>

          {error && <div className="auth__error">{error}</div>}

          <form onSubmit={submit} noValidate>
            <div className="field">
              <label className="field__label" htmlFor="login">Логин</label>
              <input
                id="login"
                className="field__input"
                value={form.login}
                onChange={update("login")}
                autoComplete="username"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                className="field__input"
                value={form.password}
                onChange={update("password")}
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={busy}>
              {busy ? "Соединение…" : "Войти"}
            </button>
          </form>
        </div>

        <p className="auth__foot">
          Нет аккаунта? <Link className="auth__link" to="/register">Создать</Link>
        </p>
      </div>
    </div>
  );
}
