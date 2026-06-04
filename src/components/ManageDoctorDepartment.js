// 🔄 เพิ่มฟีเจอร์เพิ่มวันทำงานหลายรายการแบบ dynamic
import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import axios from "axios";
import "./ManageDoctorDepartment.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const ManageDoctorDepartment = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    lastName: "",
    phone: "",
    specialist: "",
  });
  const [lastHN, setLastHN] = useState("");
  const [formData, setFormData] = useState({
    hn: "",
    prefix: "",
    name: "",
    lastName: "",
    phone: "",
    specialist: "",
    workSchedules: [{ day: "", time: "" }] // ✅ ใช้ array สำหรับหลายรายการ
  });

  useEffect(() => {
    const fetchLatestHN = async () => {
      try {
        const res = await axios.get("/api/last-parent-hn");
        const lastHN = res.data.last_hn || "00000";
        console.log("โหลด HN สำเร็จ:", lastHN);
        setLastHN(lastHN); // ✅ ใช้ setLastHN
      } catch (err) {
        console.error("โหลด HN ไม่สำเร็จ", err);
      }
    };
    fetchLatestHN();
  }, []);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await axios.get("/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลหมอผิดพลาด", err);
    }
  };

  const handleAddSchedule = () => {
    setFormData({
      ...formData,
      workSchedules: [...formData.workSchedules, { day: "", time: "" }]
    });
  };

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length >= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 4) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handleRemoveSchedule = (index) => {
    const newSchedules = [...formData.workSchedules];
    newSchedules.splice(index, 1);
    setFormData({ ...formData, workSchedules: newSchedules });
  };

  const weekdaysOrder = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"];

  const handleScheduleChange = (index, field, value) => {
    const newSchedules = [...formData.workSchedules];
    newSchedules[index][field] = value;
    setFormData({ ...formData, workSchedules: newSchedules });
  };

  const handleAdd = () => {
    setEditingDoctor(null);
    setErrorMessages([]); // ✅ เคลียร์ error เก่า
    setFormData({
      hn: lastHN,
      prefix: "",
      name: "",
      lastName: "",
      phone: "",
      specialist: "",
      workSchedules: [{ day: "", time: "" }]
    });
    setShowModal(true);
  };


  const handleSave = async () => {
    const errors = {
      name: "",
      lastName: "",
      phone: "",
      specialist: ""
    };

    const thaiRegex = /^[ก-๙\s]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!thaiRegex.test(formData.name)) {
      errors.name = "กรุณากรอกชื่อเป็นภาษาไทยเท่านั้น";
    }
    if (!thaiRegex.test(formData.lastName)) {
      errors.lastName = "กรุณากรอกนามสกุลเป็นภาษาไทยเท่านั้น";
    }
    if (!thaiRegex.test(formData.specialist)) {
      errors.specialist = "กรุณากรอกความเชี่ยวชาญเป็นภาษาไทยเท่านั้น";
    }
    if (phoneDigits.length !== 10 || !phoneDigits.startsWith("0")) {
      errors.phone = "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก";
    }

    const hasErrors = Object.values(errors).some((e) => e !== "");
    setValidationErrors(errors);

    if (hasErrors || formData.workSchedules.some(w => !w.day || !w.time)) {
      const messages = [];

      if (errors.name) messages.push(`ชื่อ: ${errors.name}`);
      if (errors.lastName) messages.push(`นามสกุล: ${errors.lastName}`);
      if (errors.phone) messages.push(`เบอร์โทร: ${errors.phone}`);
      if (errors.specialist) messages.push(`ความเชี่ยวชาญ: ${errors.specialist}`);

      formData.workSchedules.forEach((w, i) => {
        if (!w.day || !w.time) {
          messages.push(`วัน/เวลาเข้าทำงาน : กรุณากรอกวันและเวลาทำงานให้ครบถ้วน`);
        }
      });

      // 🔁 ใช้ alert แทนการขึ้นกล่องในหน้า
      alert("กรุณากรอกข้อมูลให้ถูกต้อง:\n\n" + messages.join("\n"));

      return;



    }
    const workDay = formData.workSchedules.map(w => w.day).join(" , ");
    const workTime = formData.workSchedules.map(w => w.time).join(" , ");

    const payload = {
      hn_number: formData.hn,
      prefix: formData.prefix,
      firstName: formData.name,
      lastName: formData.lastName,
      phone: formData.phone,
      specialist: formData.specialist,
      workDay,
      workTime
    };

    try {
      if (editingDoctor) {
        await axios.put(`/api/doctors/${editingDoctor.doctor_id}`, payload);
      } else {
        await axios.post("/api/doctors", payload);
      }
      alert("บันทึกข้อมูลหมอสำเร็จ");
      setShowModal(false);
      setEditingDoctor(null);
      loadDoctors();
    } catch (err) {
      console.error("❌ Error saving doctor:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const handleEdit = (doctor) => {
    const days = doctor.work_day?.split(" , ") || [""];
    const times = doctor.work_time?.split(" , ") || [""];
    const workSchedules = days.map((d, i) => ({ day: d, time: times[i] || "" }));

    setEditingDoctor(doctor);
    setFormData({
      hn: doctor.hn_number,
      prefix: doctor.prefix_name_doctor,
      name: doctor.first_name_doctor,
      lastName: doctor.last_name_doctor,
      phone: doctor.phone_number,
      specialist: doctor.specialist,
      workSchedules
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("❌ คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลหมอคนนี้?")) {
      await axios.delete(`/api/doctors/${id}`);
      alert("ลบข้อมูลสำเร็จ");
      loadDoctors();
    }
  };

  const filteredDoctors = doctors.filter((d) =>
    d.first_name_doctor?.includes(searchTerm) ||
    d.last_name_doctor?.includes(searchTerm) ||
    d.specialist?.includes(searchTerm)
  );

  return (
    <div className="dashboard-container">
      <Header currentPage="manage-department" />
      <div className="manage-wrapper">
        <div className="search-header">
          <div className="left">
            <h2>ค้นหาหมอ</h2>
            <div className="search-box">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, ความเชี่ยวชาญ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>


        <div className="table-title">
          <h3>รายชื่อหมอ <span>ทั้งหมด {filteredDoctors.length} คน</span></h3>
          <button className="add-btn" onClick={handleAdd}>
            <Plus /> เพิ่มหมอใหม่
          </button>
        </div>

        <div className="table-scroll-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>ความเชี่ยวชาญ</th>
                <th>วัน/เวลาเข้าทำงาน</th>
                <th>เบอร์โทร</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((d) => (
                <tr key={d.doctor_id}>
                  <td>{d.hn_number}</td>
                  <td>{d.prefix_name_doctor} {d.first_name_doctor} {d.last_name_doctor}</td>
                  <td>{d.specialist}</td>
                  <td>
                    {(() => {
                      const days = d.work_day?.split(" , ") || [];
                      const times = d.work_time?.split(" , ") || [];
                      const combined = days.map((day, i) => ({ day, time: times[i] || "" }));

                      const sorted = combined.sort((a, b) => {
                        return weekdaysOrder.indexOf(a.day) - weekdaysOrder.indexOf(b.day);
                      });

                      return sorted.map((item, i) => (
                        <div key={i}>{item.day} {item.time}</div>
                      ));
                    })()}
                  </td>
                  <td>{d.phone_number?.replace(/^(\d{3})(\d{3})(\d+)/, "$1-$2-$3")}</td>
                  <td className="actions-doctor">
                    <button className="icon edit-doctor" onClick={() => handleEdit(d)}><Edit /></button>
                    <button className="icon delete-doctor" onClick={() => handleDelete(d.doctor_id)}><Trash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h3 style={{ textAlign: "center" }}>
                {editingDoctor ? "✏️ แก้ไขข้อมูลหมอ" : "➕ เพิ่มหมอใหม่"}
              </h3>

              <input className="text-input" disabled value={formData.hn} />

              <div className="form-row">
                <select className="form-input prefix-select" value={formData.prefix} onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}>
                  <option value="">คำนำหน้า</option>
                  <option value="นพ.">นพ.</option>
                  <option value="พญ.">พญ.</option>
                </select>
                <input className="text-input name-input" placeholder="ชื่อ" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[^\u0E00-\u0E7F\s]/g, "") })} />
                <input className="text-input name-input" placeholder="นามสกุล" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value.replace(/[^\u0E00-\u0E7F\s]/g, "") })} />
              </div>

              <div className="form-row">
                <input
                  className="text-input name-input"
                  placeholder="เบอร์มือถือ (เช่น 081-234-5678)"
                  value={formatPhoneNumber(formData.phone)}
                  maxLength={12} // รูปแบบมีขีด: 081-234-5678
                  onChange={(e) => {
                    let digits = e.target.value.replace(/\D/g, ""); // เอาเฉพาะเลข

                    // ✅ บังคับให้เริ่มด้วย 0 เสมอ
                    if (!digits.startsWith("0")) {
                      digits = "0" + digits;
                    }

                    digits = digits.slice(0, 10); // จำกัด 10 ตัวเลข

                    setFormData({ ...formData, phone: digits });
                  }}
                />
                <input className="text-input name-input" placeholder="ความเชี่ยวชาญ" value={formData.specialist} onChange={(e) => setFormData({ ...formData, specialist: e.target.value.replace(/[^ก-๙a-zA-Z\s]/g, "") })} />
              </div>

              {/* 🔁 หลายวันทำงาน */}
              {formData.workSchedules.map((schedule, index) => (
                <div className="form-row align-center" key={index}>
                  <select
                    className="text-input name-input"
                    value={schedule.day}
                    onChange={(e) => handleScheduleChange(index, "day", e.target.value)}
                  >
                    <option value="">เลือกวัน</option>
                    <option value="ศุกร์">อาทิตย์</option>
                    <option value="จันทร์">จันทร์</option>
                    <option value="อังคาร">อังคาร</option>
                    <option value="พุธ">พุธ</option>
                    <option value="พฤหัสบดี">พฤหัสบดี</option>
                    <option value="ศุกร์">ศุกร์</option>
                    <option value="ศุกร์">เสาร์</option>
                  </select>
                  <input
                    className="text-input name-input"
                    placeholder="เวลา เช่น 09:00-16:00"
                    value={schedule.time}
                    maxLength={13}
                    onChange={(e) => {
                      const inputValue = e.target.value;

                      // ลบทุกอย่างที่ไม่ใช่ตัวเลข
                      let digits = inputValue.replace(/\D/g, "").slice(0, 8);

                      let formatted = "";
                      const length = digits.length;

                      if (length <= 2) {
                        formatted = digits;
                        if (length === 2 && !inputValue.includes(":")) {
                          formatted += ":";
                        }
                      } else if (length <= 4) {
                        formatted = `${digits.slice(0, 2)}:${digits.slice(2)}`;
                        if (length === 4 && !inputValue.includes("-")) {
                          formatted += "-";
                        }
                      } else if (length <= 6) {
                        formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}-${digits.slice(4)}`;
                        if (length === 6 && !inputValue.match(/:\d{2}-\d{2}$/)) {
                          formatted += ":";
                        }
                      } else {
                        formatted = `${digits.slice(0, 2)}:${digits.slice(2, 4)}-${digits.slice(4, 6)}:${digits.slice(6, 8)}`;
                      }

                      handleScheduleChange(index, "time", formatted);
                    }}
                  />

                  {/* ถังขยะ */}
                  {formData.workSchedules.length > 1 && (
                    <button
                      type="button"
                      className="icon delete"
                      style={{
                        width: "36px",
                        height: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        marginTop: "6px",
                        alignSelf: "center",
                      }}
                      onClick={() => handleRemoveSchedule(index)}>

                      <Trash2 size={20} color="#ef4444" />
                    </button>
                  )}
                </div>
              ))}
              <button className="confirm-btn" onClick={handleAddSchedule}>+ เพิ่มวันทำงาน</button>


              {errorMessages.length > 0 && (
                <div style={{ background: "#fee2e2", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
                  <strong style={{ color: "#b91c1c" }}>ไม่สามารถบันทึกข้อมูลได้ เนื่องจาก:</strong>
                  <ul style={{ color: "#b91c1c", paddingLeft: "24px", marginTop: "8px" }}>
                    {errorMessages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="button-group">
                <button className="confirm-btn" onClick={handleSave}>บันทึก</button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowModal(false);
                    setErrorMessages([]);
                  }}
                >
                  ยกเลิก
                </button>

              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ManageDoctorDepartment;
