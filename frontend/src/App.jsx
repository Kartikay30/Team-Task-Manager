import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import { useAuth } from "./context/AuthContext";

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
      }/>
      <Route path="/projects" element={
        <ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>
      }/>
      <Route path="/projects/:id" element={
        <ProtectedRoute><AppLayout><ProjectDetail /></AppLayout></ProtectedRoute>
      }/>
      <Route path="/tasks" element={
        <ProtectedRoute><AppLayout><Tasks /></AppLayout></ProtectedRoute>
      }/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#16161f",
              color: "#f1f1f5",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#16161f" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#16161f" } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
