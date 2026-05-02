import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Plus, X, FolderKanban, Users, Loader2, Trash2 } from "lucide-react";

const statusBadge = { active:"badge-active", completed:"badge-completed", "on-hold":"badge-on-hold" };

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:"", description:"" });
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    api.get("/projects")
      .then(r => setProjects(r.data.data.projects))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setSaving(true);
    try {
      await api.post("/projects", form);
      toast.success("Project created!");
      setShowModal(false);
      setForm({ title:"", description:"" });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      setProjects(p => p.filter(x => x._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? "s" : ""} you're part of</p>
        </div>
        {user?.role === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16}/> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display:"grid", placeItems:"center", paddingTop:80 }}>
          <div className="spinner"/>
        </div>
      ) : !projects.length ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><FolderKanban size={24}/></div>
          <h3>No projects yet</h3>
          <p>Create a project to start managing tasks with your team.</p>
          {user?.role === "admin" && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14}/> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid-3">
          {projects.map(p => (
            <div key={p._id} className="project-card" onClick={() => navigate(`/projects/${p._id}`)}>
              <div className="project-card-header">
                <div style={{ flex:1 }}>
                  <h3 className="project-card-title">{p.title}</h3>
                  <p className="project-card-desc">{p.description || "No description"}</p>
                </div>
                {user?.role === "admin" && p.admin?._id === user._id && (
                  <button className="btn btn-icon btn-danger btn-sm"
                    onClick={(e) => handleDelete(e, p._id)} title="Delete project">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
              <span className={`badge ${statusBadge[p.status]}`}>{p.status}</span>
              <div className="project-card-footer">
                <div className="members-stack">
                  {p.members?.slice(0,4).map((m,i) => (
                    <div key={m._id || i} className="member-pip" title={m.name}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {p.members?.length > 4 && (
                    <div className="member-pip" style={{ background:"var(--bg-hover)", color:"var(--text-secondary)", fontSize:10 }}>
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <span style={{ fontSize:12, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:4 }}>
                  <Users size={12}/> {p.members?.length} member{p.members?.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input className="form-input" placeholder="e.g. Website Redesign" required
                  value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" placeholder="What is this project about?" rows={3}
                  style={{ resize:"vertical" }}
                  value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={14} style={{ animation:"spin 0.7s linear infinite" }}/> : <Plus size={14}/>}
                  {saving ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
