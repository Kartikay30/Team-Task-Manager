import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { LayoutDashboard, FolderKanban, CheckSquare, AlertTriangle, TrendingUp, Clock, Loader2 } from "lucide-react";

const statusLabel = { todo:"To Do", "in-progress":"In Progress", done:"Done", overdue:"Overdue" };

const formatDate = (d) => {
  if (!d) return "No due date";
  return new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;

  const s = stats || {};
  const ts = s.taskStats || {};

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple"><FolderKanban size={20}/></div>
          <p className="stat-label">Total Projects</p>
          <p className="stat-value">{s.projectCount ?? 0}</p>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><CheckSquare size={20}/></div>
          <p className="stat-label">To Do</p>
          <p className="stat-value">{ts.todo ?? 0}</p>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><Clock size={20}/></div>
          <p className="stat-label">In Progress</p>
          <p className="stat-value">{ts["in-progress"] ?? 0}</p>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><TrendingUp size={20}/></div>
          <p className="stat-label">Completed</p>
          <p className="stat-value">{ts.done ?? 0}</p>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red"><AlertTriangle size={20}/></div>
          <p className="stat-label">Overdue</p>
          <p className="stat-value">{ts.overdue ?? 0}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:14, fontWeight:600 }}>Overall Completion</span>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--accent)" }}>{s.completionRate ?? 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${s.completionRate ?? 0}%` }}/>
        </div>
        <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:8 }}>{s.totalTasks ?? 0} total tasks across all projects</p>
      </div>

      <div className="grid-2">
        {/* Overdue Tasks */}
        <div className="card">
          <p className="section-title">
            <span>🔴 Overdue Tasks</span>
            <span style={{ fontSize:12, color:"var(--red)" }}>{s.overdueTasks?.length ?? 0} tasks</span>
          </p>
          {!s.overdueTasks?.length ? (
            <div className="empty-state" style={{ padding:"24px 0" }}>
              <p style={{ fontSize:13 }}>🎉 No overdue tasks!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {s.overdueTasks.map(t => (
                <div className="task-list-item" key={t._id}>
                  <AlertTriangle size={14} style={{ color:"var(--red)", flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600 }}>{t.title}</p>
                    <p style={{ fontSize:11, color:"var(--text-muted)" }}>{t.project?.title} · Due {formatDate(t.dueDate)}</p>
                  </div>
                  <span className="badge badge-overdue">Overdue</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="card">
          <p className="section-title">
            <span>📋 My Assigned Tasks</span>
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>{s.myTasks?.length ?? 0} tasks</span>
          </p>
          {!s.myTasks?.length ? (
            <div className="empty-state" style={{ padding:"24px 0" }}>
              <p style={{ fontSize:13 }}>No tasks assigned to you yet.</p>
            </div>
          ) : (
            <div className="tasks-list">
              {s.myTasks.map(t => (
                <div className="task-list-item" key={t._id}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600 }}>{t.title}</p>
                    <p style={{ fontSize:11, color:"var(--text-muted)" }}>{t.project?.title} · Due {formatDate(t.dueDate)}</p>
                  </div>
                  <span className={`badge badge-${t.status}`}>{statusLabel[t.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
