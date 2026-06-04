import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./LoginPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";



function LoginPage() {
  const [hnNumber, setHnNumber] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState("hn"); // 'hn' หรือ 'email'

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    if (mode === "admin") {
      setLoginMode("email");
    }
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const checkRoleByHN = async (hn) => {
    try {
      const res = await axios.post("/api/check-role", { hnNumber: hn });
      return res.data.role;
    } catch {
      return null;
    }
  };

  const toggleMode = () => {
    setLoginMode(loginMode === "hn" ? "email" : "hn");
    setHnNumber("");
    setEmailOrUsername("");
    setPassword("");
  };

  const handleLogin = async () => {
    setLoading(true);

    try {
      if (loginMode === "hn") {
        if (!hnNumber.trim()) {
          alert("กรุณากรอกหมายเลข User ID หรือเบอร์โทรศัพท์");
          setLoading(false);
          return;
        }

        const response = await axios.post("/api/login", {
          identity: hnNumber.trim()
        });

        const { role, hn_number, status } = response.data;


        // 🔴 ถ้าสถานะยังเป็น pending
        if (status === "pending") {
          alert("บัญชีของคุณยังไม่ได้รับการอนุมัติ\nกรุณาไปยืนยันตัวตนที่ศูนย์ติดต่อเพื่อยืนยันตัวตน");
          setLoading(false);
          return;
        }

        // ห้าม admin ใช้วิธีนี้
        if (role === "admin") {
          alert("แอดมินต้องเข้าสู่ระบบด้วยอีเมลและรหัสผ่านเท่านั้น");
          setLoading(false);
          return;
        }


        alert("ส่งรหัส OTP แล้ว: 123456 ");
        localStorage.setItem("hnNumber", hn_number); // ✅ ใช้ hn ที่ backend ส่งกลับมา
        localStorage.setItem("role", role);
        navigate("/enter-otp", { state: { hnNumber: hn_number, role } });
      } else {
        if (!emailOrUsername.trim() || !password.trim()) {
          alert("กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน");
          setLoading(false);
          return;
        }

        const response = await axios.post("/api/login-auth", {
          identity: emailOrUsername,
          password: password
        });


        const { token, role, hn_number } = response.data;
        localStorage.setItem("auth_token", token);
        localStorage.setItem("role", role);
        alert("ล็อกอินสำเร็จ 🎉");

        localStorage.setItem("hnNumber", hn_number);

        navigate("/admin-dashboard", { state: { hnNumber: hn_number, role } });
      }
    } catch (error) {
      if (error.response?.status === 403) {
        const serverStatus = error.response?.data?.status;

        if (serverStatus === "pending") {
          alert("บัญชีของคุณยังไม่ได้รับการอนุมัติ\nกรุณาไปยืนยันตัวตนที่ศูนย์ติดต่อเพื่อยืนยันตัวตน");
        } else if (serverStatus === "rejected") {
          alert("❌ คำขอของคุณถูกปฏิเสธ\nกรุณาติดต่อเจ้าหน้าที่เพื่อขอข้อมูลเพิ่มเติม");
        } else {
          alert("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่");
        }
      } else {
        alert("ข้อมูลเข้าสู่ระบบไม่ถูกต้อง หรือเซิร์ฟเวอร์ไม่ตอบสนอง");
      }
    }


    setLoading(false);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="icon-circle">
          <span role="img" aria-label="shield" className="icon">🛡️</span>
        </div>
        <h1>เข้าสู่ระบบ</h1>
        <p className="subtext">
          {loginMode === "hn" ? (
            "กรอกหมายเลข User ID เพื่อเข้าสู่ระบบ"
          ) : (
            <>
              เข้าสู่ระบบด้วยอีเมลหรือชื่อผู้ใช้และรหัสผ่าน
              <br />
              <span style={{ fontSize: "0.9rem", color: "#999" }}>
                (เฉพาะผู้ดูแลระบบเท่านั้น)
              </span>
            </>
          )}
        </p>



        {loginMode === "hn" ? (
          <input
            type="text"
            className="hn-input"
            placeholder="กรอกหมายเลข User ID หรือเบอร์โทรศัพท์"
            value={hnNumber}
            onChange={(e) => setHnNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
        ) : (
          <>
            <input
              type="text"
              className="hn-input"
              placeholder="อีเมลหรือชื่อผู้ใช้"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="hn-input"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <FontAwesomeIcon
                icon={showPassword ? faEyeSlash : faEye}
                className="toggle-password-icon"
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>


          </>
        )}

        <button className="login-button" onClick={handleLogin} disabled={loading}>
          {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ →"}
        </button>

        {/* toggleMode สำหรับแอดมินเท่านั้น */}
        <button
          className="toggle-mode-btn"
          onClick={toggleMode}
          style={{ marginTop: "10px" }}
        >
          {loginMode === "hn" ? (
            <>
              ล็อกอินด้วยอีเมล/ชื่อผู้ใช้{" "}
              <span className="admin-note">(สำหรับแอดมิน)</span>
            </>
          ) : (
            "ล็อกอินด้วยหมายเลข User ID"
          )}

        </button>
        <button
          className="toggle-mode-btn"
          onClick={() => navigate("/register")}
          style={{ marginTop: "10px" }}
        >
          สมัครผู้ปกครอง
        </button>






        <p className="footer-text">
          {loginMode === "hn"
            ? "ระบบจะส่ง OTP ไปยังหมายเลขโทรศัพท์ที่ลงทะเบียนไว้"
            : "หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ"}
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

