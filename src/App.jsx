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
    <div style={{ padding: '50px', fontSize: '24px', color: 'black' }}>
      SurgiLink Debug: Hello World
    </div>
  );
}

export default App;
