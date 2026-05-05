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
import ProfileScreen from './screens/ProfileScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import DriverOfferRideScreen from './screens/DriverOfferRideScreen';
import DriverMyRidesScreen from './screens/DriverMyRidesScreen';
import DriverVehiclesScreen from './screens/DriverVehiclesScreen';
import AdminDashboard from './admin/AdminDashboard';
import WebLogin from './admin/WebLogin';
import AppShell from './components/AppShell';
import PendingApprovalScreen from './screens/PendingApprovalScreen';

// ─── Guards ───────────────────────────────────────────────────────────────────

function RootRedirect() {
  const { isAuthenticated, isAdmin, isPendingDriver } = useAuth();
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
  return <Navigate to={isAdmin ? '/admin' : isPendingDriver ? '/pending-approval' : '/home'} replace />;
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
      <Route path="/driver/inbox"              element={<UserRoute driverOnly><DriverInboxScreen /></UserRoute>} />
      <Route path="/driver/inbox/:rideId"      element={<UserRoute driverOnly><DriverInboxScreen /></UserRoute>} />
      <Route path="/driver/offer-ride"         element={<UserRoute driverOnly><DriverOfferRideScreen /></UserRoute>} />
      <Route path="/driver/my-rides"           element={<UserRoute driverOnly><DriverMyRidesScreen /></UserRoute>} />
      <Route path="/driver/vehicles"           element={<UserRoute driverOnly><DriverVehiclesScreen /></UserRoute>} />
      <Route path="/profile"                   element={<UserRoute><ProfileScreen /></UserRoute>} />
      <Route path="/payments"                  element={<UserRoute><PaymentsScreen /></UserRoute>} />
      <Route path="/pending-approval"          element={<UserRoute><PendingApprovalScreen /></UserRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
