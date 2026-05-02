import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Shield, Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"member" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("All fields required");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">T</div>
          <span className="logo-text">TaskFlow</span>
        </div>
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Start managing your team tasks today</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <div style={{ position:"relative" }}>
              <User size={16} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)" }}/>
              <input className="form-input" style={{ paddingLeft:40 }} type="text" placeholder="John Doe"
                value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position:"relative" }}>
              <Mail size={16} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)" }}/>
              <input className="form-input" style={{ paddingLeft:40 }} type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:"relative" }}>
              <Lock size={16} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)" }}/>
              <input className="form-input" style={{ paddingLeft:40,paddingRight:44 }}
                type={showPass?"text":"password"} placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} />
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)",background:"none",border:"none",cursor:"pointer" }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ position:"relative" }}>
              <Shield size={16} style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text-muted)" }}/>
              <select className="form-input" style={{ paddingLeft:40 }}
                value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width:"100%",justifyContent:"center" }} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation:"spin 0.7s linear infinite" }}/> : null}
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
