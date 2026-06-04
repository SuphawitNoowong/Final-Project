import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // 👈 เพิ่ม useNavigate
import axios from "axios";
import "./AdminDashboard.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { FaChild, FaUserShield, FaUserMd } from "react-icons/fa";


function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate(); // ✅ เพิ่มตรงนี้
  const [adminInfo, setAdminInfo] = useState(null);


  // ✅ เก็บ HN และ role ลง localStorage
  useEffect(() => {
    const { hnNumber, role } = location.state || {};
    if (hnNumber && role) {
      localStorage.setItem("hnNumber", hnNumber);
      localStorage.setItem("role", role);
    }
  }, [location.state]);

  const hnNumber = location.state?.hnNumber || localStorage.getItem("hnNumber");

  // ✅ โหลดข้อมูล admin จาก hn
  useEffect(() => {
    if (hnNumber) {
      axios
        .get(`/api/admins/${hnNumber}`)
        .then((res) => setAdminInfo(res.data))
        .catch((err) => console.error("โหลดข้อมูลแอดมินไม่สำเร็จ", err));
    }
  }, [hnNumber]);

  useEffect(() => {
    if (adminInfo) {
      const fullName = `${adminInfo.prefix_name_admin} ${adminInfo.first_name_admin} ${adminInfo.last_name_admin}`;
      localStorage.setItem("fullName", fullName);
    }
  }, [adminInfo]);

  const getInitials = () => {
    if (!adminInfo) return "";
    return (
      adminInfo.first_name_admin?.charAt(0) +
      adminInfo.last_name_admin?.charAt(0)
    );
  };

  const adminMenus = [
    {
      icon: <FaChild />,
      title: "การจัดการข้อมูลเด็ก",
      description: "Manage Pediatric Department",
      onClick: () => navigate("/manage-department"),
      color: "blue",
    },
    {
      icon: <FaUserShield />,
      title: "การจัดการข้อมูลผู้ปกครอง",
      description: "Manage Parents Department",
      onClick: () => navigate("/manage-parents"),
      color: "orange",
    },
    {
      icon: <FaUserMd />,
      title: "การจัดการข้อมูลหมอ",
      description: "Manage Doctors Department",
      onClick: () => navigate("/manage-doctors"),
      color: "purple",
    },
  ];

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
            <p className="greeting1">ยินดีต้อนรับ 🌟</p>
            <h2 className="role1">ผู้ดูแลระบบ</h2>
            <p className="username1">
              {adminInfo
                ? `${adminInfo.prefix_name_admin} ${adminInfo.first_name_admin} ${adminInfo.last_name_admin}`
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
        <div className="menu-container">
          {adminMenus.map((item, index) => (
            <div key={index} className="menu-item" onClick={item.onClick}>
              <div className={`icon-circle ${item.color}`}>{item.icon}</div>
              <p className="menu-title">{item.title}</p>
              <small className="menu-description">{item.description}</small>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default AdminDashboard;
