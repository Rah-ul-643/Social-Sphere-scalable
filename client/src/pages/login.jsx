import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/login.css';
import { authApi } from '../apis';
import toast from 'react-hot-toast';

const Login = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Signing in...');
    try {
      const response = await authApi.post('/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('token', JSON.stringify(response.data.token));
        setIsLoggedIn(true);
        toast.success('Welcome back');
        navigate('/');
      } else {
        toast.error(response.data.message);
        navigate('/login');
      }
    } catch {
      toast.error('Server issue — please try again shortly.');
    } finally {
      setPassword('');
      setUsername('');
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="Login">
      <div className="login-card">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          <span className="auth-brand-name">Social Sphere</span>
        </div>
        <h1 className="auth-heading">Welcome back.</h1>
        <p className="auth-subheading">Sign in to continue your conversations.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-auth">Sign In</button>
        </form>

        <p className="auth-footer">
          New to Social Sphere? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
