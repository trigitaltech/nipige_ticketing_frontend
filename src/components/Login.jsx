import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../redux/authSlice';
import '../assets/Styles/Login.css';

const Login = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('EMPLOYEE');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      dispatch(login({ email, password, userType }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="logo-container">
            <img
              src="https://cdn-icons-png.flaticon.com/512/3524/3524659.png"
              alt="Ticket Management"
              className="logo-icon"
            />
          </div>
          <h1>Ticket Management</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <img
                src="https://cdn-icons-png.flaticon.com/512/542/542689.png"
                alt="Email"
                className="input-icon"
              />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <img
                src={showPassword
                  ? "https://cdn-icons-png.flaticon.com/512/159/159604.png"
                  : "https://cdn-icons-png.flaticon.com/512/2767/2767146.png"
                }
                alt={showPassword ? "Hide password" : "Show password"}
                className="input-icon password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          <div className="user-type-container">
            <label htmlFor="userType">User Type</label>
            <div className="user-type-wrapper">
              <select
                id="userType"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="user-type-select-compact"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Admin</option>
              </select>
              <img
                src="https://cdn-icons-png.flaticon.com/512/32/32195.png"
                alt="Open user type dropdown"
                className="user-type-icon"
              />
            </div>
          </div>
          {error && (
            <div className="error-message">
              <img
                src="https://cdn-icons-png.flaticon.com/512/753/753345.png"
                alt="Error"
                className="error-icon"
              />
              {error}
            </div>
          )}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

      
      </div>
    </div>
  );
};

export default Login;