import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTarget from './pages/AddTarget';
import Systems from './pages/Systems';
import TargetDetail from './pages/TargetDetail';
import Profile from './pages/Profile';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        <Route path="/dashboard" element={
          isLoggedIn ? (
            <MainLayout>
              <Dashboard />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/add-target" element={
          isLoggedIn ? (
            <MainLayout>
              <AddTarget />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/systems" element={
          isLoggedIn ? (
            <MainLayout>
              <Systems />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/targets/:id" element={
          isLoggedIn ? (
            <MainLayout>
              <TargetDetail />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/profile" element={
          isLoggedIn ? (
            <MainLayout>
              <Profile />
            </MainLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
