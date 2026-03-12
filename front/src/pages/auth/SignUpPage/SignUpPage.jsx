import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import './SignUpPage.css';
import API_BASE_URL from '../../../config';

const SignUpPage = ({ darkMode, setCurrentPage, setIsAuthenticated, setUser }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // After signup, automatically log in
                const formData = new URLSearchParams();
                formData.append('username', email);
                formData.append('password', password);

                const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: formData.toString(),
                });

                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    localStorage.setItem('token', loginData.access_token);
                    setUser(loginData.user);
                    setIsAuthenticated(true);
                    setCurrentPage('dashboard');
                } else {
                    setError('Signup successful, but login failed. Please try logging in manually.');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Signup failed');
            }
        } catch (err) {
            console.error('Signup/Login fetch error:', err);
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
                    <h2 className="auth-title">Create account</h2>
                    <p className="auth-subtitle">Start securing your code today</p>
                </div>
                <div className="auth-card">
                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && <div className="error-message">{error}</div>}
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                placeholder="johndoe"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
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
                            <input type="checkbox" id="terms" required />
                            <label htmlFor="terms" className="checkbox-label">
                                I agree to the Terms and Conditions
                            </label>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                    <div className="divider">or continue with</div>
                    <button className="btn btn-github btn-full">
                        <span>Continue with GitHub</span>
                    </button>
                </div>
                <div className="auth-switch">
                    Already have an account? <button onClick={() => setCurrentPage('login')} className="link">Sign in</button>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
