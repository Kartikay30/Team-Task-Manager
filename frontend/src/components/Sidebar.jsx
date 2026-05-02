import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare } from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Projects",  icon: FolderKanban,    to: "/projects"  },
    { label: "My Tasks",  icon: CheckSquare,      to: "/tasks"     },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">T</div>
        <span className="logo-text">TaskFlow</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ label, icon: Icon, to }) => (
          <Link key={to} to={to}
            className={`sidebar-link ${location.pathname.startsWith(to) ? "active" : ""}`}>
            <Icon size={18}/><span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <p className="user-role">{user?.role}</p>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Logout">
          <LogOut size={18}/>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
