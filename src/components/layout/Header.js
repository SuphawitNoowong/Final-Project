import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHospitalSymbol, FaSignOutAlt, FaHome, FaUserCircle } from "react-icons/fa";
import "./Header.css";

function Header({ currentPage }) {
  const navigate = useNavigate();

  // ✅ อ่านชื่อจาก localStorage ทุกครั้ง
  const userName = localStorage.getItem("fullName") || "";

  // ✅ ฟังก์ชันออกจากระบบ: ล้างข้อมูลใน localStorage
  const handleLogout = () => {
    localStorage.removeItem("hnNumber");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/"); // หรือ "/login" หากมีหน้า login
  };

  // ✅ แผนที่ path สำหรับปุ่มย้อนกลับ
  const pageToPath = {
    "manage-department": "/admin-dashboard",
    "form-nutrition": "/parent-dashboard",
    "manage-doctors": "/manage-doctors",
    "manage-parents": "/manage-parents",
  };

  const pageToButtonLabel = {
    "manage-department": "กลับหน้าหลัก",
    "form-nutrition": "กลับหน้าหลัก",
    "manage-doctors": "กลับแดชบอร์ด",
    "manage-parents": "ย้อนกลับ",
  };

  const handleLogoClick = () => {
    const targetPath = pageToPath[currentPage] || "/";
    navigate(targetPath);
  };

  return (
    <header className="custom-header">
      <div className="header-left" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
        <FaHospitalSymbol className="hospital-icon" />
        <span className="hospital-name">Guardian of the Child</span>
      </div>

      <div className="header-right">
        {/* ✅ แสดงชื่อผู้ใช้ + ไอคอนเลื่อนลงเล็กน้อย */}
        {userName && (
          <span className="user-name">
            <FaUserCircle
              style={{
                marginRight: "8px",
                position: "relative",
                top: "0.5px", // 👈 ขยับไอคอนลง
              }}
            />
            {userName}
          </span>
        )}

        {pageToPath[currentPage] && (
          <button className="menu-btn" onClick={() => navigate(pageToPath[currentPage])}>
            <FaHome size={24} />
            {pageToButtonLabel[currentPage]}
          </button>
        )}

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt size={24} />
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}

export default Header;
