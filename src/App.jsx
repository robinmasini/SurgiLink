import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Rentabilite from './pages/Rentabilite';
import PatientChecklist from './pages/PatientChecklist';
import PatientSuccess from './pages/PatientSuccess';
import PatientFeedback from './pages/PatientFeedback';
import PatientPostOp from './pages/PatientPostOp';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Professional Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/rentabilite" element={<Rentabilite />} />

        {/* Patient Routes */}
        <Route path="/patient/checklist" element={<PatientChecklist />} />
        <Route path="/patient/postop" element={<PatientPostOp />} />
        <Route path="/patient/feedback" element={<PatientFeedback />} />
        <Route path="/patient/success" element={<PatientSuccess />} />
      </Routes>
    </Router>
  );
}

export default App;
