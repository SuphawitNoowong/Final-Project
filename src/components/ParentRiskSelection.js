import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import "./ParentRiskSelection.css";
import hamster from '../assets/hamster.jpg'

function ParentRiskSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const hnNumber = location.state?.hnNumber || localStorage.getItem("hnNumber");

  const [children, setChildren] = useState([]);

  useEffect(() => {
    if (hnNumber) {
      axios
        .get(`/api/children-by-parent/${hnNumber}`)
        .then((res) => {
          console.log("🎯 เด็กที่โหลดได้:", res.data);
          setChildren(res.data);
        })
        .catch((err) => console.error("โหลดรายชื่อเด็กไม่สำเร็จ", err));
    } else {
      console.warn("⚠️ hnNumber ไม่พบใน state หรือ localStorage");
    }
  }, [hnNumber]);

  const handleChildSelect = (child) => {

    localStorage.removeItem("generalFormData");
    localStorage.removeItem("caregiverFormData");
    localStorage.removeItem("nutritionFormData");
    localStorage.removeItem("sanitationFormData");

    localStorage.removeItem("generalProgress");
    localStorage.removeItem("caregiverProgress");
    localStorage.removeItem("nutritionProgress");
    localStorage.removeItem("sanitationProgress");

    localStorage.removeItem("generalCompletedGroups");
    localStorage.removeItem("caregiverCompletedGroups");
    localStorage.removeItem("nutritionCompletedGroups");
    localStorage.removeItem("sanitationCompletedGroups");


    localStorage.setItem("childHn", child.hn);
    localStorage.setItem("childId", child.patient_id);

    // ⏩ ไปหน้าถัดไป
    navigate("/parent-risk-assessment");
  };


  return (
    <div className="dashboard-container">
      <Header currentPage="form-nutrition" />

      {/* Title */}
      <div className="children-section-title">
        เลือกบุตร/หลานที่ต้องการประเมิน
      </div>

      {/* Card Grid */}
      {children.length === 0 ? (
        <div className="no-children-message">
          ❗<br />
          คุณไม่มีเด็กในการดูแล จึงไม่สามารถประเมินได้
        </div>
      ) : (
        <div className="children-grid">
          {children.map((child) => (
            <div
              className="child-card"
              key={child.patient_id}
              onClick={() => handleChildSelect(child)}
            >
              <img
                src={child.image_url || hamster}
                alt="Child Avatar"
                className="child-avatar"
              />
              <div className="child-name">
                {`${child.prefix_name_child} ${child.first_name_child} ${child.last_name_child}`}
              </div>
              <div className="child-hn-badge">
                HN {child.hn}
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}

export default ParentRiskSelection;
