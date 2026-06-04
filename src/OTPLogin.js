import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./OTPLogin.css";

function OTPLogin() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");

  const handleLogin = async () => {
    if (!identity) {
      alert("กรุณากรอก User ID หรือ เบอร์โทร");
      return;
    }

    try {
      const res = await axios.post("/api/login", { identity });
      const { role, hn_number } = res.data;

      if (role === "admin") {
        alert("admin ต้องเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเท่านั้น");
        return;
      }

      // ✅ จำค่าไว้
      localStorage.setItem("role", role);
      localStorage.setItem("hn", hn_number);

      // ✅ จำลอง OTP ส่ง
      alert("OTP ถูกส่งแล้ว: 123456 ");

      // ✅ ไปหน้ากรอก OTP
      navigate("/enter-otp", { state: { hnNumber: hn_number, role } });
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="otp-login-container">
      <h1>เข้าสู่ระบบ</h1>
      <p>กรอก User ID หรือ เบอร์โทร เพื่อรับ OTP</p>
      <input
        type="text"
        placeholder="User ID หรือ เบอร์โทร"
        value={identity}
        onChange={(e) => setIdentity(e.target.value)}
        className="input-field"
      />
      <button className="primary-button" onClick={handleLogin}>
        ส่งรหัส OTP
      </button>
    </div>
  );
}

export default OTPLogin;
