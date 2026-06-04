import shap
import pandas as pd
import pickle
import numpy as np
from fastapi import APIRouter
import joblib
import json
from joblib import load
from sklearn.preprocessing import LabelEncoder
import matplotlib.pyplot as plt
from scipy.stats import mode

router = APIRouter()

# ✅ โหลด model, columns, mapping และ CSV
try:
    model = joblib.load("src/model/best_model.joblib")
    with open("src/model/columns.pkl", "rb") as f:
        feature_columns = pickle.load(f)
    with open("src/model/label_mappings.json", "r", encoding="utf-8") as f:
        label_mappings_json = json.load(f)    
    with open("src/model/mapping.pkl", "rb") as f:
        label_mapping = pickle.load(f)
 
    df = pd.read_csv("src/data/Real_Child_malnutrition.csv")
    scaler = load("src/model/scaler.joblib")
    print("✅ scaler type:", type(scaler))

    df["Status_personal"] = df["Status_personal"].astype(str).str.strip()
    print("✅ Loaded model and dataset successfully")
except Exception as e:
    print("❌ ERROR while loading model or data:", e)
    raise e

@router.get("/only/normal")
def explain_normal_standard():
    try:
        X = df[feature_columns].copy()

        for col in feature_columns:
            dtype = X[col].dtype

            if dtype == "object":
                try:
                    if col in label_mappings_json:
                        mapping = label_mappings_json[col]["mapping"]
                        X[col] = X[col].astype(str).str.lower().map(mapping)
                    else:
                        print(f"⚠️ ข้าม {col} เพราะไม่มี mapping")
                        continue  # ✅ ข้ามไปยัง column ถัดไป
                except Exception as e:
                    print(f"⚠️ แปลง {col} ไม่ได้: {e} → ข้าม")
                    continue  # ✅ ข้ามไปยัง column ถัดไป
                   
            else:
                # ✅ แปลง boolean และ numeric ให้เป็น int ก่อน scale
                try:
                    X[col] = X[col].astype(int)
                except Exception as e:
                    print(f"⚠️ แปลง {col} เป็น int ไม่ได้: {e} → ข้าม")

        # ✅ แปลงทุก column เป็น float ก่อนเข้า scaler
        X = X.astype(float)
        

        # ✅ ทำ StandardScaler
        X_scaled = pd.DataFrame(scaler.transform(X), columns=feature_columns)

        # ✅ อธิบายด้วย SHAP
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(X_scaled, check_additivity=False)
    
        shap_values_class0 = shap.Explanation(
            values=shap_values.values[:, :, 0],
            base_values=shap_values.base_values[:, 0],
            data=shap_values.data,
            feature_names=shap_values.feature_names
        )
        
        # ✅ คืนค่า top feature
        top_shap_per_feature = []
        for i, feature in enumerate(shap_values_class0.feature_names):
            shap_col = shap_values_class0.values[:, i]
            max_idx = np.argmax(shap_col)
            scaled_row = shap_values_class0.data[max_idx].reshape(1, -1)
            original_row = scaler.inverse_transform(scaled_row)[0]

            top_shap_per_feature.append({
                "feature": feature,
                "max_shap": float(shap_col[max_idx]),
                "real_value": float(scaled_row[0][i]),
                "real_value_original": int(original_row[i] + 0.5),
                "row_index": int(max_idx)
            })

        return {
            "shap_class": 0,
            "top_features": top_shap_per_feature
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}




