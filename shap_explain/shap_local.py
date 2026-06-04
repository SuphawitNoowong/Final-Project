import shap
import pandas as pd
import pickle
import numpy as np
from fastapi import APIRouter, Query
import joblib
import json
from joblib import load
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt
import mysql.connector

router = APIRouter()


# ✅ โหลด model และ metadata
try:
    model = joblib.load("src/model/best_model.joblib")
    with open("src/model/columns.pkl", "rb") as f:
        feature_columns = pickle.load(f)
    with open("src/model/label_mappings.json", "r", encoding="utf-8") as f:
        label_mappings_json = json.load(f)    
    with open("src/model/mapping.pkl", "rb") as f:
        label_mapping = pickle.load(f)
    scaler = load("src/model/scaler.joblib")

except Exception as e:
    print("❌ ERROR while loading model or data:", e)
    raise e

# ✅ ดึงข้อมูลผู้ป่วยล่าสุดจาก MySQL
def get_patient_data_from_db(patient_id, created_at_str):
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="child_malnutrition"
    )
    cursor = conn.cursor(dictionary=True)
    query = """
        SELECT * FROM prediction
        WHERE patient_id = %s AND created_at = %s
        LIMIT 1
    """
    cursor.execute(query, (patient_id, created_at_str))
    result = cursor.fetchone()
    cursor.close()
    conn.close()

    return result  # ✅ ไม่ต้อง pop ใด ๆ จะได้ใช้ได้ทั้งข้อมูลและเวลา

# ✅ Endpoint อธิบาย SHAP แบบ local
@router.get("/shap/local/{patient_id}")
def explain_local(patient_id: int, created_at: str = Query(...)):
    try:
        print(f"📌 กำลังโหลดข้อมูลของผู้ป่วย ID: {patient_id}")
        patient_data = get_patient_data_from_db(patient_id, created_at)
        print(patient_data)
        if patient_data is None:
            return {"error": "ไม่พบข้อมูลผู้ป่วย"}

        created_at = str(patient_data["created_at"])  # เก็บไว้ส่งกลับ
        class_personal = str(patient_data["Status_personal"]).strip()
        print("✅ class_personal:", class_personal)
        print("✅ label_mapping keys:", label_mapping.keys())  # จะเห็น ['Status_personal']
        status_mapping = label_mapping.get("Status_personal", {})

        # ✅ แปลงจาก string เป็น index ด้วย label_mapping
        print(label_mapping)
        if class_personal in status_mapping:
            pred_class = status_mapping[class_personal]
        else:
            return {"error": f"Status_personal '{class_personal}' ไม่อยู่ใน label_mapping"}
        print(pred_class)
        patient_data_filtered = {k: patient_data[k] for k in feature_columns}
        patient_df = pd.DataFrame([patient_data_filtered])

        for col in feature_columns:
            dtype = patient_df[col].dtype

            try:
                # ✅ แปลง "True"/"False" string → 1/0 ก่อนเข้า model
                patient_df[col] = patient_df[col].astype(str).str.strip().str.lower()

                if patient_df[col].isin(["true", "false"]).all():
                    patient_df[col] = patient_df[col].map({"true": 1, "false": 0})

                elif col in label_mappings_json:
                    mapping = label_mappings_json[col]["mapping"]
                    patient_df[col] = patient_df[col].map(mapping)

                else:
                    patient_df[col] = pd.to_numeric(patient_df[col], errors="coerce").fillna(0).astype(int)

            except Exception as e:
                print(f"⚠️ แปลง {col} ไม่ได้: {e} → ข้าม")
        print(patient_df)

        patient_df = patient_df.astype(float)
        X_scaled = pd.DataFrame(scaler.transform(patient_df), columns=feature_columns)

        # ✅ เรียก TreeExplainer
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(X_scaled, check_additivity=False)

        print(X_scaled)
        print("✅ shap_values.shape:", shap_values.shape)
        print("✅ type:", type(shap_values))

        # 🔁 สลับ shape → จาก (1, 42, 6) เป็น (1, 6, 42)
        shap_values.values = shap_values.values.transpose(0, 2, 1)
        shap_values.base_values = shap_values.base_values.transpose(0, 1)

        # ✅ สร้าง shap explanation object ของเด็กคนนั้น
        shap_row = shap.Explanation(
            values=shap_values.values[0, pred_class],  # ← class เด็กคนนั้น เช่น SAM = 3
            base_values=shap_values.base_values[0, pred_class],
            data=shap_values.data[0],
            feature_names=shap_values.feature_names
        )

        print("✅ values shape:", shap_values.values.shape)
        print("✅ base_values shape:", shap_values.base_values.shape)
        print("✅ feature_names:", shap_values.feature_names)
        # ✅ แสดง waterfall plot

        

        # ✅ คืนค่าจาก StandardScaler → ค่าเดิม
        # scaler.mean_ และ scaler.scale_ มีค่าเท่ากับค่าเฉลี่ยและสเกลที่ใช้ตอน train

        # ✅ สร้างแถวเดียวของข้อมูลที่ถูก scale
        scaled_row = X_scaled.values[0].reshape(1, -1)

        # ✅ คืนค่าจาก scaler → original (ก่อน normalize)
        original_row = scaler.inverse_transform(scaled_row)[0]  # → array 1 มิติ

        # ✅ รวมข้อมูล shap แต่ละ feature
        top_shap_per_feature = []
        for i, feature_name in enumerate(shap_row.feature_names):
            top_shap_per_feature.append({
                "feature": feature_name,
                "value": float(scaled_row[0][i]),   # ค่าหลัง preprocess (input model)
                "real_value": int(original_row[i] + 0.5),               # ค่าที่ invert จาก StandardScaler
                "shap": float(shap_row.values[i])                   # SHAP value
            })
        top_shap_per_feature = sorted(top_shap_per_feature, key=lambda x: x["shap"], reverse=True)
        return {
            "shap_class": int(pred_class),
            "top_features": top_shap_per_feature
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}