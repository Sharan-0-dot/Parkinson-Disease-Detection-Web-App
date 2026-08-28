import { NavLink, Link, useNavigate } from "react-router-dom";
import { Activity, LogOut, Users, LayoutDashboard, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-clinic-50 text-clinic-700"
      : "text-ink-600 hover:bg-ink-100"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-clinic-700">
          <Activity size={22} strokeWidth={2.2} />
          <span className="font-semibold tracking-tight">Voice Screening</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" end className={linkClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/patients" className={linkClass}>
            <Users size={16} /> Patients
          </NavLink>
          <NavLink to="/patients/new" className={linkClass}>
            <UserPlus size={16} /> New patient
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user?.role && (
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium capitalize text-ink-600">
              {user.role}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}