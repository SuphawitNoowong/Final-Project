import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelectionPage from "./RoleSelectionPage"; // ✅ หน้าแรก Landing
import LoginPage from "./LoginPage";
import OTPLogin from "./OTPLogin";
import EnterOTP from "./EnterOTP";
import ParentDashboard from "./components/ParentDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ManageDepartment from "./components/ManageDepartment";
import ManageParentDepartment from "./components/ManageParentDepartment";
import ManageDoctorDepartment from "./components/ManageDoctorDepartment";
import ViewPatientResults from "./components/ViewPatientResults";
import GroupedDataInput from "./components/GroupedDataInput";
import GeneralForm from "./components/Form/GeneralForm";
import NutritionForm from "./components/Form/NutritionForm";
import SanitationForm from "./components/Form/SanitationForm";
import Recomendation from "./components/Recomendation";
import PredictionModel from "./components/Prediction_model/PredictionModel"; // ✅ เพิ่มตรงนี้
import ParentRiskSelection from "./components/ParentRiskSelection"; // ✅ ต้อง import ตรงนี้
import MedicalHistory from "./components/Prediction_model/MedicalHistory";
import RegisterParent from "./RegisterParent";
import HistoryRiskSelection from "./components/HistoryRiskSelection";


import './styles.css';


function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<RoleSelectionPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp-login" element={<OTPLogin />} />
        <Route path="/enter-otp" element={<EnterOTP />} />
        <Route path="/register" element={<RegisterParent />} />

        {/* Parent Routes */}
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/parent-risk-selection" element={<ParentRiskSelection />} />
        <Route path="/parent-risk-assessment" element={<GroupedDataInput />} />
        <Route path="/form/general" element={<GeneralForm />} />
        <Route path="/form/nutrition" element={<NutritionForm />} />
        <Route path="/form/sanitation" element={<SanitationForm />} />
        <Route path="/pre" element={<PredictionModel />} /> {/* ✅ เพิ่ม route ไปยังหน้าผลประเมิน */}
        <Route path="/prediction-result" element={<PredictionModel />} />
        <Route path="/medical-history" element={<MedicalHistory />} />
        <Route path="/history-risk-selection" element={<HistoryRiskSelection />} />

        


        {/* Doctor Routes */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/view-results" element={<ViewPatientResults />} />
        <Route path="/Recomendation/:id" element={<Recomendation />} />

        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/manage-department" element={<ManageDepartment />} />
        <Route path="/manage-parents" element={<ManageParentDepartment />} />
        <Route path="/manage-doctors" element={<ManageDoctorDepartment />} />
      </Routes>
    </Router>
  );
}

export default App;
