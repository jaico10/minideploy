import React, { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import './LoginPage.css';
import API_BASE_URL from '../../../config';

const LoginPage = ({ darkMode, setCurrentPage, setIsAuthenticated, setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                setUser(data.user);
                setIsAuthenticated(true);
                setCurrentPage('dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Login failed');
            }
        } catch (err) {
            console.error('Login fetch error:', err);
            setError(`Network error: ${err.message}. Ensure backend is running.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
            <div className="auth-container">
                <button onClick={() => setCurrentPage('landing')} className="back-to-landing">
                    <span>← Back to Home</span>
                </button>
                <div className="auth-header">
                    <div className="logo-center">
                        <Shield className="logo-icon-large" />
                        <span className="logo-text-large">CodeSentinel</span>
                    </div>
                    <h2 className="auth-title">Welcome back</h2>
                    <p className="auth-subtitle">Sign in to your account</p>
                </div>
                <div className="auth-card">
                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-checkbox">
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember" className="checkbox-label">Remember me</label>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                        <button type="button" onClick={() => setCurrentPage('forgot')} className="link-btn">
                            Forgot password?
                        </button>
                    </form>
                    <div className="divider">or continue with</div>
                    <button className="btn btn-github btn-full">
                        <span>Continue with GitHub</span>
                    </button>
                </div>
                <div className="auth-switch">
                    Don't have an account? <button onClick={() => setCurrentPage('signup')} className="link">Sign up</button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
