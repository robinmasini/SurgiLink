import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Rentabilite from './pages/Rentabilite';
import Users from './pages/Users';
import PatientChecklist from './pages/PatientChecklist';
import PatientSuccess from './pages/PatientSuccess';
import PatientPostOp from './pages/PatientPostOp';
import PatientReview from './pages/PatientReview';
import PatientJ7 from './pages/PatientJ7';
import PatientJ4 from './pages/PatientJ4';
import PatientJ2 from './pages/PatientJ2';
import PatientJ1PreOp from './pages/PatientJ1PreOp';
import PatientJ1 from './pages/PatientJ1';
import PatientESatis from './pages/PatientESatis';
import Account from './pages/Account';
import PatientPathwayTracker from './components/PatientPathwayTracker';
import PatientPortal from './pages/PatientPortal';
import ProtectedRoute from './components/ProtectedRoute';
import PatientTokenRoute from './components/PatientTokenRoute';
import MobileNavbar from './components/MobileNavbar';
import './index.css';

// Force deploy trigger - 2026-02-02
function App() {
  return (
    <Router>
      <MobileNavbar />
      <Routes>
        {/* Professional Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/rentabilite" element={<ProtectedRoute><Rentabilite /></ProtectedRoute>} />
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
        <Route path="/patient/pathway/j2/:patientId" element={<PatientJ2 />} />
        <Route path="/patient/pathway/j1-preop/:patientId" element={<PatientJ1PreOp />} />
        <Route path="/patient/pathway/j1/:patientId" element={<PatientJ1 />} />

        {/* Pathway Routes - Staff-facing */}
        <Route path="/staff/pathway/:patientId" element={<ProtectedRoute><PatientPathwayTracker /></ProtectedRoute>} />

        {/* Patient Portal Routes - Token-based access (no authentication required) */}
        <Route path="/patient-portal/:token" element={<PatientTokenRoute><PatientPortal /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/j7" element={<PatientTokenRoute><PatientJ7 /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/j4" element={<PatientTokenRoute><PatientJ4 /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/j2" element={<PatientTokenRoute><PatientJ2 /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/j1-preop" element={<PatientTokenRoute><PatientJ1PreOp /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/j1" element={<PatientTokenRoute><PatientJ1 /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/e-satis" element={<PatientTokenRoute><PatientESatis /></PatientTokenRoute>} />
        <Route path="/patient-portal/:token/success" element={<PatientTokenRoute><PatientSuccess /></PatientTokenRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