@router.get("/global/{status}")
def explain_global(status: str):
    try:
        print("📌 Status ที่รับมา:", status)

        # ✅ โหลด mapping ของ Status_personal
        status_mapping = label_mapping.get("Status_personal", {})
        print("✅ Mapping ของ Status_personal:", status_mapping)

        # ✅ แปลง status ที่รับเข้ามาเป็นค่าที่ใช้ใน model (int)
        class_personal = status.strip()
        if class_personal in status_mapping:
            pred_class = int(status_mapping[class_personal])
            print("✅ class_personal:", class_personal)
            print("✅ แปลงแล้วเป็นค่า:", pred_class)
        else:
            return {
                "error": f"ค่า Status_personal '{class_personal}' ไม่อยู่ใน label_mapping",            
            }


        X = df[feature_columns].copy()

        for col in feature_columns:
            dtype = X[col].dtype

            if dtype == "object":
                try:
                    if col in label_mappings_json:
                        mapping = label_mappings_json[col]["mapping"]
                        X[col] = X[col].astype(str).str.lower().map(mapping)
                    else:
                        print(f"⚠️ ข้าม {col} เพราะไม่มี mapping")
                        continue  # ✅ ข้ามไปยัง column ถัดไป
                except Exception as e:
                    print(f"⚠️ แปลง {col} ไม่ได้: {e} → ข้าม")
                    continue  # ✅ ข้ามไปยัง column ถัดไป
                   
            else:
                # ✅ แปลง boolean และ numeric ให้เป็น int ก่อน scale
                try:
                    X[col] = X[col].astype(int)
                except Exception as e:
                    print(f"⚠️ แปลง {col} เป็น int ไม่ได้: {e} → ข้าม")

        # ✅ แปลงทุก column เป็น float ก่อนเข้า scaler
        X = X.astype(float)
        

        # ✅ ทำ StandardScaler
        X_scaled = pd.DataFrame(scaler.transform(X), columns=feature_columns)

         # ✅ อธิบายด้วย SHAP
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(X_scaled, check_additivity=False)

        shap_values_status = shap.Explanation(
            values=shap_values.values[:, :, pred_class],
            base_values=shap_values.base_values[:, pred_class],
            data=shap_values.data,
            feature_names=shap_values.feature_names
        )
        
        rows = []
        shap_values_array = shap_values_status.values
        feature_values_array = shap_values_status.data
        feature_names = shap_values_status.feature_names

        for i, name in enumerate(feature_names):
            shap_vals = shap_values_array[:, i]
            feature_vals = feature_values_array[:, i]
            
            print("feature_names=",feature_names)
            # ✅ คำนวณ Q1 และ Q3
            q1 = np.percentile(shap_vals, 25)
            q3 = np.percentile(shap_vals, 75)
            print("q1=",q1)
            print("q3=",q3)
            # ✅ เลือกเฉพาะค่าที่อยู่ใน IQR
            mask = (shap_vals >= q1) & (shap_vals <= q3)
            filtered_feature_vals = feature_vals[mask]
            filtered_shap_vals = shap_vals[mask]

            if len(filtered_feature_vals) == 0:
                rows.append({
                    "feature": name,
                    "mode_in_IQR": None,
                    "mean_shap_at_mode": None,
                    "count_at_mode": 0
                })
                continue

            # ✅ หาค่า mode
            mode_result = mode(filtered_feature_vals, keepdims=False)
            mode_val = mode_result.mode
            # print(mode_val)
            if isinstance(mode_val, np.ndarray):
                mode_val = mode_val.item() if mode_val.size > 0 else None

            count_mode = np.sum(filtered_feature_vals == mode_val)
            # print(count_mode)
            # ✅ คำนวณ mean SHAP ของค่าที่ตรงกับ mode
            shap_in_mode = filtered_shap_vals[filtered_feature_vals == mode_val]
            mean_shap_in_mode = shap_in_mode.mean() if len(shap_in_mode) > 0 else None

            # ✅ เตรียม array ขนาด 1xN เพื่อ inverse ค่า mode_val
            scaled_input = np.zeros((1, len(feature_names)))
            if mode_val is not None:
                scaled_input[0, i] = mode_val
                original_input = scaler.inverse_transform(scaled_input)
                original_mode_val = original_input[0, i]
            else:
                original_mode_val = None
            print(original_mode_val)
            rows.append({
                "feature": str(name),
                "mode_in_IQR": int(original_mode_val + 0.5) ,
                "mean_shap_at_mode": float(mean_shap_in_mode) ,
                "count_at_mode": int(count_mode) 
            })
        # ✅ เรียงลำดับจาก SHAP เฉลี่ยสูงสุด
        rows = sorted(rows, key=lambda x: (x["mean_shap_at_mode"]), reverse=True)

        return {
            "shap_class": pred_class,
            "summary_by_feature": rows
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@router.get("/global/most/{status}")
def explain_global_most(status: str):
    try:
        print("📌 Status ที่รับมา:", status)

        # ✅ โหลด mapping ของ Status_personal
        status_mapping = label_mapping.get("Status_personal", {})
        print("✅ Mapping ของ Status_personal:", status_mapping)

        # ✅ แปลง status ที่รับเข้ามาเป็นค่าที่ใช้ใน model (int)
        class_personal = status.strip()
        if class_personal in status_mapping:
            pred_class = int(status_mapping[class_personal])
            print("✅ class_personal:", class_personal)
            print("✅ แปลงแล้วเป็นค่า:", pred_class)
        else:
            return {
                "error": f"ค่า Status_personal '{class_personal}' ไม่อยู่ใน label_mapping",            
            }


        X = df[feature_columns].copy()

        for col in feature_columns:
            dtype = X[col].dtype

            if dtype == "object":
                try:
                    if col in label_mappings_json:
                        mapping = label_mappings_json[col]["mapping"]
                        X[col] = X[col].astype(str).str.lower().map(mapping)
                    else:
                        print(f"⚠️ ข้าม {col} เพราะไม่มี mapping")
                        continue  # ✅ ข้ามไปยัง column ถัดไป
                except Exception as e:
                    print(f"⚠️ แปลง {col} ไม่ได้: {e} → ข้าม")
                    continue  # ✅ ข้ามไปยัง column ถัดไป
                   
            else:
                # ✅ แปลง boolean และ numeric ให้เป็น int ก่อน scale
                try:
                    X[col] = X[col].astype(int)
                except Exception as e:
                    print(f"⚠️ แปลง {col} เป็น int ไม่ได้: {e} → ข้าม")

        # ✅ แปลงทุก column เป็น float ก่อนเข้า scaler
        X = X.astype(float)
        

        # ✅ ทำ StandardScaler
        X_scaled = pd.DataFrame(scaler.transform(X), columns=feature_columns)

        # ✅ อธิบายด้วย SHAP
        explainer = shap.TreeExplainer(model)
        shap_values = explainer(X_scaled, check_additivity=False)
    
        shap_values_most = shap.Explanation(
            values=shap_values.values[:, :, pred_class],
            base_values=shap_values.base_values[:, pred_class],
            data=shap_values.data,
            feature_names=shap_values.feature_names
        )
        
        # ✅ คืนค่า top feature
        top_shap_per_feature = []
        for i, feature in enumerate(shap_values_most.feature_names):
            shap_col = shap_values_most.values[:, i]
            max_idx = np.argmax(shap_col)
            scaled_row = shap_values_most.data[max_idx].reshape(1, -1)
            original_row = scaler.inverse_transform(scaled_row)[0]

            top_shap_per_feature.append({
                "feature": feature,
                "max_shap": float(shap_col[max_idx]),
                "real_value": float(scaled_row[0][i]),
                "real_value_original": int(original_row[i] + 0.5),
                "row_index": int(max_idx)
            })

        return {
            "shap_class": pred_class,
            "top_features": top_shap_per_feature
        }
        

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
__all__ = ["router"]