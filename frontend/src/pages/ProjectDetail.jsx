import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, X, Users, CheckSquare, Loader2,
  Calendar, AlertTriangle, Trash2, UserPlus
} from "lucide-react";

const STATUS_OPTIONS  = ["todo","in-progress","done","overdue"];
const PRIORITY_OPTIONS = ["low","medium","high"];
const statusLabel = { todo:"To Do","in-progress":"In Progress", done:"Done", overdue:"Overdue" };

const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : null;

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  const [showTaskModal, setShowTaskModal]     = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title:"", description:"", priority:"medium", assignedTo:"", dueDate:"" });
  const [memberEmail, setMemberEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const isAdmin = project?.admin?._id === user?._id;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`),
      ]);
      setProject(pRes.data.data.project);
      setTasks(tRes.data.data.tasks);
    } catch {
      toast.error("Failed to load project");
      navigate("/projects");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [id]);

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/tasks", { ...taskForm, projectId: id, assignedTo: taskForm.assignedTo || undefined });
      toast.success("Task created!");
      setShowTaskModal(false);
      setTaskForm({ title:"",description:"",priority:"medium",assignedTo:"",dueDate:"" });
      fetchAll();
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success("Member added!");
      setShowMemberModal(false);
      setMemberEmail("");
      fetchAll();
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  // Remove Member
  const handleRemoveMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      toast.success("Member removed");
      fetchAll();
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  // Update Task Status
  const handleStatusChange = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(ts => ts.map(t => t._id === taskId ? {...t, status} : t));
      toast.success("Status updated");
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
      setTasks(ts => ts.filter(t => t._id !== taskId));
    } catch(err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  if (loading) return <div className="page-loader"><div className="spinner"/></div>;
  if (!project) return null;

  const filteredTasks = statusFilter ? tasks.filter(t => t.status === statusFilter) : tasks;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate("/projects")}>
            <ArrowLeft size={18}/>
          </button>
          <div>
            <h1 className="page-title">{project.title}</h1>
            <p className="page-subtitle">{project.description || "No description"}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
                <UserPlus size={14}/> Add Member
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskModal(true)}>
                <Plus size={14}/> New Task
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:24, borderBottom:"1px solid var(--border)", paddingBottom:4 }}>
        {[["tasks","Tasks"],["members","Members"]].map(([k,v]) => (
          <button key={k} onClick={()=>setActiveTab(k)}
            style={{ padding:"8px 16px", borderRadius:"8px 8px 0 0", fontSize:14, fontWeight:600,
              color: activeTab===k ? "var(--accent)" : "var(--text-secondary)",
              borderBottom: activeTab===k ? "2px solid var(--accent)" : "2px solid transparent",
              background:"none", transition:"var(--transition)" }}>
            {v}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <div>
          {/* Filter */}
          <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
            <button onClick={()=>setStatusFilter("")}
              className={`btn btn-sm ${!statusFilter ? "btn-primary" : "btn-secondary"}`}>All</button>
            {STATUS_OPTIONS.map(s => (
              <button key={s} onClick={()=>setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter===s ? "btn-primary" : "btn-secondary"}`}>
                {statusLabel[s]}
              </button>
            ))}
          </div>

          {!filteredTasks.length ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><CheckSquare size={24}/></div>
              <h3>No tasks found</h3>
              <p>{isAdmin ? "Create the first task for this project." : "No tasks match the filter."}</p>
            </div>
          ) : (
            <div className="tasks-list">
              {filteredTasks.map(t => (
                <div key={t._id} className="task-list-item" style={{ alignItems:"flex-start", gap:16 }}>
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>{t.title}</span>
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                    </div>
                    {t.description && <p style={{ fontSize:12, color:"var(--text-muted)" }}>{t.description}</p>}
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                      {t.assignedTo && (
                        <span className="assignee-chip">
                          <span className="assignee-avatar">{t.assignedTo.name?.charAt(0)}</span>
                          {t.assignedTo.name}
                        </span>
                      )}
                      {t.dueDate && (
                        <span className={`task-due ${t.status==="overdue"?"overdue":""}`}>
                          <Calendar size={11}/>{formatDate(t.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <select value={t.status} className="form-input"
                      style={{ padding:"5px 10px", fontSize:12, width:"auto", borderRadius:8 }}
                      onChange={e => handleStatusChange(t._id, e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </select>
                    {isAdmin && (
                      <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDeleteTask(t._id)}>
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="members-list">
          {project.members?.map(m => (
            <div key={m._id} className="member-row">
              <div className="member-row-info">
                <div className="user-avatar" style={{ width:36, height:36, fontSize:15 }}>
                  {m.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="member-name">{m.name} {m._id === project.admin?._id && <span className="badge badge-completed" style={{ marginLeft:6 }}>Admin</span>}</p>
                  <p className="member-email">{m.email}</p>
                </div>
              </div>
              {isAdmin && m._id !== project.admin?._id && (
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m._id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Task</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input className="form-input" required placeholder="e.g. Design homepage"
                  value={taskForm.title} onChange={e => setTaskForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} style={{ resize:"vertical" }} placeholder="Task details..."
                  value={taskForm.description} onChange={e => setTaskForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={taskForm.priority} onChange={e => setTaskForm(f=>({...f,priority:e.target.value}))}>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={taskForm.dueDate}
                    onChange={e => setTaskForm(f=>({...f,dueDate:e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-input" value={taskForm.assignedTo}
                  onChange={e => setTaskForm(f=>({...f,assignedTo:e.target.value}))}>
                  <option value="">Unassigned</option>
                  {project.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <Plus size={14}/>}
                  {saving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth:380 }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Member</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Member Email</label>
                <input className="form-input" type="email" required placeholder="member@example.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <UserPlus size={14}/>}
                  {saving ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
