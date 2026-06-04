import React, { useState, useEffect } from "react";
import "./NutritionForm.css";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useRef } from "react";



const nutritionGroups = [
  {
    groupTitle: "น้ำหนักและส่วนสูง",
    groupNote: "✏️ โปรดกรอกจำนวนครั้งเป็นตัวเลข",
    questions: [
      { key: "Weight", label: "น้ำหนัก(กิโลกรัม)", type: "number" },
      { key: "Height", label: "ส่วนสูง(เซนติเมตร)", type: "number" },
    ],
  },
  {
    groupTitle: "โรคประจำตัวและอาการแพ้",
    groupNote: "✏️ โปรดกรอกโรคประจำตัวและอาการแพ้",
    questions: [
      { key: "Food_allergy", label: "แพ้อาหาร", type: "text" },
      { key: "Drug_allergy", label: "แพ้ยา", type: "text" },
      { key: "congenital_disease", label: "โรคประจำตัว", type: "text" },
    ],
  },
];



function GeneralForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const pages = [
    "/form/general",
    "/form/nutrition",
    "/form/sanitation",
  ];

  const currentIndex = pages.indexOf(location.pathname);
  const nextPage = pages[(currentIndex + 1) % pages.length];
  const prevPage = pages[(currentIndex - 1 + pages.length) % pages.length];

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("generalFormData");
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedGroup, setExpandedGroup] = useState(null); // ยังไม่กำหนดตอนเริ่ม
  const [completedGroups, setCompletedGroups] = useState([]);
  const [completion, setCompletion] = useState(0);
  const groupRefs = useRef([]);
  const [patientId, setPatientId] = useState(null);
  const [childData, setChildData] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingSubmitGroup, setPendingSubmitGroup] = useState(null);


  const totalProgress =
    (parseInt(localStorage.getItem("generalProgress") || 0) +
      parseInt(localStorage.getItem("nutritionProgress") || 0) +
      parseInt(localStorage.getItem("sanitationProgress") || 0)) / 3;




  // ✅ บันทึกข้อมูลเมื่อ formData เปลี่ยน
  useEffect(() => {
    localStorage.setItem("generalFormData", JSON.stringify(formData)); // ✅ แก้ให้ตรงกัน
  }, [formData]);
  // ✅ เพิ่มตรงนี้
  useEffect(() => {
    const savedCompleted = localStorage.getItem("generalCompletedGroups");
    if (savedCompleted) {
      const parsed = JSON.parse(savedCompleted);
      setCompletedGroups(parsed);

      // ✅ หากยังมีกลุ่มที่ยังไม่ได้ทำ ให้เปิดกลุ่มแรกที่ยังไม่ทำ
      const firstIncompleteIndex = nutritionGroups.findIndex((_, index) => !parsed.includes(index));
      if (firstIncompleteIndex !== -1) {
        setExpandedGroup(firstIncompleteIndex);
      } else {
        setExpandedGroup(null); // ✅ ถ้าทำครบแล้ว ปิดทั้งหมด
      }
    } else {
      // ✅ ยังไม่เคยทำเลย → เปิดกลุ่มแรก
      setExpandedGroup(0);
    }
  }, []);


  // ✅ โหลดข้อมูลเด็ก
  useEffect(() => {
    const childId = localStorage.getItem("childId");
    if (childId) {
      axios.get(`/api/patients/${childId}`)
        .then((res) => {
          setChildData(res.data);
          setPatientId(childId);
        })
        .catch((err) => console.error("โหลดข้อมูลเด็กไม่สำเร็จ", err));
    } else {
      console.warn("ไม่พบ childId ใน localStorage");
    }
  }, []);

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGroupComplete = (index) => {
    const group = nutritionGroups[index];
    let requiredKeys = [];

    if (index === 0) {
      // กลุ่มน้ำหนัก/ส่วนสูงเท่านั้นที่ต้องกรอก
      requiredKeys = ["Weight", "Height"];
    }

    const isComplete = requiredKeys.every((key) => {
      const value = formData[key];
      return value !== "" && value !== undefined && !isNaN(value) && parseFloat(value) > 0;
    });



    if (!isComplete) {
      alert("❌ กรุณากรอก 'น้ำหนัก' และ 'ส่วนสูง' ให้ครบก่อนกดยืนยัน");
      return;
    }


    setCompletedGroups((prev) => {
      const newCompleted = prev.includes(index) ? prev : [...prev, index];
      if (index + 1 < nutritionGroups.length) {
        setExpandedGroup(index + 1);
        setTimeout(() => {
          groupRefs.current[index + 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      } else {
        setExpandedGroup(-1);
      }


      // ✅ เพิ่มการบันทึกลง localStorage
      localStorage.setItem("generalCompletedGroups", JSON.stringify(newCompleted));

      return newCompleted;
    });

  };

  const toggleGroup = (index) => {
    setExpandedGroup((prev) => (prev === index ? -1 : index));
  };

  const confirmSubmit = (index) => {
    setPendingSubmitGroup(index);
    setShowConfirmPopup(true);
  };


  const handleSubmit = (goNext = false) => {
    if (!patientId) {
      alert("ไม่สามารถระบุรหัสผู้ป่วยได้");
      return;
    }

    const dataToSend = {
      patient_id: patientId,
      height: formData["Height"],
      weight: formData["Weight"],
      visit_date: new Date().toISOString().split("T")[0]
    };
  };

  useEffect(() => {
    const percent = Math.round((completedGroups.length / nutritionGroups.length) * 100);
    setCompletion(percent);
    localStorage.setItem("generalProgress", percent.toString());
  }, [completedGroups]);

  return (
    <div className="dashboard-container">
      <Header currentPage="form-nutrition" />

      {/* ✅ แถบ progress รวม */}
      <div className="overall-progress">
        <div className="progress-info">
          <span className="progress-label-main">ความคืบหน้าโดยรวม</span>
          <span className="progress-percentage">{Math.round(totalProgress)}%</span>
        </div>
        <div className="main-progress-container">
          <div className="main-progress-bar" style={{ width: `${totalProgress}%` }} />
        </div>
        <p className="progress-status">
          {totalProgress === 100
            ? "เสร็จสิ้น! 🎉"
            : `เหลืออีก ${100 - Math.round(totalProgress)}% ที่ต้องกรอก`}
        </p>
      </div>

      <div className="nutrition-form-container">
        {showConfirmPopup && (
          <div className="popup-overlay">
            <div className="popup-box">
              <h3>📋 ตรวจสอบข้อมูลก่อนบันทึก</h3>
              <ul className="popup-list">
                {nutritionGroups.flatMap((group) => group.questions).map(({ key, label, type }) => {
                  const value = formData[key];

                  let displayValue;
                  if (type === "checkbox") {
                    displayValue = (
                      <span className={value ? "success" : "error"}>
                        {value ? "✅ ได้ปฏิบัติ" : "❌ ไม่ได้ปฏิบัติ"}
                      </span>
                    );
                  } else {
                    displayValue = <span>{value || "-"}</span>;
                  }

                  return (
                    <li key={key} className="popup-row">
                      <span className="popup-label">{label}</span>
                      <span className={`popup-value ${type === "checkbox" ? (value ? "success" : "error") : ""}`}>
                        {type === "checkbox"
                          ? value
                            ? "✅ ได้ปฏิบัติ"
                            : "❌ ไม่ได้ปฏิบัติ"
                          : value || "-"}
                      </span>
                    </li>

                  );
                })}
              </ul>

              <div className="popup-actions">
                <button className="cancel" onClick={() => setShowConfirmPopup(false)}>
                  ❌ ยกเลิก
                </button>
                <button
                  className="confirm"
                  onClick={() => {
                    setShowConfirmPopup(false);
                    handleGroupComplete(pendingSubmitGroup);
                    handleSubmit(true);
                    navigate(nextPage); // ✅ เพิ่มตรงนี้
                  }}
                >
                  ✅ ยืนยันบันทึก ➜
                </button>

              </div>

            </div>
          </div>
        )}

        <div className="nutrition-card">
          {childData && (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h3>แบบฟอร์มของ: {childData.prefix_name_child} {childData.first_name_child} {childData.last_name_child}</h3>
              
            </div>
          )}

          <h2 className="nutrition-title">แบบสอบถามข้อมูลทั่วไปของเด็ก</h2>
          <p className="nutrition-subtitle">กรุณาตอบคำถามเกี่ยวกับข้อมูลทั่วไปของเด็ก</p>

          {/* ✅ Progress */}
          <div className="progress-section">
            <span className="progress-label">ความคืบหน้า: {completion}%</span>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {/* ✅ Groups */}
          {nutritionGroups.map((group, index) => (
            <div
              className="accordion-group"
              key={index}
              ref={(el) => (groupRefs.current[index] = el)}
            >

              <button
                className={`accordion-toggle ${completedGroups.includes(index) ? "completed-group" : ""}`}
                onClick={() => toggleGroup(index)}
              >
                {group.groupTitle}
                <span>{expandedGroup === index ? "▲" : "▼"}</span>
              </button>

              {expandedGroup === index && (
                <div className="accordion-content">
                  {group.groupNote && <div className="group-note">{group.groupNote}</div>}

                  <div className="checkbox-grid">
                    {group.questions.map(({ key, label, type }) =>
                      type === "checkbox" ? (
                        <div className="checkbox-row" key={key}>
                          <input
                            type="checkbox"
                            id={key}
                            checked={formData[key] || false}
                            onChange={(e) => handleChange(key, e.target.checked)}
                          />
                          <label htmlFor={key}>{label}</label>
                        </div>
                      ) : null
                    )}
                  </div>

                  {group.questions.some((q) => q.type === "text") && (
                    <div className="text-grid">
                      {group.questions.map(({ key, label, type }) => {
                        if (type === "text") {
                          return (
                            <div className="text-item" key={key}>
                              <label className="question-label">
                                {label}
                                <input
                                  type="text"
                                  value={formData[key] || ""}
                                  onChange={(e) => {
                                    const input = e.target.value;
                                    // ✅ ตรวจเฉพาะตัวอักษรไทย/อังกฤษ และช่องว่าง
                                    if (/^[A-Za-zก-๙-\s]*$/.test(input)) {
                                      handleChange(key, input);
                                    }
                                  }}
                                  className="text-input"
                                />
                              </label>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}


                  {group.questions.some((q) => q.type === "number" || q.type === "dropdown") && (
                    <div className="number-grid">

                      {group.questions.map(({ key, label, type, options }) => {
                        if (type === "number") {
                          return (
                            <div className="number-item" key={key}>
                              <label className="question-label">
                                {label}
                                <input
                                  type="number"
                                  value={formData[key] || ""}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="number-input"
                                />
                                {/* ✅ เงื่อนไข error message */}
                                {key === "Weight" &&
                                  (!formData.Weight || parseFloat(formData.Weight) <= 0) && (
                                    <span className="error-msg">กรุณากรอกน้ำหนักมากกว่า 0</span>
                                  )}
                                {key === "Height" &&
                                  (!formData.Height || parseFloat(formData.Height) <= 0) && (
                                    <span className="error-msg">กรุณากรอกส่วนสูงมากกว่า 0</span>
                                  )}
                              </label>
                            </div>
                          );
                        }
                        else if (type === "dropdown") {
                          return (
                            <div className="number-item" key={key}>
                              <label className="question-label">
                                {label}
                                <select
                                  value={formData[key] || ""}
                                  onChange={(e) => handleChange(key, e.target.value)}
                                  className="number-input"
                                >
                                  <option value="">-- เลือกตัวเลือก --</option>
                                  {options.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  )}

                  {index === nutritionGroups.length - 1 ? (
                    <>
                      <button
                        className={`complete-btn ${!completedGroups.includes(0) ? 'disabled-btn' : ''}`}
                        disabled={!completedGroups.includes(0)} // ❗ ยังคงควบคุม logic ได้ตรงจุดนี้
                        onClick={() => confirmSubmit(index)}
                      >
                        บันทึก
                      </button>


                      {!completedGroups.includes(0) && (
                        <p style={{ color: "#ef4444", fontWeight: 500, marginTop: "0.5rem" }}>
                          ⚠️ กรุณาทำแบบสอบถามให้ครบกลุ่ม “น้ำหนักและส่วนสูง” ก่อนกดบันทึก
                        </p>
                      )}

                    </>
                  ) : (
                    <button className="complete-btn" onClick={() => handleGroupComplete(index)}>
                      ถัดไป ➔
                    </button>
                  )}


                </div>
              )}
            </div>
          ))}

          {completedGroups.length === nutritionGroups.length && totalProgress === 100 && (

            <button
              className="submit-btn"
              style={{ background: "linear-gradient(to right, #22c55e, #16a34a)" }}
              onClick={async () => {
                const isSubmitting = localStorage.getItem("isSubmitting");
                if (isSubmitting === "true") return;

                localStorage.setItem("isSubmitting", "true");

                const general = JSON.parse(localStorage.getItem("generalFormData") || "{}");
                const nutrition = JSON.parse(localStorage.getItem("nutritionFormData") || "{}");
                const sanitation = JSON.parse(localStorage.getItem("sanitationFormData") || "{}");
                const patientId = localStorage.getItem("childId");

                if (!patientId) {
                  alert("❌ ไม่พบรหัสผู้ป่วย กรุณาเลือกเด็กใหม่");
                  localStorage.setItem("isSubmitting", "false");
                  return;
                }

                const allData = {
                  patient_id: patientId,
                  ...general,
                  ...nutrition,
                  ...sanitation,
                };


                const requiredKeys = [
                  "Vitamin_A_Intake_First_8_Weeks",
                  "Sanitary_Disposal",
                  "Child_wash_hand_before_or_after_eating_food",
                  "Child_wash_hand_before_or_after_visiting_the_toilet",
                  "Given_Anything_to_Drink_in_First_6_Months",
                  "Still_Breastfeeding",
                  "Breastfeeding_Count_DayandNight",
                  "Infant_Formula_Intake_Count_Yesterday",
                  "Received_Animal_Milk_Count",
                  "Received_Thin_Porridge",
                  "Received_Grain_Based_Foods",
                  "Received_Orange_Yellow_Foods",
                  "Received_White_Root_Foods",
                  "Received_Dark_Green_Leafy_Veggies",
                  "Received_Ripe_Mangoes_Papayas",
                  "Received_Meat",
                  "Received_Eggs",
                  "Received_Fish_Shellfish_Seafood",
                  "Received_Legumes_Nuts_Foods",
                  "Received_Dairy_Products",
                  "Received_Oil_Fats_Butter",
                  "Received_Salt",
                  "Number_of_Times_Eaten_Solid_Food"
                ];

                // เติมค่าที่ขาด = 0
                requiredKeys.forEach((key) => {
                  if (!(key in allData)) {
                    allData[key] = 0;
                  }
                });

                localStorage.setItem("latestPredictionData", JSON.stringify(allData));
                localStorage.setItem("isSubmitting", "false");
                navigate("/prediction-result");
              }}
            >
              ✅ บันทึกข้อมูลทั้งหมดลงระบบเพื่อวิเคราะห์ภาวะทุพโภชนาการ
            </button>
          )}


          <div className="button-group">
            <button
              className="submit-btn"
              onClick={() => navigate(prevPage)}
              style={{ background: "linear-gradient(to right, #3b82f6, #2563eb)" }}
            >
              <span className="btn-text">◀ กลับหน้าก่อนหน้า</span>
              <span className="btn-icon">◀</span>
            </button>

            <button
              className="submit-btn"
              onClick={() => navigate("/parent-risk-assessment")}
              style={{ background: "linear-gradient(to right, #f59e0b, #f97316)" }}
            >
              <span className="btn-text">🏠 กลับหน้าเลือกกลุ่มข้อมูล</span>
              <span className="btn-icon">🏠</span>
            </button>

            <button
              className="submit-btn"
              onClick={() => navigate(nextPage)}
              style={{ background: "linear-gradient(to right, #10b981, #06b6d4)" }}
            >
              <span className="btn-text">ตอบคำถามหน้าถัดไป ▶</span>
              <span className="btn-icon">▶</span>
            </button>
          </div>



        </div>
      </div>
      <Footer />
    </div>
  );
}

export default GeneralForm;
