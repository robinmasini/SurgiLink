import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CachedAssets from './components/CachedAssets';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Users from './pages/Users';
import PatientChecklist from './pages/PatientChecklist';
import PatientSuccess from './pages/PatientSuccess';
import PatientPostOp from './pages/PatientPostOp';
import PatientReview from './pages/PatientReview';
import Bienvenue from './pages/Bienvenue';
import PatientJ7 from './pages/PatientJ7';
import PatientJ4 from './pages/PatientJ4';
import PatientJ1PreOp from './pages/PatientJ1PreOp';
import PatientJ1 from './pages/PatientJ1';
import PatientESatis from './pages/PatientESatis';
import Account from './pages/Account';
import PatientPathwayTracker from './components/PatientPathwayTracker';
import PatientPortal from './pages/PatientPortal';
import OnboardingFlow from './pages/OnboardingFlow';
import IntakeForm from './pages/IntakeForm';
import Comments from './pages/Comments';
import HopitalManager from './pages/HopitalManager';
import ProtectedRoute from './components/ProtectedRoute';
import PatientTokenRoute from './components/PatientTokenRoute';
import MobileNavbar from './components/MobileNavbar';
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#FEF2F2', color: '#991B1B', minHeight: '100vh', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Diagnostic SurgiLink : Une erreur est survenue</h2>
          <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #FCA5A5', color: '#DC2626', fontWeight: 'bold', fontSize: '14px', marginBottom: '16px' }}>
            {this.state.error && this.state.error.toString()}
          </div>
          {this.state.errorInfo && (
            <pre style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', color: '#374151', overflowX: 'auto', fontSize: '12px' }}>
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '12px 24px', background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <CachedAssets />
        <MobileNavbar />
        <Routes>
          {/* Professional Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/comments" element={<ProtectedRoute><Comments /></ProtectedRoute>} />
          <Route path="/hopital-manager" element={<ProtectedRoute><HopitalManager /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="practitioner"><Users /></ProtectedRoute>} />
          <Route path="/patient/:id" element={<ProtectedRoute><PatientReview /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

          {/* Patient Routes */}
          <Route path="/patient/:patientId/checklist" element={<PatientChecklist />} />
          <Route path="/patient/:patientId/postop" element={<PatientPostOp />} />
          <Route path="/patient/:patientId/success" element={<PatientSuccess />} />

          {/* Pathway Routes - Patient-facing */}
          <Route path="/patient/pathway/j7/:patientId" element={<PatientJ7 />} />
          <Route path="/patient/pathway/j4/:patientId" element={<PatientJ4 />} />
          <Route path="/patient/pathway/j1-preop/:patientId" element={<PatientJ1PreOp />} />
          <Route path="/patient/pathway/j1/:patientId" element={<PatientJ1 />} />

          {/* Pathway Routes - Staff-facing */}
          <Route path="/staff/pathway/:patientId" element={<ProtectedRoute><PatientPathwayTracker /></ProtectedRoute>} />

          {/* Patient Portal Routes - Token-based access (no authentication required) */}
          {/* Intake Form Route – patient-facing, no auth required */}
          <Route path="/fiche/:token" element={<IntakeForm />} />

          <Route path="/patient-portal/:token/onboarding" element={<OnboardingFlow />} />
          <Route path="/patient-portal/:token" element={<PatientTokenRoute><PatientPortal /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/bienvenue" element={<PatientTokenRoute><Bienvenue /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/j7" element={<PatientTokenRoute><PatientJ7 /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/j4" element={<PatientTokenRoute><PatientJ4 /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/j1-preop" element={<PatientTokenRoute><PatientJ1PreOp /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/j1" element={<PatientTokenRoute><PatientJ1 /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/j2" element={<PatientTokenRoute><PatientJ1 /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/e-satis" element={<PatientTokenRoute><PatientESatis /></PatientTokenRoute>} />
          <Route path="/patient-portal/:token/success" element={<PatientTokenRoute><PatientSuccess /></PatientTokenRoute>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
