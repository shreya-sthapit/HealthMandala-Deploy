import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import AuthPage from './components/Auth/AuthPage';
import Home from './components/Home/Home';
import BookingConfirmed from './components/Booking/BookingConfirmed';
import KhaltiReturn from './components/Booking/KhaltiReturn';
import MyAppointments from './components/Appointments/MyAppointments';
import SelectDoctor from './components/Doctors/SelectDoctor';
import AllSpecialties from './components/Specialties/AllSpecialties';
import HospitalAppointments from './components/Hospitals/HospitalAppointments';
import DoctorProfile from './components/Doctors/DoctorProfile';
import MedicalRecords from './components/MedicalRecords/MedicalRecords';
import ChangePassword from './components/Profile/ChangePassword';
import BookAppointment from './components/Booking/BookAppointment';
import DoctorDashboard from './components/DoctorDashboard/DoctorDashboard';
import DoctorPatients from './components/DoctorDashboard/DoctorPatients';
import DoctorSchedule from './components/DoctorDashboard/DoctorSchedule';
import Profile from './components/Profile/Profile';
import DoctorProfileView from './components/Profile/DoctorProfile';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyOTP from './components/Auth/VerifyOTP';
import VerifyEmail from './components/Auth/VerifyEmail';
import NIDRegistration from './components/Auth/NIDRegistration';
import HospitalDashboard from './components/HospitalDashboard/HospitalDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard/ReceptionistDashboard';
import PharmacistDashboard from './components/PharmacistDashboard/PharmacistDashboard';
import SetHospitalPassword from './components/Auth/SetHospitalPassword';
import SetDoctorPassword from './components/Auth/SetDoctorPassword';
import SetStaffPassword from './components/Auth/SetStaffPassword';
import HospitalLogin from './components/Auth/HospitalLogin';
import PatientRegistrationForm from './components/Auth/PatientRegistration/PatientRegistrationForm';
import Navbar from './components/Navbar/Navbar';
import DoctorAuth from './components/Auth/DoctorAuth';
import Footer from './components/Footer/Footer';
import PartnerWithUs from './components/Partner/PartnerWithUs';
import Notifications from './components/Notifications/Notifications';
import './App.css';

// ── Guards ──────────────────────────────────────────
const isLoggedIn = () => !!localStorage.getItem('token');
const getRole = () => localStorage.getItem('userRole');

/** Redirect to login, preserving the intended URL */
const PatientRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token || role !== 'patient') {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
};

/** Patient or Doctor — any authenticated user */
const AuthRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');
  if (!token || !['patient', 'doctor'].includes(role)) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
};

/** Doctor-only routes */
const DoctorRoute = ({ children }) => {
  if (!isLoggedIn() || getRole() !== 'doctor') {
    return <Navigate to="/doctor-auth" replace />;
  }
  return children;
};

/** Hospital Admin routes */
const HospitalAdminRoute = ({ children }) => {
  const role = getRole();
  if (!isLoggedIn() || (role !== 'hospital_admin' && role !== 'admin' && role !== 'staff')) {
    return <Navigate to="/hospital/login" replace />;
  }
  return children;
};

/** Staff routes — accepts a list of allowed roles */
const StaffRoute = ({ children, allowedRoles }) => {
  const role = getRole();
  if (!isLoggedIn() || !allowedRoles.includes(role)) {
    return <Navigate to="/hospital/login" replace />;
  }
  return children;
};

/** Renders the correct profile page based on role */
const ProfileRouter = () => {
  const role = localStorage.getItem('userRole') ||
    JSON.parse(localStorage.getItem('user') || '{}').role || 'patient';
  return role === 'doctor' ? <DoctorProfileView /> : <Profile />;
};

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <div className="app">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/doctor-auth" element={<DoctorAuth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/nid-registration" element={<NIDRegistration />} />
          {/* Patient Registration — single form */}
          <Route path="/register" element={<PatientRegistrationForm />} />
          {/* Legacy step routes redirect to the single form */}
          <Route path="/register/personal" element={<Navigate to="/register" replace />} />
          <Route path="/register/address" element={<Navigate to="/register" replace />} />
          <Route path="/register/emergency" element={<Navigate to="/register" replace />} />
          <Route path="/register/medical" element={<Navigate to="/register" replace />} />
          <Route path="/register/nid" element={<Navigate to="/register" replace />} />
          {/* Doctor Registration Steps — removed, fields now in DoctorAuth signup */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/booking-confirmed" element={<PatientRoute><BookingConfirmed /></PatientRoute>} />
          <Route path="/khalti-return" element={<KhaltiReturn />} />
          <Route path="/my-appointments" element={<PatientRoute><MyAppointments /></PatientRoute>} />
          <Route path="/find-doctors" element={<SelectDoctor />} />
          <Route path="/book-appointment" element={<PatientRoute><BookAppointment /></PatientRoute>} />
          <Route path="/specialties" element={<AllSpecialties />} />
          <Route path="/hospitals" element={<HospitalAppointments />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/medical-records" element={<PatientRoute><MedicalRecords /></PatientRoute>} />
          <Route path="/doctor-dashboard" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
          <Route path="/doctor-patients" element={<DoctorRoute><DoctorPatients /></DoctorRoute>} />
          <Route path="/doctor-schedule" element={<DoctorRoute><DoctorSchedule /></DoctorRoute>} />
          <Route path="/profile" element={<AuthRoute><ProfileRouter /></AuthRoute>} />
          <Route path="/change-password" element={<AuthRoute><ChangePassword /></AuthRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/partner" element={<PartnerWithUs />} />
          <Route path="/notifications" element={<PatientRoute><Notifications /></PatientRoute>} />
          <Route path="/hospital/set-password" element={<SetHospitalPassword />} />
          <Route path="/doctor/set-password" element={<SetDoctorPassword />} />
          <Route path="/staff/set-password" element={<SetStaffPassword />} />
          <Route path="/hospital/login" element={<HospitalLogin />} />
          <Route path="/hospital-dashboard" element={<HospitalAdminRoute><HospitalDashboard /></HospitalAdminRoute>} />
          <Route path="/receptionist-dashboard" element={
            <StaffRoute allowedRoles={['receptionist', 'staff', 'hospital_admin', 'admin']}>
              <ReceptionistDashboard />
            </StaffRoute>
          } />
          <Route path="/pharmacist-dashboard" element={
            <StaffRoute allowedRoles={['pharmacist', 'staff', 'hospital_admin', 'admin']}>
              <PharmacistDashboard />
            </StaffRoute>
          } />
        </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
