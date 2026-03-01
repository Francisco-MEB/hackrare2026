import { useState } from "react";
import { globalCss } from "./theme";

// Shared
import LoginScreen from "./components/shared/LoginScreen";
import Sidebar from "./components/shared/Sidebar";

// Patient
import PatientDashboard from "./components/shared/patient/PatientDashboard";
import SymptomTracker from "./components/shared/patient/SymptomTracker";
import DeviceData from "./components/shared/patient/DeviceData";

// Doctor
import DoctorDashboard from "./components/shared/doctor/DoctorDashboard";
import DoctorPatientView from "./components/shared/doctor/DoctorPatientView";
import DoctorAI from "./components/shared/doctor/DoctorAI";

const patientNav = [
  { id: "home",     icon: "⊞", label: "Dashboard"      },
  { id: "symptoms", icon: "◈", label: "Symptoms"        },
  { id: "devices",  icon: "⊛", label: "Device Data"     },
  { id: "history",  icon: "☰", label: "Medical History" },
];

const doctorNav = [
  { id: "patients", icon: "⊜", label: "Patients"    },
  { id: "docai",    icon: "✦", label: "Clinical AI"  },
];

export default function App() {
  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Login screen
  if (!role) return (
    <>
      <style>{globalCss}</style>
      <LoginScreen onLogin={(r) => {
        setRole(r);
        setTab(r === "patient" ? "home" : "patients");
      }} />
    </>
  );

  const nav = role === "patient" ? patientNav : doctorNav;

  const renderContent = () => {
    if (role === "patient") {
      if (tab === "home")     return <PatientDashboard />;
      if (tab === "symptoms") return <SymptomTracker />;
      if (tab === "devices")  return <DeviceData />;

      // Coming soon (e.g. history)
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "12px" }}>
          <span style={{ fontSize: "32px", opacity: 0.15 }}>◈</span>
          <p style={{ color: "#7A6E65", fontSize: "14px" }}>This section is coming soon</p>
        </div>
      );
    }

    if (role === "doctor") {
      if (tab === "patients") {
        if (selectedPatient) return <DoctorPatientView patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
        return <DoctorDashboard onSelectPatient={(p) => setSelectedPatient(p)} />;
      }
      if (tab === "docai") return <DoctorAI />;
    }
  };

  return (
    <>
      <style>{globalCss}</style>
      <div style={{ display: "flex" }}>
        <Sidebar
          items={nav}
          active={tab}
          role={role}
          onSelect={(id) => { setTab(id); setSelectedPatient(null); }}
          onLogout={() => { setRole(null); setTab("home"); }}
        />
        <main style={{ marginLeft: "300px", flex: 1, padding: "clamp(24px, 3.5vh, 52px) clamp(28px, 3.5vw, 60px)", minHeight: "100vh" }}>
          {renderContent()}
        </main>
      </div>
    </>
  );
}
