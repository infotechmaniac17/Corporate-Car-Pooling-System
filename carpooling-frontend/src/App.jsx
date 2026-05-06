import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import useIsDesktop from './hooks/useIsDesktop';
import useUserActivity from './hooks/useUserActivity';

import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
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
import DriverApplicationScreen from './screens/DriverApplicationScreen';
import AddressSetupScreen from './screens/AddressSetupScreen';

// ─── Mode-switch blocker modal ────────────────────────────────────────────────

function DriverModeModal({ onClose, onSwitch }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--asphalt-900)', marginBottom: 8 }}>
          Switch to Driver mode?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--asphalt-500)', marginBottom: 24 }}>
          This page is for drivers. Switch to driver mode to access it.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: '1px solid var(--asphalt-200)', background: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={onSwitch}
            style={{ flex: 1, padding: '10px 0', borderRadius: 999, border: 'none', background: 'var(--ink-950)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            Switch mode
          </button>
        </div>
      </div>
    </div>
  );
}

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

function UserRoute({ children, driverOnly = false, activityState }) {
  const { isAuthenticated, isAdmin, isDriver, activeMode, setActiveMode } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (driverOnly && !isAdmin) {
    if (!isDriver) return <Navigate to="/home" replace />;
    if (activeMode !== 'driver') {
      return (
        <>
          <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--asphalt-50)' }} />
          <DriverModeModal
            onClose={() => navigate(-1)}
            onSwitch={() => setActiveMode('driver')}
          />
        </>
      );
    }
  }

  if (isDesktop) return <AppShell activityState={activityState}>{children}</AppShell>;
  return <div className="device-frame">{children}</div>;
}

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
      onSelect={(ride) => navigate(`/tracking/${ride.id}`)}
      onBack={() => navigate(-1)}
    />
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function U({ children, driverOnly = false, activityState }) {
  return (
    <UserRoute driverOnly={driverOnly} activityState={activityState}>{children}</UserRoute>
  );
}

export default function App() {
  const activityState = useUserActivity();

  return (
    <Routes>
      {/* Public */}
      <Route path="/"                element={<RootRedirect />} />
      <Route path="/login"           element={<WebLogin />} />
      <Route path="/register"        element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password"  element={<ResetPasswordScreen />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

      {/* Rider / driver */}
      <Route path="/home"             element={<U activityState={activityState}><HomeScreen activityState={activityState} /></U>} />
      <Route path="/match"            element={<U activityState={activityState}><MatchingWrapper /></U>} />
      <Route path="/tracking/:rideId" element={<U activityState={activityState}><TrackingWrapper /></U>} />
      <Route path="/chat/:rideId"     element={<U activityState={activityState}><ChatWrapper /></U>} />
      <Route path="/sos/:rideId"      element={<U activityState={activityState}><SosWrapper /></U>} />
      <Route path="/driver/inbox"              element={<U driverOnly activityState={activityState}><DriverInboxScreen /></U>} />
      <Route path="/driver/inbox/:rideId"      element={<U driverOnly activityState={activityState}><DriverInboxScreen /></U>} />
      <Route path="/driver/offer-ride"         element={<U driverOnly activityState={activityState}><DriverOfferRideScreen activityState={activityState} /></U>} />
      <Route path="/driver/my-rides"           element={<U driverOnly activityState={activityState}><DriverMyRidesScreen /></U>} />
      <Route path="/driver/vehicles"           element={<U driverOnly activityState={activityState}><DriverVehiclesScreen /></U>} />
      <Route path="/profile"                   element={<U activityState={activityState}><ProfileScreen activityState={activityState} /></U>} />
      <Route path="/payments"                  element={<U activityState={activityState}><PaymentsScreen /></U>} />
      <Route path="/pending-approval"          element={<U activityState={activityState}><PendingApprovalScreen /></U>} />
      <Route path="/become-driver"             element={<U activityState={activityState}><DriverApplicationScreen /></U>} />
      <Route path="/setup-address"             element={<U activityState={activityState}><AddressSetupScreen /></U>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
