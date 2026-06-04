import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./RegisterParent.css";

function RegisterParent() {
  const [form, setForm] = useState({
    hn_number: "",
    prefix: "",
    firstName: "",
    lastName: "",
    phone: "",
    houseNo: "",
    moo: "",
    alley: "",
    street: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: ""
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestHN = async () => {
      try {
        const res = await axios.get("/api/last-parent-hn");
        const lastHN = res.data.last_hn || "00000";
        console.log("โหลด HN สำเร็จ:", lastHN);
        setForm((prev) => ({ ...prev, hn_number: lastHN }));
        console.log("โหลด HN สำเร็จใน form:", form.hn_number);
      } catch (err) {
        console.error("โหลด HN ไม่สำเร็จ", err);
      }
    };
    fetchLatestHN();
  }, []);
  const handleChange = (e) => {
    const { name, value } = e.target;
    let filtered = value;

    // ✅ ชื่อ-นามสกุล: เฉพาะอักษรไทย + เว้นวรรค
    if (name === "firstName" || name === "lastName") {
      filtered = value.replace(/[^ก-๙\s]/g, "");
    }

    // ✅ เบอร์โทร: เฉพาะเลขไทย ใส่รูปแบบ xxx-xxx-xxxx
    else if (name === "phone") {
      const numeric = value.replace(/\D/g, "").slice(0, 10);
      if (numeric.length > 6) {
        filtered = `${numeric.slice(0, 3)}-${numeric.slice(3, 6)}-${numeric.slice(6)}`;
      } else if (numeric.length > 3) {
        filtered = `${numeric.slice(0, 3)}-${numeric.slice(3)}`;
      } else {
        filtered = numeric;
      }
    }

    // ✅ บ้านเลขที่: ตัวเลข และ /
    else if (name === "houseNo") {
      filtered = value.replace(/[^0-9/]/g, "");
    }

    // ✅ หมู่: ตัวเลขเท่านั้น
    else if (name === "moo") {
      filtered = value.replace(/\D/g, "");
    }

    // ✅ รหัสไปรษณีย์: ตัวเลข 5 หลัก
    else if (name === "postalCode") {
      filtered = value.replace(/\D/g, "").slice(0, 5); // ✅ จำกัด 5 ตัว
    }

    // ✅ จังหวัด / เขต / แขวง / ถนน / ซอย: เฉพาะอักษรไทย + เว้นวรรค เท่านั้น
    const thaiFields = [
      "province",
      "district",
      "subDistrict",
      "alley",
      "street"
    ];
    if (thaiFields.includes(name)) {
      filtered = value.replace(/[^ก-๙\s]/g, "");
    }

    // ✅ อัปเดตค่าที่กรองแล้ว
    setForm((prev) => ({ ...prev, [name]: filtered }));
  };



  const handleSubmit = async () => {
    const requiredFields = [
      "prefix",
      "firstName",
      "lastName",
      "phone",
      "houseNo",
      // "moo", ← เอาออกเพราะให้เว้นได้
      "subDistrict",
      "district",
      "province",
      "postalCode"
    ];

    const missingFields = requiredFields.filter((field) => !form[field]?.trim());
    if (missingFields.length > 0) {
      const fieldNames = {
        prefix: "คำนำหน้า",
        firstName: "ชื่อ",
        lastName: "นามสกุล",
        phone: "เบอร์โทรศัพท์",
        houseNo: "บ้านเลขที่",
        subDistrict: "แขวง/ตำบล",
        district: "เขต/อำเภอ",
        province: "จังหวัด",
        postalCode: "รหัสไปรษณีย์"
      };

      const missingLabels = missingFields.map((field) => fieldNames[field]).join(", ");
      alert(`กรุณากรอกข้อมูล: ${missingLabels}`);
      return;
    }

    // ✅ ตรวจสอบเบอร์โทรศัพท์
    const phoneDigits = form.phone.replace(/-/g, "");
    if (!/^0\d{9}$/.test(phoneDigits)) {
      alert("เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 และมีความยาว 10 หลัก");
      return;
    }

    // ✅ ตรวจสอบรหัสไปรษณีย์
    if (!/^\d{5}$/.test(form.postalCode)) {
      alert("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");
      return;
    }

    // ✅ ตรวจสอบชื่อ-นามสกุล (ภาษาไทยเท่านั้น)
    const thaiOnlyRegex = /^[ก-๙\s]+$/;
    if (!thaiOnlyRegex.test(form.firstName)) {
      alert("ชื่อ ต้องเป็นอักษรภาษาไทยเท่านั้น");
      return;
    }
    if (!thaiOnlyRegex.test(form.lastName)) {
      alert("นามสกุล ต้องเป็นอักษรภาษาไทยเท่านั้น");
      return;
    }

    // ✅ ตรวจสอบ จังหวัด / เขต / แขวง
    const thaiAddressRegex = /^[ก-๙\s]+$/;
    const addressFields = [
      { name: "province", label: "จังหวัด" },
      { name: "district", label: "เขต/อำเภอ" },
      { name: "subDistrict", label: "แขวง/ตำบล" }
    ];
    for (let field of addressFields) {
      if (!thaiAddressRegex.test(form[field.name])) {
        alert(`${field.label} ต้องเป็นภาษาไทยเท่านั้น (ห้ามมีตัวเลขหรืออักขระพิเศษ)`);
        return;
      }
    }

    // ✅ หากผ่านทั้งหมด ส่งข้อมูล
    try {
      setLoading(true);
      const payload = { ...form, status: "pending" };
      const res = await axios.post("/api/register", payload);
      alert(res.data.message || "ส่งคำขอสมัครเรียบร้อยแล้ว");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสมัคร");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="register-page-wrapper">
      <div className="register-card">
        <div className="icon-circle">
          <span className="icon">👪</span>
        </div>
        <h1>สมัครผู้ปกครอง</h1>
        <p className="subtext">กรอกข้อมูลเพื่อใช้เข้าสู่ระบบและรับบริการ</p>

        <div className="form-row">
          {/* HN */}
          <input
            value={form.hn_number}
            disabled
            placeholder="หมายเลข User ID (อัตโนมัติ)"
            className="input-field hn-field"
          />

          {/* คำนำหน้า */}
          <select
            name="prefix"
            onChange={handleChange}
            value={form.prefix}
            className="input-field prefix-field"
          >
            <option value="">คำนำหน้า</option>
            <option value="นาย">นาย</option>
            <option value="นาง">นาง</option>
            <option value="นางสาว">นางสาว</option>
          </select>

          {/* ชื่อ */}
          <div className="input-with-star-register name-field">
            <input
              name="firstName"
              placeholder="ชื่อ"
              value={form.firstName}
              onChange={handleChange}
              className="input-field"
            />
            {!form.firstName && <span className="required-star-register">*</span>}
          </div>

          {/* นามสกุล */}
          <div className="input-with-star-register name-field">
            <input
              name="lastName"
              placeholder="นามสกุล"
              value={form.lastName}
              onChange={handleChange}
              className="input-field"
            />
            {!form.lastName && <span className="required-star-register">*</span>}
          </div>
        </div>


        <div className="input-with-star-register">
          <input
            name="phone"
            placeholder="เบอร์โทรศัพท์"
            value={form.phone}
            onChange={handleChange}
            className="input-field"
          />
          {/* แสดง * เฉพาะเมื่อยังไม่ได้กรอกข้อมูล */}
          {!form.phone && <span className="required-star-register">*</span>}
        </div>

        <div className="form-section-title">ที่อยู่ (ไม่จำเป็นต้องกรอกทั้งหมด)</div>

        <div className="form-row">
          {/* นามสกุล */}
          <div className="input-with-star-register name-field">
            <input
              name="houseNo"
              placeholder="บ้านเลขที่"
              value={form.houseNo}
              onChange={handleChange}
              className="input-field"
            />
            {!form.houseNo && <span className="required-star-register">*</span>}
          </div>
          <div className="input-with-star-register name-field">
            <input
              name="moo"
              placeholder="หมู่"
              value={form.moo}
              onChange={handleChange}
              className="input-field short"
            />
            {!form.moo && <span className="required-star-register"></span>}
          </div>
          <div className="input-with-star-register name-field">
            <input
              name="alley"
              placeholder="ตรอก/ซอย"
              value={form.alley}
              onChange={handleChange}
              className="input-field"
            />

          </div>
        </div>

        <div className="form-row">
          <div className="input-with-star-register name-field">
            <input
              name="street"
              placeholder="ถนน"
              value={form.street}
              onChange={handleChange}
              className="input-field"
            />

          </div>
          <div className="input-with-star-register name-field">
            <input
              name="subDistrict"
              placeholder="แขวง/ตำบล"
              value={form.subDistrict}
              onChange={handleChange}
              className="input-field"
            />
            {!form.subDistrict && <span className="required-star-register">*</span>}
          </div>
          <div className="input-with-star-register name-field">
            <input
              name="district"
              placeholder="เขต/อำเภอ"
              value={form.district}
              onChange={handleChange}
              className="input-field"
            />
            {!form.district && <span className="required-star-register">*</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="input-with-star-register name-field">
            <input
              name="province"
              placeholder="จังหวัด"
              value={form.province}
              onChange={handleChange}
              className="input-field"
            />
            {!form.province && <span className="required-star-register">*</span>}
          </div>
          <div className="input-with-star-register name-field">
            <input
              name="postalCode"
              placeholder="รหัสไปรษณีย์"
              value={form.postalCode}
              onChange={handleChange}
              className="input-field"
            />
            {!form.postalCode && <span className="required-star-register">*</span>}
          </div>
        </div>

        <button
          className="register-button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "กำลังส่งคำขอ..." : "ส่งคำขอสมัคร"}
        </button>
      </div>
    </div>
  );
}

export default RegisterParent;
