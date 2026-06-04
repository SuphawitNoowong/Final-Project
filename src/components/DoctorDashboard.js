import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./DoctorDashboard.css";
import logo from "../assets/logo.png";
import ViewPatientResults from "./ViewPatientResults";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctorInfo, setDoctorInfo] = useState(null);

  // ✅ ดึงข้อมูลจาก OTP (ถ้ามี) แล้วเก็บไว้
  useEffect(() => {
    const { hnNumber, role } = location.state || {};
    if (hnNumber && role) {
      localStorage.setItem("hnNumber", hnNumber);
      localStorage.setItem("role", role);
    }
  }, [location.state]);

  // ✅ ใช้จาก state หรือ localStorage
  const hnNumber = location.state?.hnNumber || localStorage.getItem("hnNumber");

  useEffect(() => {
    if (hnNumber) {
      axios.get(`/api/doctors/${hnNumber}`)
        .then(res => setDoctorInfo(res.data))
        .catch(err => console.error("โหลดข้อมูลแพทย์ไม่สำเร็จ", err));
    } else {
      alert("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");
      navigate("/login");
    }
  }, [hnNumber, navigate]);

  // ✅ เพิ่มอันนี้ "ต่อท้าย" useEffect เก่าทั้งหมด
  useEffect(() => {
    if (doctorInfo) {
      const fullName = `${doctorInfo.prefix_name_doctor} ${doctorInfo.first_name_doctor} ${doctorInfo.last_name_doctor}`;
      localStorage.setItem("fullName", fullName);
    }
  }, [doctorInfo]);


  const getInitials = () => {
    if (!doctorInfo) return "";
    return (
      doctorInfo.first_name_doctor?.charAt(0) +
      doctorInfo.last_name_doctor?.charAt(0)
    );
  };

  return (
    <div className="dashboard-container">
      <Header />

      <main className="dashboard-main">
        <div className="user-info-header">
          <div className="profile-circle">
            {getInitials()}
            <div className="status-dot">
              <div className="status-inner"></div>
            </div>
          </div>

          <div className="user-details">
            <p className="greeting1">ยินดีต้อนรับ🌟</p>
            <h2 className="role1">บุคลากรทางการแพทย์</h2>
            <p className="username1">
              {doctorInfo
                ? `${doctorInfo.prefix_name_doctor} ${doctorInfo.first_name_doctor} ${doctorInfo.last_name_doctor}`
                : "กำลังโหลด..."}
            </p>
            <div className="underline1" />
          </div>
          <div className="user-date">
            <p className="date-label">วันนี้</p>
            <p className="date-value">
              {new Date().toLocaleDateString("th-TH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="results-section">
          <ViewPatientResults />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DoctorDashboard;
