import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import useIsDesktop from './hooks/useIsDesktop';

import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import MatchingScreen from './screens/MatchingScreen';
import TrackingScreen from './screens/TrackingScreen';
import ChatScreen from './screens/ChatScreen';
import SosScreen from './screens/SosScreen';
import DriverInboxScreen from './screens/DriverInboxScreen';
import AdminDashboard from './admin/AdminDashboard';
import WebLogin from './admin/WebLogin';
import AppShell from './components/AppShell';

// ─── Guards ───────────────────────────────────────────────────────────────────

function RootRedirect() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  if (!isAuthenticated) {
    if (isDesktop) {
      return <SplashScreen onLogin={() => navigate('/login')} onSSO={() => navigate('/login')} />;
    }
    return (
      <div className="device-frame">
        <SplashScreen onLogin={() => navigate('/login')} onSSO={() => navigate('/login')} />
      </div>
    );
  }
  return <Navigate to={isAdmin ? '/admin' : '/home'} replace />;
}

// Rider / driver routes — desktop: AppShell sidebar; mobile: device-frame
function UserRoute({ children, driverOnly = false }) {
  const { isAuthenticated, isDriver, isAdmin } = useAuth();
  const isDesktop = useIsDesktop();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (driverOnly && !isDriver && !isAdmin) return <Navigate to="/home" replace />;

  if (isDesktop) return <AppShell>{children}</AppShell>;
  return <div className="device-frame">{children}</div>;
}

// Admin-only — full-width, no shell
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

// ─── Param wrappers ───────────────────────────────────────────────────────────

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

// ─── Routes ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<RootRedirect />} />
      <Route path="/login"           element={<WebLogin />} />
      <Route path="/register"        element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

      {/* Admin — full-width dashboard */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Rider / driver — responsive (AppShell on desktop, device-frame on mobile) */}
      <Route path="/home"             element={<UserRoute><HomeScreen /></UserRoute>} />
      <Route path="/match"            element={<UserRoute><MatchingWrapper /></UserRoute>} />
      <Route path="/tracking/:rideId" element={<UserRoute><TrackingWrapper /></UserRoute>} />
      <Route path="/chat/:rideId"     element={<UserRoute><ChatWrapper /></UserRoute>} />
      <Route path="/sos/:rideId"      element={<UserRoute><SosWrapper /></UserRoute>} />
      <Route path="/driver/inbox"     element={<UserRoute driverOnly><DriverInboxScreen /></UserRoute>} />
      <Route path="/driver/inbox/:rideId" element={<UserRoute driverOnly><DriverInboxScreen /></UserRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
