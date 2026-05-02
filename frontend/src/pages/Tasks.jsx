import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { CheckSquare, Calendar, Filter } from "lucide-react";

const STATUS_OPTIONS = ["todo","in-progress","done","overdue"];
const statusLabel = { todo:"To Do","in-progress":"In Progress",done:"Done",overdue:"Overdue" };
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—";

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTasks = () => {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    api.get(`/tasks${q}`)
      .then(r => setTasks(r.data.data.tasks))
      .catch(() => toast.error("Failed to load tasks"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const handleStatusChange = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(ts => ts.map(t => t._id === taskId ? {...t, status} : t));
      toast.success("Status updated");
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">All tasks across your projects</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <Filter size={14} style={{ color:"var(--text-muted)" }}/>
        <button onClick={()=>setStatusFilter("")}
          className={`btn btn-sm ${!statusFilter?"btn-primary":"btn-secondary"}`}>All</button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={`btn btn-sm ${statusFilter===s?"btn-primary":"btn-secondary"}`}>
            {statusLabel[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"grid", placeItems:"center", paddingTop:60 }}>
          <div className="spinner"/>
        </div>
      ) : !tasks.length ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><CheckSquare size={24}/></div>
          <h3>No tasks found</h3>
          <p>No tasks match the current filter.</p>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(t => (
            <div key={t._id} className="task-list-item">
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:600 }}>{t.title}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  <span style={{ fontSize:12, color:"var(--text-muted)" }}>📁 {t.project?.title}</span>
                  {t.assignedTo && (
                    <span className="assignee-chip">
                      <span className="assignee-avatar">{t.assignedTo.name?.charAt(0)}</span>
                      {t.assignedTo.name}
                    </span>
                  )}
                  {t.dueDate && (
                    <span className={`task-due ${t.status==="overdue"?"overdue":""}`}>
                      <Calendar size={11}/> {formatDate(t.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <select value={t.status} className="form-input"
                style={{ padding:"5px 10px", fontSize:12, width:"auto", borderRadius:8 }}
                onChange={e => handleStatusChange(t._id, e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
