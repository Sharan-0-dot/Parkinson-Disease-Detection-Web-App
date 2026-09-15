import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import PatientsPage from "./pages/PatientsPage";
import NewPatientPage from "./pages/NewPatientPage";
import EditPatientPage from "./pages/EditPatientPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import RecordVoicePage from "./pages/RecordVoicePage";

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Authenticated app */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            }
          />
          <Route
            path="/patients"
            element={
              <AppLayout>
                <PatientsPage />
              </AppLayout>
            }
          />
          <Route
            path="/patients/new"
            element={
              <AppLayout>
                <NewPatientPage />
              </AppLayout>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <AppLayout>
                <EditPatientPage />
              </AppLayout>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <AppLayout>
                <PatientDetailPage />
              </AppLayout>
            }
          />
          <Route
            path="/patients/:id/record"
            element={
              <AppLayout>
                <RecordVoicePage />
              </AppLayout>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
