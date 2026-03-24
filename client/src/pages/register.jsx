import { useNavigate, Link } from 'react-router-dom';
import React, { useState } from 'react';
import { authApi } from '../apis';
import './css/register.css';
import toast from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) { toast.error('Passwords do not match'); return; }

    const toastId = toast.loading('Creating your account...');
    try {
      const response = await authApi.post('/register', { name, username, password });
      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/login');
      } else {
        toast.error(response.data.message);
      }
    } catch {
      toast.error('Server issue — please try again shortly.');
    } finally {
      setName(''); setPassword(''); setUsername(''); setPassword2('');
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="Register">
      <div className="register-card">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          <span className="auth-brand-name">Social Sphere</span>
        </div>
        <h1 className="auth-heading">Join us.</h1>
        <p className="auth-subheading">Create your account to start connecting.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text" id="name" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text" id="username" placeholder="Choose a handle"
                value={username} onChange={(e) => setUsername(e.target.value)} required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password" id="password" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password2">Confirm</label>
              <input
                type="password" id="password2" placeholder="Repeat password"
                value={password2} onChange={(e) => setPassword2(e.target.value)} required
              />
            </div>
          </div>
          <button type="submit" className="btn-auth">Create Account</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
