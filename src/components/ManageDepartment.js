import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import "./ManageDepartment.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";


const API_URL = "/api/patients";

const ManageDepartment = () => {
  const [patients, setPatients] = useState([]);
  const [parents, setParents] = useState([]); // 🔥 รายชื่อผู้ปกครอง

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [parentRelations, setParentRelations] = useState([
    { parentId: "", relationship: "", customRelationship: "", parentPrefix: "" }
  ]);



  const [formData, setFormData] = useState({
    childPrefix: "",
    name: "",
    lastName: "",
    age: "",
    gender: "",
    birthDate: "",
    parentId: null
  });

  const itemsPerPage = 5;

  useEffect(() => {
    loadPatients();
    loadParents();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await axios.get(API_URL);
      setPatients(res.data);
    } catch (err) {
      console.error("โหลดข้อมูลผิดพลาด", err);
    }
  };

  const loadParents = async () => {
    try {
      const res = await axios.get("/api/parents");
      setParents(res.data);
    } catch (err) {
      console.error("โหลดผู้ปกครองผิดพลาด", err);
    }
  };

  const formatAgeText = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0) {
      return `${years} ปี ${remainingMonths} เดือน`;
    } else {
      return `${remainingMonths} เดือน`;
    }
  };

  const calculateAgeInText = (dob) => {
    const birth = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years > 0 && months > 0) {
      return `${years} ปี ${months} เดือน`;
    } else if (years > 0) {
      return `${years} ปี`;
    } else {
      return `${months} เดือน`;
    }
  };

  const extractMonths = (ageText) => {
    const yearMatch = ageText.match(/(\d+)\s*ปี/);
    const monthMatch = ageText.match(/(\d+)\s*เดือน/);
    const years = yearMatch ? parseInt(yearMatch[1]) : 0;
    const months = monthMatch ? parseInt(monthMatch[1]) : 0;
    return years * 12 + months;
  };

  const handleSave = async () => {
    const errors = [];

    if (!formData.hn) errors.push("กรุณากรอก HN");
    if (!formData.name) errors.push("กรุณากรอกชื่อเด็ก");
    if (!formData.lastName) errors.push("กรุณากรอกนามสกุลเด็ก");
    const thaiNameRegex = /^[ก-๙\s]+$/;
    if (!thaiNameRegex.test(formData.name)) errors.push("ชื่อเด็กต้องเป็นภาษาไทยเท่านั้น");
    if (!thaiNameRegex.test(formData.lastName)) errors.push("นามสกุลเด็กต้องเป็นภาษาไทยเท่านั้น");

    if (!formData.childPrefix) errors.push("กรุณาเลือกคำนำหน้า");
    if (!formData.gender) errors.push("กรุณาเลือกเพศ");
    if (!birthDate) errors.push("กรุณาเลือกวันเกิด");
    if (!formData.age) errors.push("อายุไม่ถูกต้อง");

    parentRelations.forEach((rel, idx) => {
      if (!rel.parentId) {
        errors.push(`กรุณาเลือกผู้ปกครอง`);
      }
      if (!rel.relationship) {
        errors.push(`กรุณาเลือกความสัมพันธ์`);
      }
      if (rel.relationship === "อื่นๆ" && (!rel.customRelationship || rel.customRelationship.trim() === "")) {
        errors.push(`กรุณาระบุความสัมพันธ์อื่นๆ`);
      }
    });

    if (errors.length > 0) {
      alert("กรุณากรอกข้อมูลให้ถูกต้อง:\n\n" + errors.map((e) => `- ${e}`).join("\n"));
      return;
    }


    const totalMonths = extractMonths(formData.age);

    // ✅ แปลง parentRelations เป็น array ของความสัมพันธ์
    const relationships = parentRelations.map((rel) => ({
      parent_id: rel.parentId,
      relationship: rel.relationship === "อื่นๆ" ? rel.customRelationship : rel.relationship,
    }));

    const payload = {
      hn_number: formData.hn,
      childPrefix: formData.childPrefix,
      name: formData.name,
      lastName: formData.lastName,
      age: totalMonths,
      gender: formData.gender,
      birthDate,
      relationships, // ✅ ส่งหลายความสัมพันธ์
    };

    try {
      if (editingPatient) {
        await axios.put(`${API_URL}/${editingPatient.id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }
      alert("บันทึกข้อมูลเด็กสำเร็จ");
      setShowModal(false);
      setEditingPatient(null);
      resetForm();
      loadPatients();
    } catch (err) {
      console.error("❌ Error saving data:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      hn: "",
      childPrefix: "",
      name: "",
      lastName: "",
      age: "",
      gender: "",
      birthDate: "",
      parentId: null
    });
    setBirthDate("");
    setParentRelations([
      { parentId: "", relationship: "", customRelationship: "", parentPrefix: "" }
    ]);
  };

  const handleAdd = () => {
    const lastPatient = [...patients].sort((a, b) => parseInt(b.hn_number) - parseInt(a.hn_number))[0];
    const newHN = lastPatient ? (parseInt(lastPatient.hn_number) + 1).toString().padStart(5, "0") : "00001";

    setEditingPatient(null);
    resetForm();
    setFormData((prev) => ({ ...prev, hn: newHN }));
    setShowModal(true);
  };

  const handleEdit = (patient) => {
    console.log("DEBUG patient", patient);   // ✅ เพิ่มตรงนี้

    // ✅ กรอง parent relations ทั้งหมดจาก patients
    const allRelations = patients
      .filter(p => p.hn_number === patient.hn_number && p.parent_id)
      .map(p => {
        const parent = parents.find(pa => pa.id === p.parent_id);
        return {
          parentId: p.parent_id,
          relationship: p.relationship || "",
          customRelationship: p.relationship === "อื่นๆ" ? p.relationship : "",
          parentPrefix: parent?.prefix || "",
        };
      });

    const rawAge = formatAgeText(patient.age);
    const formattedDate = patient.birthDate ? new Date(patient.birthDate).toISOString().split("T")[0] : "";

    setEditingPatient(patient);
    setBirthDate(formattedDate);
    setFormData({
      hn: patient.hn_number,
      childPrefix: patient.childPrefix || "",
      name: patient.name?.split(" ")[0] || "",
      lastName: patient.name?.split(" ")[1] || "",
      age: rawAge,
      gender: patient.gender,
      birthDate: formattedDate,
      parentId: null
    });
    setParentRelations(allRelations.length > 0 ? allRelations : [
      { parentId: "", relationship: "", customRelationship: "", parentPrefix: "" }
    ]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("❌ คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลเด็กคนนี้?")) {
      await axios.delete(`${API_URL}/${id}`);
      alert("ลบข้อมูลสำเร็จ");
      loadPatients();
    }
  };


  const filteredPatients = patients.filter((p) =>
    p.hn_number?.includes(searchTerm) || p.name?.includes(searchTerm) || p.parent?.includes(searchTerm)
  );

  const groupedPatients = Object.values(
    filteredPatients.reduce((acc, p) => {
      if (!acc[p.hn_number]) {
        acc[p.hn_number] = {
          ...p,
          parents: [{ name: p.parent, relationship: p.relationship }]
        };
      } else {
        acc[p.hn_number].parents.push({ name: p.parent, relationship: p.relationship });
      }
      return acc;
    }, {})
  );

  // 🔧 เพิ่มการเรียงลำดับจากน้อยไปมาก
  const sortedGroupedPatients = groupedPatients.sort((a, b) =>
    parseInt(a.hn_number) - parseInt(b.hn_number)
  );

  // แล้วเปลี่ยนจาก groupedPatients เป็น sortedGroupedPatients
  const totalPages = Math.ceil(sortedGroupedPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentPatients = sortedGroupedPatients.slice(startIndex, startIndex + itemsPerPage);

  console.log("Current Page:", currentPage, "Patients:", currentPatients);

  return (
    <div className="dashboard-container">
      <Header currentPage="manage-department" />

      <div className="manage-wrapper">

        <div className="search-header">
          <h2 className="search-title">ค้นหาข้อมูลเด็ก</h2>
          <div className="search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="ค้นหา HN, ชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>




        <div className="table-title">
          <h3>รายชื่อเด็ก <span>ทั้งหมด {sortedGroupedPatients.length} คน</span></h3>
          <button className="add-btn" onClick={handleAdd}>
            <Plus /> เพิ่มเด็กใหม่
          </button>
        </div>

        <div className="table-scroll-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>HN</th>
                <th>ชื่อ</th>
                <th>อายุ</th>
                <th>เพศ</th>
                <th>ผู้ปกครอง</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((child) => (
                <tr key={child.id}>
                  <td>{child.hn_number}</td>
                  <td>{`${child.childPrefix || ""} ${child.name}`}</td>
                  <td>{formatAgeText(child.age)}</td>
                  <td>{child.gender}</td>
                  <td>
                    {child.parents && child.parents.length > 0 && child.parents.some(p => p.name) ? (
                      child.parents.map((parent, idx) =>
                        parent.name ? (
                          <div key={idx}>
                            {parent.name} ({parent.relationship || "-"})
                          </div>
                        ) : null
                      )
                    ) : (
                      <span style={{ color: "#999" }}>ตอนนี้ยังไม่มีผู้ปกครองดูแล</span>
                    )}
                  </td>
                  <td className="actions-child">
                    <button className="icon edit-child" onClick={() => handleEdit(child)}>
                      <Edit />
                    </button>
                    <button className="icon delete-child" onClick={() => handleDelete(child.id)}>
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <div className="pagination-container">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>ย้อนกลับ</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)} className={currentPage === page ? "active" : ""}>{page}</button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>ถัดไป</button>
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content styled-modal">
              <h3 className="modal-title">
                {editingPatient ? "✏️ แก้ไขข้อมูลเด็ก" : "➕ เพิ่มเด็กใหม่"}
              </h3>

              <div className="form-row input-row spacing-row">
                <input
                  className="text-input short spacing-item"
                  value={formData.hn}
                  disabled
                />

                <select
                  className="form-input spacing-item"
                  value={formData.gender}
                  onChange={(e) => {
                    const gender = e.target.value;
                    let prefix = formData.childPrefix;
                    if (gender === "ชาย") prefix = "ด.ช.";
                    else if (gender === "หญิง") prefix = "ด.ญ.";
                    setFormData({ ...formData, gender, childPrefix: prefix });
                  }}
                >
                  <option value="">เลือกเพศ</option>
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                </select>

                <select
                  className="form-input spacing-item"
                  value={formData.childPrefix}
                  onChange={(e) => {
                    const prefix = e.target.value;
                    let gender = formData.gender;
                    if (prefix === "ด.ช.") gender = "ชาย";
                    else if (prefix === "ด.ญ.") gender = "หญิง";
                    setFormData({ ...formData, childPrefix: prefix, gender });
                  }}
                >
                  <option value="">คำนำหน้า</option>
                  <option value="ด.ช.">ด.ช.</option>
                  <option value="ด.ญ.">ด.ญ.</option>
                </select>
                <div className="form-row-equal">
                  <input
                    className="text-input spacing-item"
                    placeholder="ชื่อเด็ก"
                    value={formData.name}
                    onChange={(e) => {
                      const thaiOnly = e.target.value.replace(/[^ก-๙\s]/g, "");
                      setFormData({ ...formData, name: thaiOnly });
                    }}
                  />

                  <input
                    className="text-input spacing-item"
                    placeholder="นามสกุลเด็ก"
                    value={formData.lastName}
                    onChange={(e) => {
                      const thaiOnly = e.target.value.replace(/[^ก-๙\s]/g, "");
                      setFormData({ ...formData, lastName: thaiOnly });
                    }}
                  />

                </div>

              </div>


              <div className="form-row spacing-row">
                <input
                  type="date"
                  className="form-input spacing-item"
                  value={birthDate}
                  onChange={(e) => {
                    const dob = e.target.value;
                    setBirthDate(dob);
                    const ageText = calculateAgeInText(dob);
                    setFormData({ ...formData, age: ageText });
                  }}
                  min={new Date(new Date().setFullYear(new Date().getFullYear() - 5)).toISOString().split("T")[0]}
                  max={new Date().toISOString().split("T")[0]}
                />
                <input
                  className="form-input age-display spacing-item"
                  type="text"
                  value={formData.age || ""}
                  disabled
                  readOnly
                />
              </div>

              {parentRelations.map((relation, index) => {
                const selectedParent = parents.find((p) => p.id === relation.parentId);
                const parentPrefix = relation.parentPrefix || selectedParent?.prefix || "";
                let relationshipOptions = [];

                if (parentPrefix === "นาย") {
                  relationshipOptions = ["พ่อ", "ปู่", "ตา", "อื่นๆ"];
                } else if (parentPrefix === "นาง" || parentPrefix === "นางสาว") {
                  relationshipOptions = ["แม่", "ย่า", "ยาย", "อื่นๆ"];
                }

                return (
                  <div key={index} className="form-row spacing-row parent-row">
                    <select
                      className="form-input spacing-item"
                      value={relation.parentId || ""}
                      onChange={(e) => {
                        const selectedId = parseInt(e.target.value);
                        const parent = parents.find((p) => p.id === selectedId);
                        const prefix = parent?.prefix || "";
                        const updated = [...parentRelations];
                        updated[index] = { ...updated[index], parentId: selectedId, relationship: "", customRelationship: "", parentPrefix: prefix };
                        setParentRelations(updated);
                      }}
                    >
                      <option value="">เลือกผู้ปกครอง</option>
                      {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {`${parent.prefix} ${parent.name} ${parent.lastName}`}
                        </option>
                      ))}
                    </select>

                    <select
                      className="form-input spacing-item"
                      value={relation.relationship || ""}
                      onChange={(e) => {
                        const updated = [...parentRelations];
                        updated[index] = { ...updated[index], relationship: e.target.value, customRelationship: "" };
                        setParentRelations(updated);
                      }}
                      disabled={!relation.parentId}
                    >
                      <option value="">เลือกความสัมพันธ์</option>
                      {relationshipOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>

                    {relation.relationship === "อื่นๆ" && (
                      <input
                        className="text-input spacing-item"
                        placeholder="กรอกความสัมพันธ์อื่นๆ"
                        value={relation.customRelationship || ""}
                        onChange={(e) => {
                          const updated = [...parentRelations];
                          updated[index].customRelationship = e.target.value;
                          setParentRelations(updated);
                        }}
                      />
                    )}

                    {parentRelations.length > 1 && (
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
                        onClick={() => {
                          const updated = [...parentRelations];
                          updated.splice(index, 1);
                          setParentRelations(updated);
                        }}
                      >
                        <Trash2 size={20} color="#ef4444" />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                className="add-parent-btn"
                onClick={() => setParentRelations([...parentRelations, { parentId: "", relationship: "", customRelationship: "", parentPrefix: "" }])}
              >
                + เพิ่มผู้ปกครอง
              </button>


              <div className="button-group spacing-row">
                <button className="confirm-btn" onClick={handleSave}>บันทึก</button>
                <button className="cancel-btn" onClick={() => {
                  resetForm();
                  setEditingPatient(null);
                  setShowModal(false);
                }}>
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

export default ManageDepartment;
