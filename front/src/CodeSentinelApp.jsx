import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, User, Shield, RefreshCw, Clock, FileText, LogOut, AlertTriangle, CheckCircle, Info, Github, Filter, Download, Play, GitBranch } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './CodeSentinel.css';

// Main App Component
import API_BASE_URL from './config';

const CodeSentinelApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanningRepo, setScanningRepo] = useState('');
  const [user, setUser] = useState(null);
  const [scans, setScans] = useState([]);
  const [stats, setStats] = useState({
    total_scans: 0,
    completed_scans: 0,
    failed_scans: 0,
    pending_scans: 0,
    vulnerabilities_found: 0
  });
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      window.history.replaceState({}, document.title, "/");
      fetchUserProfile(urlToken);
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        fetchUserProfile(token);
      }
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchScans();

      // Poll every 5 seconds to get updates on scans
      const interval = setInterval(() => {
        fetchStats();
        fetchScans(true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setCurrentPage('dashboard');
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/scans/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchScans = async (isBackgroundPoll = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!isBackgroundPoll) {
      setLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/scans/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Sort by ID or created_at descending (latest first)
        const sortedData = [...data].sort((a, b) => b.id - a.id);
        setScans(sortedData);
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      if (!isBackgroundPoll) {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };


  // Main Render
  return (
    <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {!isAuthenticated ? (
        <>
          {currentPage === 'landing' && <LandingPage setCurrentPage={setCurrentPage} darkMode={darkMode} setDarkMode={setDarkMode} />}
          {currentPage === 'signup' && <SignUpPage setCurrentPage={setCurrentPage} darkMode={darkMode} />}
          {currentPage === 'login' && <LoginPage setIsAuthenticated={setIsAuthenticated} setCurrentPage={setCurrentPage} setUser={setUser} darkMode={darkMode} />}
          {currentPage === 'forgotPassword' && <ForgotPasswordPage setCurrentPage={setCurrentPage} darkMode={darkMode} />}
        </>
      ) : (
        <>
          <Sidebar darkMode={darkMode} currentPage={currentPage} setCurrentPage={setCurrentPage} handleLogout={handleLogout} />
          <TopBar darkMode={darkMode} setDarkMode={setDarkMode} user={user} />
          {currentPage === 'dashboard' && <Dashboard darkMode={darkMode} stats={stats} scans={scans} loading={loading} setCurrentPage={setCurrentPage} />}
          {currentPage === 'scanHistory' && <ScanHistoryPage darkMode={darkMode} scans={scans} loading={loading} setCurrentPage={setCurrentPage} />}
          {currentPage === 'remediation' && <RemediationPage darkMode={darkMode} />}
          {currentPage === 'reports' && <ReportsPage darkMode={darkMode} />}
          {currentPage === 'newScan' && <NewScanPage darkMode={darkMode} />}
          {currentPage.startsWith('scan-') && (
            <ScanDetailPage taskId={currentPage.replace('scan-', '')} onBack={() => setCurrentPage('dashboard')} />
          )}
        </>
      )}
    </div>
  );
};

// --- Sub-components (Moved outside to prevent re-mounting) ---

const Sidebar = ({ darkMode, currentPage, setCurrentPage, handleLogout }) => {
  const NavItem = ({ icon, text, active, onClick }) => (
    <button onClick={onClick} className={`nav-item ${active ? 'active' : ''}`}>
      {icon}
      <span>{text}</span>
    </button>
  );

  return (
    <div className={`sidebar ${darkMode ? 'dark' : 'light'}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Shield className="logo-icon" />
          <span className="logo-text">CodeSentinel</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavItem icon={<FileText size={20} />} text="Dashboard" active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')} />
        <NavItem icon={<Play size={20} />} text="New Scan" active={currentPage === 'newScan'} onClick={() => setCurrentPage('newScan')} />
        <NavItem icon={<Clock size={20} />} text="Scan History" active={currentPage === 'scanHistory'} onClick={() => setCurrentPage('scanHistory')} />
        <NavItem icon={<FileText size={20} />} text="Reports" active={currentPage === 'reports'} onClick={() => setCurrentPage('reports')} />
        <NavItem icon={<RefreshCw size={20} />} text="Remediation" active={currentPage === 'remediation'} onClick={() => setCurrentPage('remediation')} />
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const TopBar = ({ darkMode, setDarkMode, user }) => (
  <div className={`topbar ${darkMode ? 'dark' : 'light'}`}>
    <div className="search-box">
      <Search className="search-icon" size={20} />
      <input type="text" placeholder="Search..." className="search-input" />
    </div>
    <div className="topbar-actions">
      <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button className="icon-btn">
        <User size={20} />
        {user && <span className="user-info">{user.username}</span>}
      </button>
    </div>
  </div>
);

const LandingPage = ({ setCurrentPage, darkMode, setDarkMode }) => {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) featuresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const FeatureCard = ({ icon, title, description }) => (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </div>
  );

  return (
    <div className={`landing-page ${darkMode ? 'dark' : 'light'}`}>
      <nav className="landing-nav">
        <div className="logo">
          <Shield className="logo-icon" />
          <span className="logo-text">CodeSentinel</span>
        </div>
        <div className="nav-links">
          <button onClick={scrollToFeatures} className="nav-link">Features</button>
          <a href="#docs" className="nav-link">Docs</a>
          <button onClick={() => setCurrentPage('login')} className="nav-link">Login</button>
          <button onClick={() => setCurrentPage('signup')} className="btn btn-primary">Sign Up</button>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>
      <div className="hero-section">
        <h1 className="hero-title">Scan your GitHub repo for<br />vulnerabilities using AI</h1>
        <p className="hero-subtitle">Automated security scanning with AI-powered remediation for your code repositories</p>
        <div className="hero-actions">
          <button onClick={() => setCurrentPage('login')} className="btn btn-primary btn-large">Start Scanning</button>
        </div>
        <div id="features" className="features-grid">
          <FeatureCard icon={<Search size={40} />} title="SAST Scan" description="Static analysis security testing for comprehensive code review" />
          <FeatureCard icon={<RefreshCw size={40} />} title="AI Fix Suggestions" description="Intelligent remediation powered by advanced AI models" />
          <FeatureCard icon={<FileText size={40} />} title="Reports" description="Detailed vulnerability reports with export options" />
          <FeatureCard icon={<Shield size={40} />} title="Background Jobs" description="Async scanning with Celery and Redis for scalability" />
        </div>
      </div>
    </div>
  );
};

const LoginPage = ({ setIsAuthenticated, setCurrentPage, setUser, darkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
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
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="auth-container">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-footer">
              <button type="button" onClick={() => setCurrentPage('forgotPassword')} className="link-btn">
                Forgot password?
              </button>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
            <div className="divider">Or continue with</div>
            <button type="button" className="btn btn-github btn-full" onClick={() => window.location.href = `${API_BASE_URL}/auth/github/login`}>
              <Github size={20} />
              Login with GitHub
            </button>
            <div className="auth-switch">
              Don't have an account? <button type="button" onClick={() => setCurrentPage('signup')} className="link-btn">Create account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ForgotPasswordPage = ({ setCurrentPage, darkMode }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo-center">
            <Shield className="logo-icon-large" />
            <span className="logo-text-large">CodeSentinel</span>
          </div>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
        </div>
        <div className="auth-card">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full">
                Send Reset Link
              </button>
              <div className="auth-switch">
                Remember your password? <button type="button" onClick={() => setCurrentPage('login')} className="link-btn">Back to login</button>
              </div>
            </form>
          ) : (
            <div className="success-message">
              <CheckCircle className="success-icon" />
              <h3 className="success-title">Check Your Email</h3>
              <p className="success-text">
                We've sent password reset instructions to <span className="highlight">{email}</span>
              </p>
              <button onClick={() => setCurrentPage('login')} className="btn btn-primary btn-full">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SignUpPage = ({ setCurrentPage, darkMode }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
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
        const user = await response.json();
        alert('Account created successfully! Please log in.');
        setCurrentPage('login');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Sign up failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`auth-page ${darkMode ? 'dark' : 'light'}`}>
      <div className="auth-container">
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
              <label className="form-label">Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div className="form-checkbox">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms" className="checkbox-label">
                I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
            <div className="divider">Or continue with</div>
            <button type="button" className="btn btn-github btn-full" onClick={() => window.location.href = `${API_BASE_URL}/auth/github/login`}>
              <Github size={20} />
              Sign up with GitHub
            </button>
            <div className="auth-switch">
              Already have an account? <button type="button" onClick={() => setCurrentPage('login')} className="link-btn">Sign in</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ darkMode, stats, scans, loading, setCurrentPage }) => {
  const
    chartData = React.useMemo(() => {
      return [...scans]
        .filter(scan => scan.status === 'completed' || scan.status === 'COMPLETED')
        .reverse()
        .map((scan, index) => ({
          name: `Scan ${index + 1}`,
          date: new Date(scan.created_at).toLocaleDateString(),
          issues: scan.issues_count || 0,
          risk: scan.risk_score || 0
        }));
    }, [scans]);

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of your security scans</p>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <RefreshCw className="stat-icon blue" size={24} />
          </div>
          <div className="stat-value">{stats.total_scans}</div>
          <div className="stat-label">Total Scans</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <AlertTriangle className="stat-icon red" size={24} />
          </div>
          <div className="stat-value">{stats.vulnerabilities_found}</div>
          <div className="stat-label">Vulnerabilities Found</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <CheckCircle className="stat-icon green" size={24} />
          </div>
          <div className="stat-value">{stats.completed_scans}</div>
          <div className="stat-label">Completed Scans</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <Clock className="stat-icon orange" size={24} />
          </div>
          <div className="stat-value">{stats.pending_scans}</div>
          <div className="stat-label">Pending Scans</div>
          <div className="stat-sublabel">{stats.pending_scans} active</div>
        </div>
      </div>

      {scans.length > 0 && (
        <div className="table-container mb-8">
          <h2 className="section-title mb-4">Repository Health Over Time</h2>
          <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} />
                <XAxis dataKey="date" stroke={darkMode ? "#9ca3af" : "#6b7280"} />
                <YAxis yAxisId="left" stroke="#ef4444" label={{ value: 'Issues', angle: -90, position: 'insideLeft', fill: "#ef4444" }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Risk Score', angle: 90, position: 'insideRight', fill: "#f59e0b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1f2937' : '#fff',
                    borderColor: darkMode ? '#374151' : '#e5e7eb',
                    color: darkMode ? '#fff' : '#111827'
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="issues" name="Vulnerabilities" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="risk" name="Risk Score (/10)" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* RECENT SCANS SECTION */}
      <div className="table-container">
        <div className="flex-between mb-4">
          <h2 className="section-title">Recent Scans</h2>
          <button onClick={() => setCurrentPage('scanHistory')} className="link-btn">View All</button>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <p>Loading scans...</p>
          ) : scans.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(0, 5).map(scan => (
                  <tr key={scan.id}>
                    <td>{scan.task_id}</td>
                    <td>
                      <span className={`status-badge ${scan.status}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td>{new Date(scan.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setCurrentPage(`scan-${scan.task_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="page-subtitle">No scans available. Start a new scan to see results here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ScanHistoryPage = ({ darkMode, scans, loading, setCurrentPage }) => {
  const sortedScans = React.useMemo(() => [...scans].sort((a, b) => b.id - a.id), [scans]);
  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="page-title">Scan History</h1>
      <p className="page-subtitle">All previous security scans</p>

      <div className="table-container">
        <h2 className="section-title">All Scans ({scans.length})</h2>
        <div className="table-wrapper">
          {loading ? (
            <p>Loading scan history...</p>
          ) : scans.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Files</th>
                  <th>Issues</th>
                  <th>Risk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedScans.map(scan => (
                  <tr key={scan.id}>
                    <td>{scan.task_id}</td>
                    <td>
                      <span className={`status-badge ${scan.status}`}>
                        {scan.status}
                      </span>
                    </td>
                    <td>{new Date(scan.created_at).toLocaleDateString()}</td>
                    <td>{scan.total_files || 0}</td>
                    <td>{scan.issues_count || 0}</td>
                    <td>
                      {scan.risk_score !== null ? (
                        <span className={`risk-score ${scan.risk_score > 7 ? 'text-red' : scan.risk_score > 4 ? 'text-orange' : 'text-green'}`}>
                          {scan.risk_score}/10
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setCurrentPage(`scan-${scan.task_id}`)}
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state p-8 text-center">
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No history yet</h3>
              <p className="text-gray-400">You haven't run any scans yet. Go to New Scan to get started.</p>
              <button onClick={() => setCurrentPage('newScan')} className="btn btn-primary mt-4">Start First Scan</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RemediationPage = ({ darkMode }) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    const fetchIssues = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/scans/issues/vulnerable`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIssues(data);
        }
      } catch (error) {
        console.error('Error fetching vulnerable issues:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="page-title">AI Remediation Dashboard</h1>
      <p className="page-subtitle">Instantly view and apply AI-powered code fixes for your vulnerabilities</p>

      {loading ? (
        <div className="remediation-placeholder">
          <p>Loading vulnerable issues...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="remediation-placeholder">
          <div className="placeholder-content">
            <CheckCircle size={64} className="placeholder-icon green" />
            <h3>No Vulnerabilities Found!</h3>
            <p>Your repositories are clean according to our AI scans.</p>
          </div>
        </div>
      ) : (
        <div className="remediation-split-view">
          <div className="remediation-sidebar">
            <h3 className="sidebar-title">Vulnerabilities ({issues.length})</h3>
            <div className="issues-list">
              {issues.map(issue => (
                <div
                  key={issue.id}
                  className={`issue-item ${selectedIssue?.id === issue.id ? 'active' : ''}`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="issue-repo-name"><Github size={12} style={{ marginRight: '4px', display: 'inline' }} /> {issue.repo_url.split('/').slice(-1)[0]}</div>
                  <div className="issue-file-path"><FileText size={12} style={{ marginRight: '4px', display: 'inline', color: '#6b7280' }} /> {issue.file_path.split('/').slice(-1)[0]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="remediation-content">
            {selectedIssue ? (
              <div className="ai-fix-container">
                <div className="ai-fix-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="file-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} color="#ef4444" />
                    <h4 style={{ margin: 0 }}>{selectedIssue.file_path}</h4>
                  </div>
                  <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}>
                    <CheckCircle size={14} /> Accept Fix
                  </button>
                </div>

                <div className="diff-viewer-wrapper" style={{ borderRadius: '8px', overflow: 'hidden', border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb' }}>
                  <ReactDiffViewer
                    oldValue={selectedIssue.scanned_code}
                    newValue={selectedIssue.fixed_code}
                    splitView={true}
                    useDarkTheme={darkMode}
                    leftTitle="Vulnerable Code"
                    rightTitle="AI Suggested Fix"
                    styles={{
                      variables: {
                        dark: {
                          diffViewerBackground: '#030712',
                          diffViewerColor: '#FFF',
                          addedBackground: '#064e3b',
                          addedColor: '#a7f3d0',
                          removedBackground: '#7f1d1d',
                          removedColor: '#fecaca',
                          wordAddedBackground: '#047857',
                          wordRemovedBackground: '#b91c1c'
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="remediation-placeholder" style={{ height: '100%', marginTop: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="placeholder-content">
                  <RefreshCw size={64} className="placeholder-icon" style={{ opacity: 0.5 }} />
                  <h3>Select an Issue</h3>
                  <p>Click on an issue in the sidebar to view the AI suggested remediation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage = ({ darkMode }) => {
  const [completedScans, setCompletedScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedScans();
  }, []);

  const fetchCompletedScans = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/scans/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCompletedScans(data.filter(s => s.status === 'completed' || s.status === 'COMPLETED'));
      }
    } catch (error) {
      console.error('Error fetching scans for reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (taskId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/scans/${taskId}/report/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `CodeSentinel_ScanReport_${taskId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to generate PDF Report");
      }
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <div className="reports-header-row">
        <div>
          <h1 className="page-title">Executive Reports</h1>
          <p className="page-subtitle">Download comprehensive PDF security reports for compliance and auditing</p>
        </div>
      </div>

      <div className="reports-section">
        <h2 className="section-title">Available Scan Reports</h2>
        {loading ? (
          <div className="reports-placeholder">
            <p>Loading reports...</p>
          </div>
        ) : completedScans.length === 0 ? (
          <div className="reports-placeholder">
            <div className="placeholder-content">
              <FileText size={64} className="placeholder-icon" />
              <h3>No Reports Available</h3>
              <p>Complete some scans in the New Scan tab to generate security reports for download.</p>
            </div>
          </div>
        ) : (
          <div className="history-list">
            {completedScans.map((scan) => (
              <div key={scan.id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="history-info">
                  <div className="history-repo">
                    <Github size={16} /> Task: {scan.task_id.substring(0, 8)}...
                  </div>
                  <div className="history-meta">
                    <span className="meta-item"><Clock size={14} /> {new Date(scan.created_at).toLocaleString()}</span>
                  </div>
                  <div className="history-stats">
                    <span className="stat-badge"><FileText size={12} /> {scan.total_files || 0} files</span>
                    {scan.issues_count > 0 ? (
                      <span className="stat-badge danger"><AlertTriangle size={12} /> {scan.issues_count} issues</span>
                    ) : (
                      <span className="stat-badge success"><CheckCircle size={12} /> Clean</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadPdf(scan.task_id)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const QueueItem = React.memo(({ job }) => {
  const [progress, setProgress] = useState({ percent: 0, file: '' });

  useEffect(() => {
    let isMounted = true;

    // Only poll if it's potentially running
    if (job.status === 'completed' || job.status === 'failed') {
      if (job.status === 'completed') setProgress({ percent: 100, file: '' });
      return;
    }

    const fetchProgress = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_BASE_URL}/scans/${job.task_id}/progress`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setProgress({
            percent: data.percent || 0,
            file: data.file || ''
          });
        }
      } catch (e) {
        console.error('Error fetching progress:', e);
      }
    };

    fetchProgress();
    const intervalId = setInterval(fetchProgress, 2000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [job.task_id, job.status]);

  return (
    <div className="queue-item">
      <div className="queue-item-header">
        <span className="queue-repo" style={{ fontSize: '14px', fontWeight: 500 }}>{job.task_id.substring(0, 12)}...</span>
        <span className={`status-badge ${job.status}`}>
          {job.status}
        </span>
      </div>
      {(job.status === 'progress' || job.status === 'pending') && (
        <div style={{ marginTop: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#9ca3af' }}>
            <span style={{ maxWidth: '80%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>
              {progress.file ? `Scanning: ${progress.file}` : 'Starting...'}
            </span>
            <span>{progress.percent}%</span>
          </div>
          <div className="progress-bar-container" style={{ width: '100%', height: '8px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: '#374151' }}>
            <div
              className="progress-bar"
              style={{ width: `${progress.percent}%`, height: '100%', backgroundColor: '#3b82f6', transition: 'width 0.3s ease-out' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.job.id === nextProps.job.id && prevProps.job.status === nextProps.job.status;
});

const NewScanPage = ({ darkMode }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [branch, setBranch] = useState('main');
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchQueue();
    fetchGithubRepos();
    const interval = setInterval(() => fetchQueue(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGithubRepos = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoadingRepos(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/scans/github/repos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGithubRepos(data);
      }
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    } finally {
      setLoadingRepos(false);
    }
  };
  const fetchQueue = async (isBackgroundPoll = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!isBackgroundPoll) setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/scans/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const sortedQueue = [...data].sort((a, b) => b.id - a.id);
        setQueue(sortedQueue);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      if (!isBackgroundPoll) setLoading(false);
    }
  };

  const startScan = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    setStarting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/scans/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          repo_url: repoUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Scan started:', data);
        fetchQueue(); // Refresh the queue
      } else {
        console.error('Failed to start scan:', data);
        alert(`Failed to start scan: ${data.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('Network error. Is the backend running?');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="page-title">New Scan</h1>
      <p className="page-subtitle">Configure and start a new security scan</p>

      <div className="new-scan-grid">
        <div className="scan-config-card">
          <div className="form-group mb-4">
            <label className="form-label">GitHub Repository URL</label>
            <div className="input-with-icon">
              <Github size={18} className="input-icon" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="https://github.com/organization/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <span className="input-helper">Enter the full URL of your GitHub repository</span>
          </div>

          {(githubRepos.length > 0 || loadingRepos) && (
            <div className="form-group" style={{ marginTop: '-12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: darkMode ? '#374151' : '#e5e7eb' }}></div>
                <span style={{ padding: '0 12px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OR SELECT FROM GITHUB</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: darkMode ? '#374151' : '#e5e7eb' }}></div>
              </div>
              <div className="input-with-icon">
                <Github size={18} className="input-icon" />
                <select
                  className="form-select pl-10"
                  onChange={(e) => setRepoUrl(e.target.value)}
                  value={githubRepos.some(r => r.url === repoUrl) ? repoUrl : ""}
                  disabled={loadingRepos}
                >
                  {loadingRepos ? (
                    <option value="" disabled>Loading repositories...</option>
                  ) : (
                    <>
                      <option value="" disabled>Select a repository...</option>
                      {githubRepos.map(repo => (
                        <option key={repo.url} value={repo.url}>
                          {repo.name} {repo.private ? '(Private)' : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Git Branch Selection</label>
            <div className="input-with-icon">
              <GitBranch size={18} className="input-icon" />
              <select
                className="form-select pl-10"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="main">main</option>
                <option value="develop">develop</option>
                <option value="staging">staging</option>
              </select>
            </div>
          </div>

          <div className="form-checkbox">
            <input
              type="checkbox"
              id="deps-scan"
              checked={includeDependencies}
              onChange={(e) => setIncludeDependencies(e.target.checked)}
            />
            <label htmlFor="deps-scan" className="checkbox-label">
              Include dependencies scan
              <span className="checkbox-helper">Scan package dependencies for known vulnerabilities (npm, pip, etc.)</span>
            </label>
          </div>

          <button
            className="btn btn-primary start-scan-btn"
            onClick={startScan}
            disabled={starting}
          >
            {starting ? 'Starting...' : 'Start Scan'}
          </button>
        </div>

        <div className="queue-status-card">
          <h3 className="card-title">Scan Queue Status</h3>
          <p className="card-subtitle">Background jobs managed by Celery + Redis</p>

          <div className="queue-list">
            {loading ? (
              <p>Loading queue...</p>
            ) : queue.length > 0 ? (
              queue.map((job) => (
                <QueueItem key={job.id} job={job} />
              ))
            ) : (
              <p>No scans in queue</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Scan Detail Page Component
const ScanDetailPage = ({ taskId, onBack }) => {
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode] = useState(true);

  useEffect(() => {
    fetchScanDetail();
    const interval = setInterval(fetchScanDetail, 5000);
    return () => clearInterval(interval);
  }, [taskId]);

  const fetchScanDetail = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/scans/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setScan(data);
      }
    } catch (error) {
      console.error('Error fetching scan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/scans/${taskId}/report/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan_report_${taskId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report');
    }
  };

  if (loading) return <div className="p-8">Loading scan details...</div>;
  if (!scan) return <div className="p-8">Scan not found <button onClick={onBack} className="link-btn">Go back</button></div>;

  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <div className="flex-between mb-6">
        <div>
          <button onClick={onBack} className="link-btn mb-2 flex-center">
            <RefreshCw size={16} className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="page-title">Scan Details</h1>
          <p className="page-subtitle">Task ID: {taskId}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={`status-badge ${scan.status}`}>{scan.status}</div>
          {(scan.status === 'completed' || scan.status === 'COMPLETED') && (
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }} onClick={downloadPdf}>
              <Download size={16} style={{ marginRight: '8px' }} /> Download PDF Report
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid mb-8">
        <div className="stat-card">
          <div className="stat-value">{scan.total_files || 0}</div>
          <div className="stat-label">Files Scanned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{scan.issues_count || 0}</div>
          <div className="stat-label">Vulnerabilities</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{scan.risk_score || 0}/10</div>
          <div className="stat-label">Risk Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-capitalize">{scan.severity || 'N/A'}</div>
          <div className="stat-label">Overall Severity</div>
        </div>
      </div>

      {scan.scan_results && scan.scan_results.length > 0 ? (
        <div className="table-container">
          <h2 className="section-title">Findings ({scan.scan_results.filter(r => r.vulnerable).length} Vulnerabilities)</h2>
          <div className="findings-list">
            {scan.scan_results.map((result) => (
              <div key={result.id} className={`finding-card ${result.vulnerable ? 'vulnerable' : 'safe'}`}>
                <div className="finding-header">
                  <span className="file-path">{result.file_path}</span>
                  {result.vulnerable ? (
                    <span className="badge badge-red">VULNERABLE</span>
                  ) : (
                    <span className="badge badge-green">SAFE</span>
                  )}
                </div>
                {result.vulnerable && (
                  <div className="finding-body">
                    <p className="finding-explanation">Vulnerability detected in this file. AI has suggested fixes.</p>
                    <div className="code-diff-wrapper mt-4">
                      <ReactDiffViewer
                        oldValue={result.scanned_code}
                        newValue={result.fixed_code}
                        splitView={true}
                        useDarkTheme={darkMode}
                        leftTitle="Vulnerable Code"
                        rightTitle="AI Fixed Code"
                        styles={{
                          variables: {
                            dark: {
                              diffViewerBackground: '#0a0f1a',
                              addedBackground: 'rgba(16, 185, 129, 0.15)',
                              removedBackground: 'rgba(239, 68, 68, 0.15)',
                              wordAddedBackground: 'rgba(16, 185, 129, 0.3)',
                              wordRemovedBackground: 'rgba(239, 68, 68, 0.3)',
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
                {result.error && (
                  <div className="error-message">Error scanning file: {result.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state p-8 text-center bg-gray-900 rounded-lg">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-medium mb-2">No results yet</h3>
          <p className="text-gray-400">This scan might still be in progress or resulted in no files being found.</p>
        </div>
      )}
    </div>
  );
};

export default CodeSentinelApp;
