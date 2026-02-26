import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon, User, Shield, RefreshCw, Clock, FileText, LogOut, AlertTriangle, CheckCircle, Info, Github, Filter, Download, Play, GitBranch } from 'lucide-react';
import './CodeSentinel.css';

// Main App Component
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
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
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
        fetchScans();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/auth/me', {
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
      const response = await fetch('http://localhost:8000/scans/dashboard/stats', {
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

  const fetchScans = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/scans/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      }
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
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
          {currentPage === 'signup' && <SignUpPage setCurrentPage={setCurrentPage} />}
          {currentPage === 'login' && <LoginPage setIsAuthenticated={setIsAuthenticated} setCurrentPage={setCurrentPage} setUser={setUser} />}
          {currentPage === 'forgotPassword' && <ForgotPasswordPage setCurrentPage={setCurrentPage} />}
        </>
      ) : (
        <>
          <Sidebar darkMode={darkMode} currentPage={currentPage} setCurrentPage={setCurrentPage} handleLogout={handleLogout} />
          <TopBar darkMode={darkMode} setDarkMode={setDarkMode} user={user} />
          {currentPage === 'dashboard' && <Dashboard darkMode={darkMode} stats={stats} scans={scans} loading={loading} setCurrentPage={setCurrentPage} />}
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
      <button className="icon-btn notification-btn">
        <Bell size={20} />
        <span className="notification-badge">3</span>
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
          <button onClick={() => setCurrentPage('signup')} className="btn btn-primary btn-large">Start Scanning</button>
          <button className="btn btn-secondary btn-large">View Demo</button>
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

const LoginPage = ({ setIsAuthenticated, setCurrentPage, setUser }) => {
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

      const response = await fetch('http://localhost:8000/auth/login', {
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
    <div className="auth-page">
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
                placeholder="you@example.com"
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
                placeholder="••••••••"
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
            <button type="button" className="btn btn-github btn-full">
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

const ForgotPasswordPage = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
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
                  placeholder="you@example.com"
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

const SignUpPage = ({ setCurrentPage }) => {
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
      const response = await fetch('http://localhost:8000/auth/signup', {
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
    <div className="auth-page">
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
                placeholder="John Doe"
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
                placeholder="you@example.com"
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
                placeholder="••••••••"
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
                placeholder="••••••••"
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
            <button type="button" className="btn btn-github btn-full">
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

const Dashboard = ({ darkMode, stats, scans, loading, setCurrentPage }) => (
  <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
    <h1 className="page-title">Dashboard</h1>
    <p className="page-subtitle">Overview of your security scans</p>

    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-header">
          <RefreshCw className="stat-icon blue" size={24} />
          <span className="stat-change positive">+12%</span>
        </div>
        <div className="stat-value">{stats.total_scans}</div>
        <div className="stat-label">Total Scans</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <AlertTriangle className="stat-icon red" size={24} />
          <span className="stat-change positive">-8%</span>
        </div>
        <div className="stat-value">{stats.vulnerabilities_found}</div>
        <div className="stat-label">Vulnerabilities Found</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <CheckCircle className="stat-icon green" size={24} />
          <span className="stat-change positive">+24%</span>
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

    <div className="table-container">
      <h2 className="section-title">Recent Scans</h2>
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
              {scans.map(scan => (
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

const RemediationPage = ({ darkMode }) => {
  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <h1 className="page-title">AI Remediation</h1>
      <p className="page-subtitle">AI-powered fix for security vulnerabilities</p>

      <div className="remediation-placeholder">
        <div className="placeholder-content">
          <RefreshCw size={64} className="placeholder-icon" />
          <h3>No Vulnerability Selected</h3>
          <p>Select a vulnerability from your scan results to view AI-generated remediation suggestions.</p>
        </div>
      </div>
    </div>
  );
};

const ReportsPage = ({ darkMode }) => {
  return (
    <div className={`dashboard ${darkMode ? 'dark' : 'light'}`}>
      <div className="reports-header-row">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Download and manage security reports</p>
        </div>
        <button className="btn btn-primary">Generate New Report</button>
      </div>

      <div className="reports-section">
        <h2 className="section-title">Available Reports</h2>
        <div className="reports-placeholder">
          <div className="placeholder-content">
            <FileText size={64} className="placeholder-icon" />
            <h3>No Reports Available</h3>
            <p>Complete some scans to generate security reports for download.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewScanPage = ({ darkMode }) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/organization/repository');
  const [branch, setBranch] = useState('main');
  const [includeDependencies, setIncludeDependencies] = useState(false);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/scans/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setQueue(data);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
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
      const response = await fetch('http://localhost:8000/scans/', {
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
          <div className="form-group">
            <label className="form-label">GitHub Repository URL</label>
            <div className="input-with-icon">
              <Github size={18} className="input-icon" />
              <input
                type="text"
                className="form-input pl-10"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
            <span className="input-helper">Enter the full URL of your GitHub repository</span>
          </div>

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
                <div key={job.id} className="queue-item">
                  <div className="queue-item-header">
                    <span className="queue-repo">{job.task_id}</span>
                    <span className={`status-badge ${job.status}`}>
                      {job.status}
                    </span>
                  </div>
                  {job.status === 'progress' && (
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `50%` }}></div>
                    </div>
                  )}
                </div>
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
      const response = await fetch(`http://localhost:8000/scans/${taskId}`, {
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
        <div className={`status-badge ${scan.status}`}>{scan.status}</div>
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
                    <div className="code-diff">
                      <div className="code-block">
                        <label>Scanned Code:</label>
                        <pre><code>{result.scanned_code}</code></pre>
                      </div>
                      <div className="code-block">
                        <label>Fixed Code:</label>
                        <pre><code>{result.fixed_code}</code></pre>
                      </div>
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
