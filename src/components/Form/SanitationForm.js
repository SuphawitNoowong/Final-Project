import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./NutritionForm.css";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import axios from "axios";


const sanitationGroups = [
  {
    groupTitle: "พฤติกรรมด้านสุขาภิบาลและความสะอาด",
    groupNote: "หากปฏิบัติพฤติกรรมนั้นให้ติ๊กถูกในช่องสี่เหลี่ยม ☐",
    questions: [
      { key: "Sanitary_Disposal", label: "เด็กมีการถ่ายอุจจาระแบบถูกสุขลักษณะหรือไม่ เช่น ถ่ายในห้องน้ำและมีการชำระล้าง", type: "checkbox" },
      { key: "Child_wash_hand_before_or_after_eating_food", label: "เด็กล้างมือทั้งก่อนหรือหลังทานข้าวหรือไม่ ", type: "checkbox" },
      { key: "Child_wash_hand_before_or_after_visiting_the_toilet", label: "เด็กล้างมือทั้งก่อนหรือหลังเข้าห้องน้ำหรือไม่", type: "checkbox" },
    ],
  },
];

function SanitationForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const pages = [
    "/form/general",
    "/form/nutrition",
    "/form/sanitation",
  ];

  const currentIndex = pages.indexOf(location.pathname);
  const nextIndex = (currentIndex + 1) % pages.length;
  const nextPage = pages[nextIndex];
  const prevIndex = (currentIndex - 1 + pages.length) % pages.length;
  const prevPage = pages[prevIndex];

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("sanitationFormData");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("sanitationFormData", JSON.stringify(formData));
  }, [formData]);

  const [expandedGroup, setExpandedGroup] = useState(0);
  const [completedGroups, setCompletedGroups] = useState([]);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingSubmitGroup, setPendingSubmitGroup] = useState(null);

  const [completion, setCompletion] = useState(0);

  // 👇 เพิ่มคำนวณ totalProgress เหมือน GroupedDataInput
  const totalProgress =
    (parseInt(localStorage.getItem("generalProgress") || 0) +
      parseInt(localStorage.getItem("nutritionProgress") || 0) +
      parseInt(localStorage.getItem("sanitationProgress") || 0)) / 3;


  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleGroupComplete = (index) => {
    const group = sanitationGroups[index];

    const requiredKeys = group.questions.map(q => q.key);

    const isComplete = requiredKeys.every(key => {
      const value = formData[key];
      const question = group.questions.find(q => q.key === key);

      if (question.type === "number") {
        return value !== "" && value !== undefined;
      } else if (question.type === "dropdown") {
        return value !== "" && value !== undefined;
      }

      return true;
    });

    if (!isComplete) {
      alert("กรุณากรอกข้อมูลให้ครบก่อนกดยืนยัน ✅");
      return;
    }


    

    setCompletedGroups((prevCompletedGroups) => {
      let newCompleted = prevCompletedGroups;

      if (!prevCompletedGroups.includes(index)) {
        newCompleted = [...prevCompletedGroups, index];
      }

      if (index + 1 < sanitationGroups.length) {
        setExpandedGroup(index + 1);
      } else {
        setExpandedGroup(-1);
      }

      localStorage.setItem("sanitationCompletedGroups", JSON.stringify(newCompleted));

      return newCompleted;
    });
  };

  const toggleGroup = (index) => {
    setExpandedGroup((prev) => (prev === index ? -1 : index));
  };

  const [patientId, setPatientId] = useState(null);
  const [childData, setChildData] = useState(null);
  useEffect(() => {
    const savedData = localStorage.getItem("sanitationFormData");
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);
  useEffect(() => {
    const savedCompleted = localStorage.getItem("sanitationCompletedGroups");
    const parsedCompleted = savedCompleted ? JSON.parse(savedCompleted) : [];
    setCompletedGroups(parsedCompleted);

    // ✅ ค้นหากลุ่มแรกที่ยังไม่ทำ
    const firstIncompleteIndex = sanitationGroups.findIndex((_, i) => !parsedCompleted.includes(i));
    setExpandedGroup(firstIncompleteIndex !== -1 ? firstIncompleteIndex : -1);
  }, []);


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


  useEffect(() => {
    const totalGroups = sanitationGroups.length;
    const completedCount = completedGroups.length;
    const percent = Math.round((completedCount / totalGroups) * 100);
    setCompletion(percent);

    // อัปเดตลง localStorage ด้วย (เหมือน GroupedDataInput)
    localStorage.setItem("sanitationProgress", percent.toString());
  }, [completedGroups]);
  const handleSubmit = async () => {
    if (!patientId) {
      alert("ไม่พบข้อมูลผู้ป่วย กรุณากลับไปเลือกเด็กใหม่");
      return;
    }

    try {
      const response = await axios.post("/api/predictions/sanitation", {
        patient_id: patientId,
        ...formData,
      });

      if (response.status === 200 || response.status === 201) {
        alert("✅ บันทึกข้อมูลสำเร็จ");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (error) {
      console.error("❌ บันทึกข้อมูลไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

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
        <div className="nutrition-card">
          {childData && (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <h3>แบบฟอร์มของ: {childData.prefix_name_child} {childData.first_name_child} {childData.last_name_child}</h3>
            </div>
          )}

          <h2 className="nutrition-title">แบบสอบถามข้อมูลสุขาภิบาลของเด็ก</h2>
          <p className="nutrition-subtitle">กรุณาตอบคำถามเกี่ยวกับข้อมูลสุขาภิบาลของเด็ก</p>
          {/* ✅ Progress */}
          <div className="progress-section">
            <span className="progress-label">ความคืบหน้า: {completion}%</span>
            <div className="progress-bar-wrapper">
              <div className="progress-bar-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>

          {/* ✅ Groups */}
          {sanitationGroups.map((group, index) => (
            <div className="accordion-group" key={index}>
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
                              </label>
                            </div>
                          );
                        } else if (type === "dropdown") {
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

                  <button
                    className="complete-btn"
                    onClick={() => {
                      setPendingSubmitGroup(index);
                      setShowConfirmPopup(true);
                    }}
                  >
                    บันทึก
                  </button>

                </div>
              )}
            </div>
          ))}

          {completedGroups.length === sanitationGroups.length && totalProgress === 100 && (


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

                // ✅ รายการ field ที่ต้องกรอก
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

                // ✅ เติมค่าที่ขาด
                requiredKeys.forEach((key) => {
                  if (!(key in allData)) {
                    // ✅ เงื่อนไขเฉพาะบาง field
                    if (
                      key === "Still_Breastfeeding" ||
                      key === "Sanitary_Disposal" ||
                      key === "Child_wash_hand_before_or_after_eating_food" ||
                      key === "Child_wash_hand_before_or_after_visiting_the_toilet"
                    ) {
                      allData[key] = false;
                    } else if (
                      key === "Breastfeeding_Count_DayandNight" ||
                      key === "Infant_Formula_Intake_Count_Yesterday" ||
                      key === "Received_Animal_Milk_Count"
                    ) {
                      allData[key] = 0;
                    } else if (key === "Number_of_Times_Eaten_Solid_Food") {
                      allData[key] = "dont eat";
                    } else {
                      allData[key] = "no";
                    }
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
      {showConfirmPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>ยืนยันการบันทึกข้อมูล</h3>
            <ul className="popup-list">
              {pendingSubmitGroup !== null &&
                sanitationGroups[pendingSubmitGroup].questions.map((q) => (
                  <li className="popup-row" key={q.key}>
                    <span className="popup-label">{q.label}</span>
                    <span
                      className={`popup-value ${formData[q.key] ? "success" : "error"}`}
                    >
                      {formData[q.key] ? "มีพฤติกรรม" : "ไม่มีพฤติกรรม"}
                    </span>
                  </li>
                ))}
            </ul>

            <div className="popup-actions">
              <button
                className="cancel"
                onClick={() => {
                  setShowConfirmPopup(false);
                  setPendingSubmitGroup(null);
                }}
              >
                ❌ ยกเลิก
              </button>
              <button
                className="confirm"
                onClick={() => {
                  setShowConfirmPopup(false);
                  handleGroupComplete(pendingSubmitGroup);
                  setPendingSubmitGroup(null);
                  navigate(nextPage);
                }}
              >
                ✅ ยืนยันบันทึก ➜
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default SanitationForm;
