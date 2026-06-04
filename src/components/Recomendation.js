import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './Recomendation.css';
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import WeightChart from '../components/chart/WeightChart';
import HeightChart from '../components/chart/HeightChart';
import Sunglasscat from '../assets/cat-sunglass.jpg';
import { useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  Activity,
  Stethoscope,
  ListChecks,
  FileBarChart2,
  TrendingUp,
  TrendingDown
} from "lucide-react";



const valueMap = {
  // ✅ dropdown
  Number_of_Times_Eaten_Solid_Food: {
    label: "จำนวนมื้ออาหารแข็ง",
    values: {
      0: "1-2 มื้อ",
      1: "3-4 มื้อ",
      2: "ไม่ได้บริโภค",
      3: "4 มื้อขึ้นไป"
    }
  },


  // ✅ checkbox บริโภค
  Still_Breastfeeding: { label: "บริโภคนมแม่", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Thin_Porridge: { label: "บริโภคข้าวต้มเหลว", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Grain_Based_Foods: { label: "บริโภคอาหารธัญพืช", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Orange_Yellow_Foods: { label: "บริโภคผักเนื้อสีส้ม/เหลืองเข้ม", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_White_Root_Foods: { label: "บริโภคอาหารประเภทหัวที่มีแป้งและเนื้อสีขาว", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Dark_Green_Leafy_Veggies: { label: "บริโภคผักใบเขียวเข้ม", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Ripe_Mangoes_Papayas: { label: "บริโภคมะม่วง/มะละกอสุก", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Meat: { label: "บริโภคเนื้อสัตว์", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Eggs: { label: "บริโภคอาหารที่มีส่วนผสมของไข่", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Fish_Shellfish_Seafood: { label: "บริโภคอาหารทะเล", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Legumes_Nuts_Foods: { label: "บริโภคถั่ว", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Oil_Fats_Butter: { label: "บริโภคน้ำมัน/เนย", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Salt: { label: "บริโภคอาหารที่มีเกลือผสม", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Received_Dairy_Products: { label: "บริโภคผลิตภัณฑ์ที่ทำจากนม", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Given_Anything_to_Drink_in_First_6_Months: { label: "ดื่มของเหลวใน 6 เดือนแรก", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },
  Vitamin_A_Intake_First_8_Weeks: { label: "บริโภควิตามินเอใน 8 สัปดาห์แรก", values: { 0: "ไม่ได้บริโภค", 1: "บริโภค" } },

  // ✅ สุขอนามัย
  Sanitary_Disposal: { label: "ถ่ายอุจจาระถูกสุขลักษณะ", values: { 0: "ไม่ถูกสุขลักษณะ", 1: "ถูกสุขลักษณะ" } },
  Child_wash_hand_before_or_after_eating_food: { label: "เด็กล้างมือก่อน/หลังทานข้าว", values: { 0: "ไม่ล้างมือ", 1: "ล้างมือ" } },
  Child_wash_hand_before_or_after_visiting_the_toilet: { label: "เด็กล้างมือก่อน/หลังเข้าห้องน้ำ", values: { 0: "ไม่ล้างมือ", 1: "ล้างมือ" } },

  // ✅ number
  Infant_Formula_Intake_Count_Yesterday: { label: "จำนวนครั้งการบริโภคนมผงภายใน 1 วัน" },
  Breastfeeding_Count_DayandNight: { label: "จำนวนการบริโภคนมภายใน 1 วัน" },
  Received_Animal_Milk_Count: { label: "จำนวนครั้งที่ดื่มนมสัตว์ภายใน 1 วัน" },
};

function normalizeTimestamp(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}




function Recomendation() {
  const [dotText, setDotText] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [topFeatures, setTopFeatures] = useState([]);
  const [globalAverages, setGlobalAverages] = useState({});
  const [privateNote, setPrivateNote] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [weightHistory, setWeightHistory] = useState([]);   // ✅ ใส่ตรงนี้
  const [heightHistory, setHeightHistory] = useState([]);   // ✅ ใส่ตรงนี้
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const createdAt = location.state?.createdAt;
  const patient = location.state?.patient;
  const [doctorName, setDoctorName] = useState("");
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [suggestionMap, setSuggestionMap] = useState({});
  const [timestamps, setTimestamps] = useState([]);
  const [mostGlobalFeatures, setMostGlobalFeatures] = useState([]);
  const parsePublicNoteToSuggestionMap = (note) => {
    const map = {};
    if (!note || typeof note !== "string") return map;

    const lines = note.split("\n");
    for (const line of lines) {
      if (line.includes(":")) {
        const [action, content] = line.split(":").map(s => s.trim());
        const labels = content.split(",").map(l => l.trim());

        let value = null;
        if (action.startsWith("ควร")) value = "increase";
        else if (action.startsWith("ไม่ควร")) value = "decrease";

        if (value) {
          for (const label of labels) {
            map[label] = value;
          }
        }
      }
    }
    return map;
  };


  useEffect(() => {
    if (id) {
      axios.get(`/api/patients/${id}/records/timestamps`)
        .then(res => {
          setTimestamps(res.data); // เป็น array ของ created_at
        })
        .catch(err => console.error("❌ ดึง timestamps ไม่สำเร็จ:", err));
    }
  }, [id]);


  // ถ้าไม่มี createdAt และมี timestamps แล้ว → ดึง record ล่าสุด
  useEffect(() => {
    if (id && !createdAt && timestamps.length > 0) {
      const latest = normalizeTimestamp(timestamps[0]);
      setShapTime(latest);

      axios.get(`/api/patients/${id}/records`, {
        params: { created_at: latest }
      })
        .then((res) => {
          console.log("📦 record (ล่าสุด):", res.data);
          setRecord(res.data);
          setPrivateNote(res.data.private_note || "");
          setPublicNote(res.data.public_note || "");

          const doctorNameFromRecord = res.data.doctor_name || "ไม่ทราบชื่อหมอ";
          setDoctorName(doctorNameFromRecord);  // เก็บชื่อหมอใน state

        })

        .catch((err) => {
          console.error("❌ โหลด record ล่าสุดไม่สำเร็จ:", err);
        });
    }
  }, [id, createdAt, timestamps]);

  useEffect(() => {
    if (!record || !record.status) return;

    axios.get(`/model/shap/global/most/${record.status}`)
      .then(res => {
        const features = res.data?.top_features || [];

        setMostGlobalFeatures(features); // ✅ ยังเก็บไว้ใช้สำหรับตารางซ้าย

        // ✅ แยก top5 และ bottom5 ตามค่า max_shap
        const sortedDesc = [...features].sort((a, b) => b.max_shap - a.max_shap);
        const top5 = sortedDesc.slice(0, 5);

        const sortedAsc = [...features].sort((a, b) => a.max_shap - b.max_shap);
        const bottom5 = sortedAsc.slice(0, 5);

        setTopGlobalFeatures(top5);
        setBottomGlobalFeatures(bottom5);
      })
      .catch(() => {
        console.log("⚠️ ดึง SHAP global most ไม่สำเร็จ");
        setMostGlobalFeatures([]);
        setTopGlobalFeatures([]);
        setBottomGlobalFeatures([]);
      });
  }, [record]);

  useEffect(() => {
    if (timestamps.length > 0 && !shapTime) {
      setShapTime(timestamps[0]); // อันแรกคือล่าสุด เพราะ DESC
    }
  }, [timestamps]);

  const [showFullTable, setShowFullTable] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [topGlobalFeatures, setTopGlobalFeatures] = useState([]);
  const [bottomGlobalFeatures, setBottomGlobalFeatures] = useState([]);
  const [shapTime, setShapTime] = useState(null); // สำหรับเวลาที่จะส่งไป
  const normalizedTimestamps = timestamps.map(normalizeTimestamp);
  const normalizedShapTime = shapTime ? normalizeTimestamp(shapTime) : null;
  const combinedTimestamps = Array.from(new Set([...normalizedTimestamps, normalizedShapTime])).filter(Boolean);
  const sortedTimestamps = combinedTimestamps.sort((a, b) => new Date(b) - new Date(a));
  const statusMap = {
    Normal: "ปกติ",
    Obesity: "อ้วน",
    Overweight: "น้ำหนักมากเกินไป",
    SAM: "ภาวะทุพโภชนาการเฉียบพลันรุนแรง",
    Stunting: "แคระแกร็น",
    Underweight: "น้ำหนักน้อยเกินไป"
  };
  const [normalAverages, setNormalAverages] = useState({});
  useEffect(() => {
    if (id && shapTime) {
      axios.get(`/model/shap/local/${id}`, {
        params: { created_at: shapTime }
      })
        .then(res => {
          const sorted = res.data.top_features.sort((a, b) => b.shap - a.shap);
          setTopFeatures(sorted);
        })
        .catch(() => setTopFeatures([]));
    }
  }, [id, shapTime]);

  // // 👉 ดึง SHAP global จาก status ของ record
  // useEffect(() => {
  //   if (!record || !record.status) return;
  //   axios.get(`http://localhost:8000/shap/global/${record.status}`)
  //     .then(res => {
  //       const all = res.data.summary_by_feature || [];

  //       const sorted = [...all].sort((a, b) => b.mean_shap_at_mode - a.mean_shap_at_mode);
  //       const top5 = sorted.slice(0, 5);

  //       const bottom5 = [...all]
  //         .sort((a, b) => a.mean_shap_at_mode - b.mean_shap_at_mode)
  //         .slice(0, 5);

  //       setTopGlobalFeatures(top5);
  //       setBottomGlobalFeatures(bottom5);
  //     })
  //     .catch(() => console.log("⚠️ ดึง SHAP global ไม่สำเร็จ"));
  // }, [record]);

  const categoryMap = {
    Still_Breastfeeding: "บริโภค",
    Received_Thin_Porridge: "บริโภค",
    Received_Grain_Based_Foods: "บริโภค",
    Received_Orange_Yellow_Foods: "บริโภค",
    Received_White_Root_Foods: "บริโภค",
    Received_Dark_Green_Leafy_Veggies: "บริโภค",
    Received_Ripe_Mangoes_Papayas: "บริโภค",
    Received_Meat: "บริโภค",
    Received_Eggs: "บริโภค",
    Received_Fish_Shellfish_Seafood: "บริโภค",
    Received_Legumes_Nuts_Foods: "บริโภค",
    Received_Oil_Fats_Butter: "บริโภค",
    Received_Salt: "บริโภค",
    Received_Dairy_Products: "บริโภค",
    Given_Anything_to_Drink_in_First_6_Months: "บริโภค",
    Vitamin_A_Intake_First_8_Weeks: "บริโภค",
    Sanitary_Disposal: "ถูกสุขลักษณะ",
    Child_wash_hand_before_or_after_eating_food: "ล้างมือ",
    Child_wash_hand_before_or_after_visiting_the_toilet: "ล้างมือ",
  };

  const numericSuggestionFeatures = new Set([
    "Number_of_Times_Eaten_Solid_Food",
    "Infant_Formula_Intake_Count_Yesterday",
    "Breastfeeding_Count_DayandNight",
    "Received_Animal_Milk_Count",
  ]);

  const getSuggestionLabel = (feature, type = "increase") => {
    if (numericSuggestionFeatures.has(feature)) {
      return type === "increase" ? "ควรเพิ่ม" : "ควรลด";
    }

    const category = categoryMap[feature];
    if (!category) {
      return type === "increase" ? "ควรปรับพฤติกรรม" : "ไม่ควรทำ";
    }

    if (category === "ถูกสุขลักษณะ") {
      return type === "increase" ? "ควรปฏิบัติ" : "ไม่ควรปฏิบัติ";
    }

    return type === "increase" ? `ควร${category}` : `ไม่ควร${category}`;
  };


  const unitMap = {
    Number_of_Times_Eaten_Solid_Food: "มื้อ",
    Infant_Formula_Intake_Count_Yesterday: "ครั้ง",
    Breastfeeding_Count_DayandNight: "ครั้ง",
    Received_Animal_Milk_Count: "ครั้ง",
  };

  const formatWithUnit = (feature, value) => {
    const unit = unitMap[feature];
    if (unit && !isNaN(value)) {
      return `${value} ${unit}`;
    }
    return value;
  };


  const handleRadioChange = (label, value) => {
    setSuggestionMap(prev => {
      const updated = { ...prev, [label]: value };
      const increaseList = Object.keys(updated).filter(k => updated[k] === "increase");
      const decreaseList = Object.keys(updated).filter(k => updated[k] === "decrease");

      updatePublicNoteText(increaseList, decreaseList);
      return updated;
    });
  };
  const updatePublicNoteText = (incKeys, decKeys) => {
    const combined = [...incKeys.map(k => [k, "increase"]), ...decKeys.map(k => [k, "decrease"])];
    const grouped = {};

    for (const [label, type] of combined) {
      const featureKey = Object.keys(valueMap).find(key => valueMap[key].label === label);
      if (!featureKey) continue;

      const suggestionText = getSuggestionLabel(featureKey, type); // เช่น "ควรล้างมือ"
      if (!grouped[suggestionText]) {
        grouped[suggestionText] = [];
      }
      grouped[suggestionText].push(label);
    }

    // ✨ แปลงเป็นรูปแบบแนวยาว
    const lines = ["โปรดปฏิบัติตาม:"];
    for (const [actionText, labels] of Object.entries(grouped)) {
      const unique = [...new Set(labels)];
      lines.push(`${actionText}: ${unique.join(", ")}`);
    }

    setPublicNote(lines.join("\n"));
  };



  useEffect(() => {
    if (id) {
      axios.get(`/api/patients/${id}/records/history`)
        .then((res) => {
          const historyData = res.data || [];
          console.log("📦 history data from API:", historyData);
          const weight = historyData
            .filter(item => item.weight && item.created_at)
            .map(item => {
              const parsedWeight = parseFloat(item.weight);
              return {
                date: item.created_at,  // <== เปลี่ยนตรงนี้
                weight: isNaN(parsedWeight) ? 0 : parsedWeight,
              };
            });

          const height = historyData
            .filter(item => item.height && item.created_at)
            .map(item => {
              const parsedHeight = parseFloat(item.height);
              return {
                date: item.created_at,  // <== เปลี่ยนตรงนี้
                height: isNaN(parsedHeight) ? 0 : parsedHeight,
              };
            });


          console.log("📊 weight array:", weight);
          console.log("📏 height array:", height);

          setWeightHistory(weight);
          setHeightHistory(height);
        })
        .catch(err => console.error("❌ ดึงประวัติกราฟไม่สำเร็จ:", err));
    }
  }, [id]);


  useEffect(() => {
    axios.get("/model/shap/only/normal")
      .then(res => {
        const normalData = res.data?.top_features || [];
        const map = {};
        normalData.forEach(item => {
          map[item.feature] = item.real_value_original ?? item.real_value;
        });
        setNormalAverages(map); // ✅ ใช้ state ใหม่
      })
      .catch(() => console.warn("⚠️ ดึง SHAP normal ไม่สำเร็จ"));
  }, []);


  const [selectedOption, setSelectedOption] = useState("ประวัติการตรวจครั้งอื่น");

  useEffect(() => {
    const allLoaded =
      record !== null &&
      topFeatures.length > 0 &&
      mostGlobalFeatures.length > 0 &&
      (topGlobalFeatures.length > 0 || bottomGlobalFeatures.length > 0) &&
      weightHistory.length > 0 &&
      heightHistory.length > 0 &&
      timestamps.length > 0;

    if (allLoaded) {
      setInitialLoading(false); // ✅ ปิด loading ได้เมื่อทุกอย่างเสร็จ
    }
  }, [
    record,
    topFeatures,
    mostGlobalFeatures,
    topGlobalFeatures,
    bottomGlobalFeatures,
    weightHistory,
    heightHistory,
    timestamps
  ]);


  useEffect(() => {
    if (id && createdAt) {
      const formatted = normalizeTimestamp(createdAt);
      setShapTime(formatted);

      axios.get(`/api/patients/${id}/records`, {
        params: { created_at: formatted }
      })
        .then((res) => {
          setRecord(res.data);
        })
        .catch((err) => {
          console.error("❌ โหลดข้อมูล record ไม่สำเร็จ:", err);
        });
    }
  }, [id, createdAt]);

  // ✅ แยกโหลด public/private note (อย่างใดอย่างหนึ่งก็ขึ้นได้)
  useEffect(() => {
    if (id && shapTime) {
      axios.get(`/api/patients/${id}/records/notes`, {
        params: { created_at: shapTime }
      })
        .then((res) => {
          if (res.data.public_note !== undefined && res.data.public_note !== null) {
            setPublicNote(res.data.public_note);
            const parsedMap = parsePublicNoteToSuggestionMap(res.data.public_note);
            setSuggestionMap(parsedMap);
          }
          if (res.data.private_note !== undefined && res.data.private_note !== null) {
            setPrivateNote(res.data.private_note);
          }
        })
        .catch((err) => {
          console.error("❌ โหลด note ไม่สำเร็จ:", err);
        });
    }
  }, [id, shapTime]);


  useEffect(() => {
    if (id && !createdAt && timestamps.length > 0) {
      const latest = normalizeTimestamp(timestamps[0]); // ล่าสุด
      setShapTime(latest);

      axios.get(`/api/patients/${id}/records`, {
        params: { created_at: latest }
      })
        .then((res) => {
          setRecord(res.data);
          setPrivateNote(res.data.private_note || "");
          setPublicNote(res.data.public_note || "");

        })
        .catch((err) => {
          console.error("❌ โหลดข้อมูลล่าสุดไม่สำเร็จ:", err);
        });
    }
  }, [id, createdAt, timestamps]);


  useEffect(() => {
    if (id && shapTime) {
      setIsLoading(true); // 🌀 เริ่มโหลด

      const normalized = normalizeTimestamp(shapTime);
      // 🔁 โหลดข้อมูลผู้ป่วย ณ เวลานั้น
      axios.get(`/api/patients/${id}/records`, {
        params: { created_at: normalized }
      })
        .then((res) => {
          setRecord(res.data);

          // 🔁 โหลด SHAP local ใหม่
          return axios.get(`/model/shap/local/${id}`, {
            params: { created_at: shapTime }
          })

        })
        .then((res) => {
          const sorted = res.data.top_features.sort((a, b) => b.shap - a.shap);
          setTopFeatures(sorted);
        })
        .catch((err) => {
          console.error("❌ โหลดข้อมูล record หรือ SHAP ไม่สำเร็จ:", err);
          setRecord(null);
          setTopFeatures([]);
        })
        .finally(() => {
          setIsLoading(false); // ✅ จบโหลด
        });
    }
  }, [id, shapTime]);


  useEffect(() => {
    // เริ่มหมุนจุด ...
    const frames = ["", ".", "..", "..."];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % frames.length;
      setDotText(frames[index]);
    }, 500); // ทุก 0.5 วิ

    return () => clearInterval(interval);
  }, []);

  if (initialLoading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #e0fff5, #f0fffc)',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: "'Prompt', sans-serif"
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          borderRadius: '24px',
          padding: '40px 30px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
          animation: 'zoomIn 0.5s ease-out',
          minWidth: '320px'
        }}>
          <img
            src="/doctor-penguin.gif"
            alt="กำลังโหลด"
            style={{ width: 130, marginBottom: '20px' }}
          />
          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#075e54',
            marginBottom: '10px'
          }}>
            กำลังโหลดผลการประเมิน
            <span style={{ marginLeft: 6 }}>{dotText}</span>
            <span style={{ visibility: 'hidden', marginLeft: 6 }}>...</span>
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#444',
            lineHeight: '1.6'
          }}>
            กรุณารอสักครู่ ข้อมูลสุขภาพของผู้ป่วยกำลังมา...
          </p>
        </div>

        {/* CSS Animation */}
        <style>{`
            @keyframes zoomIn {
              0% {
                transform: scale(0.9);
                opacity: 0;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
      </div>
    );
  }



  if (!patient) {
    return (
      <div style={{ padding: 20 }}>
        <h2>ไม่พบข้อมูลผู้ป่วย</h2>
        <p>กรุณากลับไปหน้าเดิมแล้วเลือกผู้ป่วยอีกครั้ง</p>
      </div>
    );
  }

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
  };

  const handleSavePublicNote = () => {
    if (!id || !shapTime) return;  // ✅ ต้องมีเวลาที่ตรงกับใน DB
    setIsSaving(true);
    const fullName = localStorage.getItem("fullName") || "ไม่ทราบชื่อผู้ใช้";

    axios.put(`/api/patients/${id}/records/public_note`, {
      created_at: shapTime,  // ✅ ใช้เวลาที่ตรงกับ DB
      review_by: fullName,
      public_note: publicNote
    })
      .then(() => {
        alert("✅ บันทึกสำเร็จแล้ว");
        return axios.get(`/api/patients/${id}/records`, {
          params: { created_at: shapTime }
        });
      })
      .catch(() => {
        alert("❌ เกิดข้อผิดพลาดในการบันทึก");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleSavePrivateNote = () => {
    if (!id || !shapTime) return;  // ✅ ต้องมีเวลาที่ตรงกับใน DB
    setIsSaving(true);

    axios.put(`/api/patients/${id}/records/private_note`, {
      created_at: shapTime,  // ✅ ใช้เวลาที่ตรงกับ DB
      private_note: privateNote
    })
      .then(() => {
        alert("✅ บันทึกสำเร็จแล้ว");
        return axios.get(`/api/patients/${id}/records`, {
          params: { created_at: shapTime }
        });
      })

      .catch(() => {
        alert("❌ เกิดข้อผิดพลาดในการบันทึก");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const isEqual = (a, b) => {
    if (a === b) return true;

    // แปลงให้เป็น float แล้วเทียบ (เช่น 3 กับ "3.0")
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return !isNaN(numA) && !isNaN(numB) && Math.abs(numA - numB) < 0.0001;
  };

  const nonCompliant = topFeatures.filter((item) => {
    const realValue = item.real_value;
    const normalVal = normalAverages[item.feature];

    if (normalVal === undefined || normalVal === null) return true; // ถ้าไม่มีค่ามาตรฐาน → ถือว่าไม่ปฏิบัติตามไว้ก่อน

    const valueMapEntry = valueMap[item.feature];
    const patientValue = valueMapEntry?.values?.[realValue] ?? realValue;
    const standardValue = (
      valueMapEntry?.values?.[String(normalVal)] ??
      valueMapEntry?.values?.[normalVal] ??
      normalVal
    );

    return !isEqual(patientValue, standardValue);
  });

  const compliant = topFeatures.filter((item) => {
    const realValue = item.real_value;
    const normalVal = normalAverages[item.feature];

    if (normalVal === undefined || normalVal === null) return false;

    const valueMapEntry = valueMap[item.feature];
    const patientValue = valueMapEntry?.values?.[realValue] ?? realValue;
    const standardValue = (
      valueMapEntry?.values?.[String(normalVal)] ??
      valueMapEntry?.values?.[normalVal] ??
      normalVal
    );

    return isEqual(patientValue, standardValue);
  });

  // ✅ แสดงเฉพาะ 13 รายการแรกของ "ไม่ได้ปฏิบัติตาม"
  const displayedFeatures = showFullTable
    ? [...nonCompliant, ...compliant]
    : nonCompliant.slice(0, 7);


  console.log("🧩 topFeatures:", topFeatures);
  console.log("🧮 displayedFeatures:", displayedFeatures);


  return (
    <div className="dashboard-container">
      <Header />
      <div className="recommendation-page">
        <div className="patient-date">
          วันที่ {shapTime
            ? (() => {
              const d = new Date(shapTime);
              return d.toLocaleDateString('th-TH', { dateStyle: 'long' }) +
                ' เวลา ' +
                d.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });
            })()
            : "--"}
        </div>

        {/* Page Title */}
        <div className="recommendation-title">
          ดูผลลัพธ์การประเมินของผู้ป่วย
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '18px', color: '#888' }}>
            🔄 กำลังโหลดข้อมูล...
          </div>
        )}


        {/* Patient Info + Graph */}
        <div className="recommendation-patient-wrapper">



          {/* ซ้าย: Patient Section */}
          <div className="recommendation-patient-section">


            {/* ซ้าย: รูป + ชื่อ + ปุ่ม */}
            <div className="patient-profile">
              <div className="patient-health-badge">ข้อมูลสุขภาพ</div>




              <img
                src={Sunglasscat}
                alt="Patient Avatar"
                className="patient-icon-image"
              />

              <div className="patient-name-large">{patient.name || "ไม่ทราบชื่อ"}</div>



            </div>

            {/* ขวา: Grid 2 columns */}
            <div className="patient-main-info">

              <div className="patient-info-grid-two">
                <div className="info-card">
                  <div className="label">User ID:</div>
                  <div className="value">{record?.hn_number || "--"}</div>
                </div>

                <div className="info-card">
                  <div className="label">เพศ:</div>
                  <div className="value">{patient.gender || "--"}</div>
                </div>
                <div className="info-card">
                  <div className="label">อายุ:</div>
                  <div className="value">{patient.age || "--"}</div>
                </div>
                <div className="info-card">
                  <div className="label">น้ำหนัก:</div>
                  <div className="value">{record?.weight ? `${record.weight} กก.` : "--"}</div>
                </div>

                <div className="info-card">
                  <div className="label">ส่วนสูง:</div>
                  <div className="value">{record?.height ? `${record.height} ซม.` : "--"}</div>
                </div>

                <div className="info-card">
                  <div className="label">โรคประจำตัว:</div>
                  <div className="value">{record?.congenital_disease || "--"}</div>
                </div>

              </div>

            </div>

          </div>


          {/* ขวา: Graph */}
          <WeightChart data={weightHistory} />
          <HeightChart data={heightHistory} />

        </div>

        {/* Action Buttons */}


        {/* ผลการตรวจ Section */}
        <div className="recommendation-result-section">
          <div className="result-header-row">
            <div className="result-left">
              <div className="result-title">ผลการตรวจ :</div>
              <div className="dropdown-wrapper-inline">
                <select
                  className="recommendation-dropdown"
                  value={shapTime || ""}
                  onChange={(e) => setShapTime(e.target.value)}
                >
                  <option value="">-- เลือกวันที่และเวลา --</option>
                  {sortedTimestamps.map((ts, idx) => (
                    <option key={idx} value={ts}>
                      {new Date(ts).toLocaleString("th-TH")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="result-table-wrapper">
            <div className="result-table-block left">

              {/* ✅ ย้ายผลลัพธ์มาไว้ใน block นี้ */}
              <div className="recommendation-status" style={{ marginBottom: "20px" }}>
                <div className="status-text">
                  อยู่ในเกณฑ์ : {statusMap[record?.status?.split(" ")[0]] || record?.status}
                </div>
              </div>

              {/* ✅ ย้าย feedback section มาที่นี่ */}
              <div className="recommendation-feedback-section">
                <div className="feedback-title">📌 ข้อเสนอแนะสำหรับผู้ปกครอง</div>
                <textarea
                  className="feedback-textarea"
                  value={publicNote}
                  onChange={(e) => setPublicNote(e.target.value)}
                  placeholder="ข้อเสนอแนะที่ผู้ปกครองควรทราบ..."
                  rows="3"
                />

                <button className="feedback-submit-btn" onClick={handleSavePublicNote}>
                  💾 บันทึกข้อเสนอแนะ
                </button>


              </div>

              {/* ✅ ตารางซ้าย */}
              {/* ตารางซ้ายของคุณอยู่ตรงนี้ต่อเลย */}
            </div>

            <div className="result-table-block right">
              {/* ✅ แพ้อาหาร/แพ้ยา */}
              <div className="allergy-card-group">
                <div className="allergy-card food">
                  <div className="allergy-label">แพ้อาหาร:</div>
                  <div className="allergy-value">{record?.Food_allergy || "ไม่มี"}</div>
                </div>

                <div className="allergy-card drug">
                  <div className="allergy-label">แพ้ยา:</div>
                  <div className="allergy-value">{record?.drug_allergy || "ไม่มี"}</div>
                </div>
              </div>

              <div className="recommendation-feedback-section">
                <div className="feedback-title">🔒 บันทึกส่วนตัวสำหรับหมอ</div>
                <textarea
                  className="feedback-textarea"
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  placeholder="บันทึกเฉพาะแพทย์ เช่น รายละเอียดการประเมิน..."
                  rows="3"
                />

                <button className="feedback-submit-btn" onClick={handleSavePrivateNote}>
                  💾 บันทึกข้อเสนอแนะ
                </button>
              </div>
              {/* ตารางฝั่งขวาอยู่ต่อจากนี้ */}
            </div>
          </div>



          {/* Wrapper → 2 ตาราง */}
          <div className="result-table-wrapper">

            {/* ตารางซ้าย (3/4) */}
            <div className="result-table-block left">
              <table className="result-table">
                <thead>
                  <tr>
                    <th>ข้อมูล</th>
                    <th>พฤติกรรมของผู้ป่วย</th>
                    <th>ค่ามาตรฐานของเด็กภาวะปกติ</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedFeatures.map((item, index) => {
                    // ✅ แปลงชื่อ feature
                    const featureLabel = valueMap[item.feature]?.label || item.feature;

                    // ✅ ใช้ real_value (ค่าเดิมที่แปลงกลับจาก scaler)
                    const realValue = item.real_value;

                    // ✅ แปลค่าผู้ป่วยด้วย valueMap ถ้ามี
                    const patientValue =
                      valueMap[item.feature]?.values?.[realValue] ?? realValue;

                    // ✅ หาค่ามาตรฐานจาก globalAverages
                    // ✅ ใช้ globalAverages ที่ดึงมาจาก /shap/normal มาแทนค่ามาตรฐาน
                    let normalRaw = normalAverages[item.feature];

                    // ✅ พยายาม parse เป็นตัวเลข (รองรับกรณีค่ามาตรฐานเป็น float จาก scaler แล้ว invert)
                    if (normalRaw !== undefined && typeof normalRaw === 'string' && !isNaN(normalRaw)) {
                      normalRaw = parseFloat(normalRaw);
                    }

                    // ✅ แปลงค่ามาตรฐานเป็นภาษาไทย ถ้ามีใน valueMap
                    const standardValue =
                      valueMap[item.feature]?.values?.[String(normalRaw)] ??
                      valueMap[item.feature]?.values?.[normalRaw] ??
                      normalRaw ?? "--";


                    console.log("🧪 Feature Mapping Debug", {
                      feature: item.feature,
                      standardRaw: normalRaw,
                      patientValue,
                      valueMap: valueMap[item.feature]?.values,
                      mappedStandardValue: valueMap[item.feature]?.values?.[String(normalRaw)],
                    });


                    return (
                      <tr key={index}>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "12px" }}>
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                            fontFamily: "'Prompt', sans-serif"
                          }}>
                            {/* ชื่อฟีเจอร์ */}
                            <div style={{
                              fontWeight: 600,
                              fontSize: "14.5px",
                              color: "#333",
                              marginBottom: "4px"
                            }}>
                              {featureLabel}
                            </div>

                            {/* Checkbox แนวนอน */}
                            <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
                              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", color: "#444", cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  name={`suggestion-${featureLabel}`}
                                  checked={suggestionMap[featureLabel] === "increase"}
                                  onChange={() => handleRadioChange(featureLabel, "increase")}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#22c55e",
                                    cursor: "pointer"
                                  }}
                                />
                                {getSuggestionLabel(item.feature, "increase")}
                              </label>

                              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", color: "#444", cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  name={`suggestion-${featureLabel}`}
                                  checked={suggestionMap[featureLabel] === "decrease"}
                                  onChange={() => handleRadioChange(featureLabel, "decrease")}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#f43f5e",
                                    cursor: "pointer"
                                  }}
                                />
                                {getSuggestionLabel(item.feature, "decrease")}
                              </label>

                              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", color: "#888", cursor: "pointer" }}>
                                <input
                                  type="radio"
                                  name={`suggestion-${featureLabel}`}
                                  checked={!suggestionMap[featureLabel]}
                                  onChange={() => handleRadioChange(featureLabel, null)}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "#ccc",
                                    cursor: "pointer"
                                  }}
                                />
                                ไม่มีคำแนะนำ
                              </label>
                            </div>
                          </div>
                        </td>

                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "12px" }}>
                          {(() => {
                            const shap = item.shap;
                            const isSame = isEqual(patientValue, standardValue);

                            let arrowClass = "";
                            let arrowSymbol = null;

                            if (!isSame) {
                              if (shap > 0) {
                                arrowClass = "arrow-up";
                                arrowSymbol = "↑";
                              } else if (shap < 0) {
                                arrowClass = "arrow-down";
                                arrowSymbol = "↓";
                              }
                            }

                            return (
                              <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <span className={isSame ? "badge-green" : "badge-red"}>
                                  {formatWithUnit(item.feature, patientValue)}
                                </span>
                                {!isSame && arrowSymbol && (
                                  <span className={arrowClass} style={{ marginLeft: 6 }}>
                                    {arrowSymbol}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle", padding: "12px" }}>
                          <span className="badge-green">{formatWithUnit(item.feature, standardValue)}</span>
                        </td>



                        {/* <td>
                          {(() => {
                            const normalVal = normalAverages[item.feature];
                            const globalFeature = mostGlobalFeatures.find(f => f.feature === item.feature);
                            const globalVal = globalFeature?.real_value_original;
                            const shap = item.shap;
                            const status = record?.status;
                            const statusName = statusMap[status?.split(" ")[0]] || status;

                            const featureLabel = valueMap[item.feature]?.label || item.feature;
                            const patientValue = valueMap[item.feature]?.values?.[realValue] ?? realValue;
                            const standardValueText = valueMap[item.feature]?.values?.[String(normalVal)] ?? valueMap[item.feature]?.values?.[normalVal] ?? normalVal;

                            const isStringStandard = typeof standardValueText === "string";

                            // ✅ ถ้าค่าผู้ป่วย = ค่ามาตรฐาน → แสดงข้อความเดียว
                            if (patientValue === standardValueText) {
                              return <span>ผู้ป่วยได้ปฏิบัติตามมาตรฐาน</span>;
                            }

                            let msg = "";
                            // 🧠 1. เปรียบเทียบกับ global
                            if (
                              normalVal !== undefined &&
                              globalVal !== undefined &&
                              Number(normalVal) === Number(globalVal)
                            ) {
                              msg = <span style={{ color: "#FF0033" }}>ควรพิจารณาร่วมกับข้อมูลอื่น</span>;
                            }

                            // 🧠 2. คำแนะนำจาก shap
                            let shapNote = "";
                            // if (shap > 0) {
                            //   shapNote = <>ส่งผลให้เป็น <span style={{ color: "#007bff" }}>{statusName}</span></>;
                            // } else if (shap < 0) {
                            //   shapNote = <>ส่งผลให้ไม่เป็น <span style={{ color: "#007bff" }}>{statusName}</span></>;
                            // } else {
                            //   shapNote = <>ไม่ส่งผลต่อ <span style={{ color: "#007bff" }}>{statusName}</span></>;
                            // }

                            // 🧠 3. คำแนะนำจากการเปรียบเทียบพฤติกรรม
                            let behaviorNote = "";
                            let recomendation = "";
                            if (isStringStandard) {
                              // → เป็นค่าข้อความ เช่น "บริโภค"
                              if (patientValue === standardValueText) {
                                behaviorNote = "ผู้ป่วยได้ปฏิบัติตามมาตรฐาน";
                              } else {
                                behaviorNote = "ผู้ป่วยไม่ได้ปฏิบัติตามมาตรฐาน";
                              }
                            } else {
                              const numericPatient = Number(realValue);
                              const numericStandard = Number(normalVal);

                              if (numericPatient < numericStandard) {
                                recomendation = `ควรบริโภค ${featureLabel} เพิ่มขึ้น`;
                                behaviorNote = `ผู้ป่วยไม่ได้ปฏิบัติตามค่ามาตรฐาน`;
                              } else if (numericPatient > numericStandard) {
                                recomendation = `ควรบริโภค ${featureLabel} ลดลง`;
                                behaviorNote = `ผู้ป่วยไม่ได้ปฏิบัติตามค่ามาตรฐาน`;
                              } else {
                                behaviorNote = `ผู้ป่วยปฏิบัติตามค่ามาตรฐาน`;
                              }
                            }

                            return (
                              <>
                                {behaviorNote} <br />
                                {recomendation} <br />
                                {shapNote} <br />
                                {msg && <span style={{ fontStyle: "italic", color: "#888" }}>{msg}</span>}
                              </>
                            );
                          })()}


                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>

              </table>

              {/* ปุ่ม toggle */}
              <div style={{ margin: '16px 0', textAlign: 'center' }}>
                <button
                  className="recommendation-action-btn"
                  onClick={() => setShowFullTable(!showFullTable)}
                >
                  {showFullTable ? 'ซ่อนเพิ่มเติม' : 'แสดงเพิ่มเติม'}
                </button>
              </div>
            </div>

            {/* ตารางขวา (1/4) */}
            <div className="result-table-block right">
              <table className="result-table pro-table">
                <thead>
                  <tr>
                    <th>
                      <span
                        style={{
                          backgroundColor: "white",
                          borderRadius: "50%",
                          width: 23,
                          height: 23,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 8,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <Stethoscope size={16} color="#16a34a" />
                      </span>
                      ปัจจัยเสี่ยงของเด็กที่เป็นภาวะ
                      <span> {statusMap[record?.status?.split(" ")[0]] || record?.status}</span>
                    </th>

                    <th>
                      <span
                        style={{
                          backgroundColor: "white",
                          borderRadius: "50%",
                          width: 23,
                          height: 23,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 8,
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}
                      >
                        <ListChecks size={16} color="#0ea5e9" />
                      </span>
                      ค่าของข้อมูล
                    </th>


                  </tr>
                </thead>
                <tbody>
                  {/* 🔼 หัวข้อ Top 5 */}
                  <tr className="section-header top-header">
                    <td colSpan="2">
                      <TrendingUp size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Top 5 พฤติกรรมเสี่ยงที่ส่งผลต่อเด็กที่มีภาวะ
                      <span> {statusMap[record?.status?.split(" ")[0]] || record?.status} </span>
                    </td>
                  </tr>
                  {topGlobalFeatures.map((item, index) => {
                    const featureName = valueMap[item.feature]?.label || item.feature;
                    const modeVal = item.real_value_original ?? item.real_value ?? "--";
                    const translatedMode =
                      valueMap[item.feature]?.values?.[String(modeVal)] ??
                      valueMap[item.feature]?.values?.[modeVal] ??
                      modeVal;

                    return (
                      <tr key={`top-${index}`} className="top-row">
                        <td><span className="arrow-up">↑</span> {featureName}</td>
                        <td>
                          <span className="value-badge">
                            {typeof translatedMode === "number"
                              ? formatWithUnit(item.feature, translatedMode)
                              : translatedMode}
                          </span>
                        </td>

                      </tr>
                    );
                  })}

                  {/* 🔽 หัวข้อ Bottom 5 */}
                  <tr className="section-header bottom-header">
                    <td colSpan="2">
                      <TrendingDown size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      Top 5 ปัจจัยที่ป้องกันไม่ให้เป็นภาวะ
                      <span> {statusMap[record?.status?.split(" ")[0]] || record?.status} </span>
                    </td>
                  </tr>
                  {bottomGlobalFeatures.map((item, index) => {
                    const featureName = valueMap[item.feature]?.label || item.feature;
                    const modeVal = item.real_value_original ?? item.real_value ?? "--";
                    const translatedMode =
                      valueMap[item.feature]?.values?.[String(modeVal)] ??
                      valueMap[item.feature]?.values?.[modeVal] ??
                      modeVal;

                    return (
                      <tr key={`bottom-${index}`} className="bottom-row">
                        <td><span className="arrow-down">↓</span> {featureName}</td>
                        <td>
                          <span className="value-badge">
                            {!isNaN(Number(translatedMode))
                              ? formatWithUnit(item.feature, translatedMode)
                              : translatedMode}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>

          </div> {/* end .result-table-wrapper */}

        </div> {/* end .recommendation-result-section */}

      </div> {/* end .recommendation-page */}
      <Footer />
    </div >
  );
}

export default Recomendation;
