import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";

function RequireAuth({ children }) {
  const { status } = useAuth();
  if (status === "loading") return <SplashScreen />;
  if (status === "guest") return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { status } = useAuth();
  if (status === "loading") return <SplashScreen />;
  if (status === "authed") return <Navigate to="/" replace />;
  return children;
}

function SplashScreen() {
  return (
    <div className="splash">
      <span className="splash__mark">◆</span>
      <span className="splash__label">СОЕДИНЕНИЕ</span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthed>
                <RegisterPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
