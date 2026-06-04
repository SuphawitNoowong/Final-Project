import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ParentDashboard.css";
import logo from "../assets/logo.png";
import { FaSearch, FaChevronRight } from "react-icons/fa";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import {
  FaHeart,
  FaDumbbell,
  FaAppleAlt,
  FaTint,
  FaShieldAlt,
  FaBalanceScale,
  FaClipboardList,     // ✅ เพิ่มS
} from "react-icons/fa";

function ParentDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [parentData, setParentData] = useState(null);

  useEffect(() => {
    const { hnNumber, role } = location.state || {};
    if (hnNumber && role) {
      localStorage.setItem("hnNumber", hnNumber);
      localStorage.setItem("role", role);
    }
  }, [location.state]);

  const hnNumber = location.state?.hnNumber || localStorage.getItem("hnNumber");

  useEffect(() => {
    if (hnNumber) {
      axios
        .get(`/api/parents/${hnNumber}`)
        .then((res) => setParentData(res.data))
        .catch((err) => console.error("ไม่สามารถโหลดข้อมูลผู้ปกครองได้", err));
    }
  }, [hnNumber]);

  useEffect(() => {
    if (parentData) {
      const fullName = `คุณ ${parentData.first_name_parent} ${parentData.last_name_parent}`;
      localStorage.setItem("fullName", fullName);
    }
  }, [parentData]);


  const handleReadMore = (title) => {
    alert(`อ่านเพิ่มเติมเกี่ยวกับ: ${title}`);
  };

  const recommendations = [
    {
      icon: <FaHeart />,
      title: "ลดการบริโภคอาหารที่มีไขมันสูง",
      description: "ช่วยลดความเสี่ยงของโรคหัวใจและน้ำหนักเกิน",
      color: "red",
    },
    {
      icon: <FaDumbbell />,
      title: "เพิ่มการออกกำลังกายวันละ 30 นาที",
      description: "ช่วยเสริมสร้างความแข็งแรงของร่างกาย",
      color: "blue",
    },
    {
      icon: <FaAppleAlt />,
      title: "เพิ่มการบริโภคผักและผลไม้",
      description: "เพิ่มวิตามินและแร่ธาตุเพื่อสุขภาพที่ดี",
      color: "green",
    },
    {
      icon: <FaTint />,
      title: "ดื่มน้ำให้เพียงพอ",
      description: "ช่วยให้ระบบการย่อยและการเผาผลาญทำงานได้ดี",
      color: "cyan",
    },
    {
      icon: <FaShieldAlt />,
      title: "เพิ่มการบริโภคธาตุเหล็ก",
      description: "ป้องกันภาวะโลหิตจางที่เกิดจากการขาดธาตุเหล็ก",
      color: "orange",
    },
    {
      icon: <FaBalanceScale />,
      title: "ควบคุมน้ำหนัก",
      description: "ลดความเสี่ยงของโรคอ้วนและเบาหวาน",
      color: "purple",
    },
  ];

  return (
    <div className="dashboard-container">
      <Header />

      <main className="dashboard-main">
        {/* ข้อมูลผู้ใช้ */}
        <div className="user-info-header">
          <div className="profile-circle">
            {parentData?.first_name_parent?.charAt(0)}
            {parentData?.last_name_parent?.charAt(0)}

            {/* จุดเขียว + จุดขาวกระพริบ */}
            <div className="status-dot">
              <div className="status-inner"></div>
            </div>
          </div>

          <div className="user-details">
            <p className="greeting1">ยินดีต้อนรับ 🌟</p>
            <h2 className="role1">ผู้ปกครอง</h2>
            <p className="username1">
              คุณ{" "}
              {parentData
                ? `${parentData.first_name_parent} ${parentData.last_name_parent}`
                : "Loading..."}
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


        {/* ปุ่มเมนูประเมิน */}
        <div className="menu-wrapper">
          <div
            className="menu-card"
            onClick={() => navigate("/parent-risk-selection", { state: { hnNumber } })}
          >
            <div className="menu-left">
              <div className="menu-icon-box">
                <FaSearch className="menu-icon" />
              </div>
              <div className="menu-texts">
                <p className="menu-title1">ประเมินความเสี่ยงเบื้องต้น</p>
                <p className="menu-subtitle">Preliminary Risk Assessment</p>
                <p className="menu-desc">คลิกเพื่อเริ่มการประเมิน</p>
              </div>
            </div>
            <FaChevronRight className="menu-arrow" />
          </div>


          <div
            className="menu-card"
            onClick={() => navigate("/history-risk-selection", { state: { hnNumber } })}
          >
            <div className="menu-left">
              <div className="menu-icon-box">
                <FaClipboardList className="menu-icon" />
              </div>
              <div className="menu-texts">
                <p className="menu-title1">ประวัติการตรวจ</p>
                <p className="menu-subtitle">Examination History</p>
                <p className="menu-desc">คลิกเพื่อดูประวัติการตรวจ</p>
              </div>
            </div>
            <FaChevronRight className="menu-arrow" />
          </div>
        </div>




        {/* คำแนะนำ */}
        <div className="recommendation-section">
          <h1 >
            คำแนะนำเกี่ยวกับภาวะโภชนาการ 🍎
          </h1>
          <br></br>
          <p className="subtitle">
            แนวทางการดูแลสุขภาพสำหรับคุณและครอบครัว
          </p>
          <div className="recommendation-cards">
            {recommendations.map((item, idx) => (
              <div key={idx} className={`recommendation-card card-bg-${item.color}`}>
                <div className={`icon-circle ${item.color}`}>{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.description}</p>
                <button
                  className="read-more-button white-bg"
                  onClick={() => handleReadMore(item.title)}
                >
                  อ่านเพิ่มเติม
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ParentDashboard;
