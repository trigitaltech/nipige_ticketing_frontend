import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import { logout } from './redux/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };
  console.log("=====>user", user);
  const currentUser = user ;

  return (
    <div className="App">
      <ToastContainer position="top-right" autoClose={3000} />
      {!isAuthenticated ? (
        <Login />
      ) : (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;