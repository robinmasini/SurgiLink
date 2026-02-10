import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Rentabilite from './pages/Rentabilite';
import PatientChecklist from './pages/PatientChecklist';
import PatientSuccess from './pages/PatientSuccess';
import PatientFeedback from './pages/PatientFeedback';
import PatientPostOp from './pages/PatientPostOp';
import PatientReview from './pages/PatientReview';
import CategoryReview from './pages/CategoryReview';
import PatientJ7 from './pages/PatientJ7';
import PatientJ2 from './pages/PatientJ2';
import PatientJ1 from './pages/PatientJ1';
import PatientPathwayTracker from './components/PatientPathwayTracker';
import PatientPortal from './pages/PatientPortal';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

// Force deploy trigger - 2026-02-02
function App() {
  return (
    <Router>
      <Routes>
        {/* Professional Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/rentabilite" element={<ProtectedRoute><Rentabilite /></ProtectedRoute>} />
        <Route path="/patient/:id" element={<ProtectedRoute><PatientReview /></ProtectedRoute>} />
        <Route path="/review/:category" element={<ProtectedRoute><CategoryReview /></ProtectedRoute>} />

        {/* Patient Routes */}
        <Route path="/patient/:patientId/checklist" element={<PatientChecklist />} />
        <Route path="/patient/:patientId/postop" element={<PatientPostOp />} />
        <Route path="/patient/:patientId/feedback" element={<PatientFeedback />} />
        <Route path="/patient/:patientId/success" element={<PatientSuccess />} />

        {/* Pathway Routes - Patient-facing */}
        <Route path="/patient/pathway/j7/:patientId" element={<PatientJ7 />} />
        <Route path="/patient/pathway/j2/:patientId" element={<PatientJ2 />} />
        <Route path="/patient/pathway/j1/:patientId" element={<PatientJ1 />} />

        {/* Pathway Routes - Staff-facing */}
        <Route path="/staff/pathway/:patientId" element={<ProtectedRoute><PatientPathwayTracker /></ProtectedRoute>} />

        {/* Patient Portal Routes - Token-based access (no authentication required) */}
        <Route path="/patient-portal/:token" element={<PatientPortal />} />
        <Route path="/patient-portal/:token/j7" element={<PatientJ7 />} />
        <Route path="/patient-portal/:token/j2" element={<PatientJ2 />} />
        <Route path="/patient-portal/:token/j1" element={<PatientJ1 />} />
      </Routes>
    </Router>
  );
}

export default App;
