import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import MatchingScreen from './screens/MatchingScreen';
import TrackingScreen from './screens/TrackingScreen';
import ChatScreen from './screens/ChatScreen';
import SosScreen from './screens/SosScreen';
import DriverInboxScreen from './screens/DriverInboxScreen';
import AdminDashboard from './admin/AdminDashboard';

function ProtectedRoute({ children, driverOnly = false }) {
  const { isAuthenticated, isDriver, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (driverOnly && !isDriver && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="device-frame">
      {children}
    </div>
  );
}

function AdminRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function TrackingWrapper() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  return (
    <TrackingScreen
      rideId={rideId}
      onBack={() => navigate(-1)}
      onSos={() => navigate(`/sos/${rideId}`)}
      onChat={() => navigate(`/chat/${rideId}`)}
    />
  );
}

function ChatWrapper() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  return <ChatScreen rideId={rideId} onBack={() => navigate(-1)} />;
}

function SosWrapper() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  return <SosScreen rideId={rideId} onCancel={() => navigate(-1)} />;
}

function DriverInboxWrapper() {
  const { rideId } = useParams();
  return <DriverInboxScreen rideId={rideId} />;
}

function MatchingWrapper() {
  const navigate = useNavigate();
  return (
    <MatchingScreen
      pickup="Home"
      dropoff="Office"
      onSelect={(ride) => navigate(`/tracking/${ride.id}`)}
      onBack={() => navigate(-1)}
    />
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="device-frame">
      <SplashScreen
        onLogin={() => navigate('/login')}
        onSSO={() => navigate('/login')}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<div className="device-frame"><LoginScreen /></div>} />
      <Route path="/register" element={<div className="device-frame"><RegisterScreen /></div>} />

      <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
      <Route path="/match" element={<ProtectedRoute><MatchingWrapper /></ProtectedRoute>} />
      <Route path="/tracking/:rideId" element={<ProtectedRoute><TrackingWrapper /></ProtectedRoute>} />
      <Route path="/chat/:rideId" element={<ProtectedRoute><ChatWrapper /></ProtectedRoute>} />
      <Route path="/sos/:rideId" element={<ProtectedRoute><SosWrapper /></ProtectedRoute>} />
      <Route path="/driver/inbox" element={<ProtectedRoute driverOnly><DriverInboxScreen /></ProtectedRoute>} />
      <Route path="/driver/inbox/:rideId" element={<ProtectedRoute driverOnly><DriverInboxWrapper /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
