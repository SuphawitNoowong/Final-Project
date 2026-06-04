import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./EnterOTP.css";

function EnterOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== "")) {
      handleSubmit(newOtp.join(""));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      const digits = paste.split("");
      setOtp(digits);
      digits.forEach((d, i) => {
        if (inputs.current[i]) {
          inputs.current[i].value = d;
        }
      });
      inputs.current[5]?.focus(); // โฟกัสช่องสุดท้าย
      handleSubmit(paste);
    }
  };

  const handleSubmit = (otpValue) => {
    const validOtp = "123456";
    const { hnNumber, role } = location.state || {};

    if (otpValue === validOtp) {
      const dashboardPath =
        role === "parent"
          ? "/parent-dashboard"
          : role === "doctor"
          ? "/doctor-dashboard"
          : role === "admin"
          ? "/admin-dashboard"
          : null;

      if (dashboardPath) {
        navigate(dashboardPath, {
          state: { hnNumber, role },
        });
      } else {
        alert("Unknown role. Please try again.");
      }
    } else {
      alert("Invalid OTP. Please try again.");
      resetOtp();
    }
  };

  const resetOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    inputs.current.forEach((input) => {
      if (input) input.value = "";
    });
    inputs.current[0]?.focus();
  };

  return (
    <div className="otp-container">
      <h1>Enter OTP</h1>
      <p>Enter the OTP sent to your registered number:</p>
      <div className="otp-input">
        {otp.map((digit, index) => (
          <input
            key={index}
            type="tel"
            inputMode="numeric"
            maxLength="1"
            defaultValue={digit}
            ref={(el) => (inputs.current[index] = el)}
            onChange={(e) => handleChange(e.target.value, index)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                if (otp[index]) {
                  const newOtp = [...otp];
                  newOtp[index] = "";
                  setOtp(newOtp);
                } else if (index > 0) {
                  inputs.current[index - 1]?.focus();
                }
              } else if (e.key === "ArrowLeft" && index > 0) {
                inputs.current[index - 1]?.focus();
              } else if (e.key === "ArrowRight" && index < 5) {
                inputs.current[index + 1]?.focus();
              }
            }}
          />
        ))}
      </div>
      <button
        className="primary-button"
        onClick={() => handleSubmit(otp.join(""))}
      >
        Submit
      </button>
      <p className="resend-link" onClick={resetOtp}>
        Resend OTP
      </p>
    </div>
  );
}

export default EnterOTP;
