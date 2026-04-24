import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './components/Login';
import AppLayout from './pages/AppLayout';
import { logout } from './redux/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={3000} />
      {!isAuthenticated ? (
        <Login />
      ) : (
        <BrowserRouter>
          <AppLayout currentUser={user} onLogout={handleLogout} />
        </BrowserRouter>
      )}
    </div>
  );
}

export default App;
