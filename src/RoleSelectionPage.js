import React from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelectionPage.css";
import { FaHospitalSymbol, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import Header from "../src/components/layout/Header";
import Footer from "../src/components/layout/Footer";
function RoleSelectionPage() {
  const navigate = useNavigate();

  // ปุ่มเข้าสู่ระบบ
  const handleLoginClick = () => {
    navigate("/login");
  };

  // ปุ่มเริ่มต้นใช้งาน
  const handleStartClick = () => {
    navigate("/login");
  };

  return (
    <div className="role-wrapper">
      <header className="custom-header">
        <div className="header-left">
          <FaHospitalSymbol className="hospital-icon" />
          <span className="hospital-name">Guardian of the Child</span>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={() => navigate("/register")}>
            <FaSignInAlt size={24} />
            สมัครเข้าใช้งาน
          </button>
          <button className="logout-btn" onClick={handleStartClick}>
            <FaSignOutAlt size={24} />
            เริ่มต้นใช้งาน
          </button>

        </div>

      </header>



      <main className="role-content">
        <h1>
          ระบบบริการสุขภาพ <span className="highlight">ออนไลน์</span>
        </h1>
        <p>
          เข้าถึงบริการสุขภาพได้ง่ายขึ้น พร้อมระบบการจัดการที่ทันสมัย
          สำหรับผู้ปกครอง แพทย์ และผู้ดูแลระบบ
        </p>

        <div className="role-cards">
          <div
            className="role-card"
            onClick={() => window.location.href = `${window.location.origin}/login`}
            style={{ cursor: "pointer" }}
          >
            <div className="icon-box">👨‍👩‍👧‍👦</div>
            <h3>สำหรับผู้ปกครอง</h3>
            <p>
              ติดตามข้อมูลสุขภาพของบุตรหลาน
              และนัดหมายแพทย์ได้อย่างสะดวก
            </p>
          </div>

          <div
            className="role-card"
            onClick={() => window.location.href = `${window.location.origin}/login`}
            style={{ cursor: "pointer" }}
          >
            <div className="icon-box">🩺</div>
            <h3>สำหรับแพทย์</h3>
            <p>
              จัดการข้อมูลผู้ป่วย ประวัติการรักษา และกำหนดการนัดหมาย
            </p>
          </div>

          <div
            className="role-card"
            onClick={() => window.location.href = `${window.location.origin}/login?mode=admin`}
            style={{ cursor: "pointer" }}
          >
            <div className="icon-box">🔐</div>
            <h3>สำหรับผู้ดูแลระบบ</h3>
            <p>
              จัดการระบบ ผู้ใช้งาน และรายงานสถิติการใช้งานอย่างมีประสิทธิภาพ
            </p>
          </div>

        </div>


        <button className="start-button" onClick={handleStartClick}>
          เริ่มต้นใช้งาน
        </button>
      </main>

      <Footer />
    </div>
  );
}

export default RoleSelectionPage;
