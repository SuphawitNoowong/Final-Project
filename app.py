from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from joblib import load
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
import os
import warnings
import sys

sys.path.append(".")

from shap_explain import shap_local, shap_global

warnings.filterwarnings("ignore", category=FutureWarning)

app = FastAPI(title="Child Nutrition Prediction API", version="1.0")


from fastapi.middleware.cors import CORSMiddleware
# ✅ ใส่ allow_origins ให้ตรง React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(shap_local.router)
app.include_router(shap_global.router, prefix="/shap")

# ✅ Static
if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

# ✅ Load model + metadata
try:
    model = load("src/model/best_model.joblib")
    columns = load('src/model/columns.pkl')
    mapping = load('src/model/mapping.pkl')
    print("✅ Model and metadata loaded successfully")
    print(type(model))

    if hasattr(model, "feature_names_in_"):
        print("🧠 Model trained with features:", model.feature_names_in_)
except Exception as e:
    print(f"❌ Load error: {e}")
    model = None
    columns = []
    mapping = {}

# ✅ Fit scaler
scaler = None
try:
    df_raw = pd.read_csv("src/data/Real_Child_malnutrition.csv")
    df_features = df_raw[columns]

    for col in columns:
        if col in mapping:
            df_features[col] = df_features[col].map(mapping[col])

    df_features = df_features.replace({'yes': 1, 'no': 0, 'Yes': 1, 'No': 0})

    if 'Number_of_Times_Eaten_Solid_Food' in df_features:
        df_features['Number_of_Times_Eaten_Solid_Food'] = df_features[
            'Number_of_Times_Eaten_Solid_Food'].replace({
                '1-2 meals': 0,
                '3-4 meals': 1,
                'dont eat': 2,
                'more than 4 meals': 3
                
            })

    for col in df_features.columns:
        if df_features[col].dtype == object:
            print(f"⚠️ คอลัมน์ {col} ยังมี string:", df_features[col].unique()[:5])

    scaler = load("src/model/scaler.joblib")  # ใช้ path จากที่อัปโหลดมา
    print("✅ Scaler loaded from file successfully")
except Exception as e:
    print(f"❌ Scaler training error: {e}")

# ✅ Ping
@app.get("/ping")
def ping():
    return {"message": "pong"}

# ✅ Schema
from pydantic import BaseModel

class PredictionInput(BaseModel):
    Vitamin_A_Intake_First_8_Weeks: int
    Sanitary_Disposal: int
    Child_wash_hand_before_or_after_eating_food: int
    Child_wash_hand_before_or_after_visiting_the_toilet: int
    Given_Anything_to_Drink_in_First_6_Months: int
    Still_Breastfeeding: int
    Breastfeeding_Count_DayandNight: int
    Infant_Formula_Intake_Count_Yesterday: int
    Received_Animal_Milk_Count: int
    Received_Thin_Porridge: int
    Received_Grain_Based_Foods: int
    Received_Orange_Yellow_Foods: int
    Received_White_Root_Foods: int
    Received_Dark_Green_Leafy_Veggies: int
    Received_Ripe_Mangoes_Papayas: int
    Received_Meat: int
    Received_Eggs: int
    Received_Fish_Shellfish_Seafood: int
    Received_Legumes_Nuts_Foods: int
    Received_Dairy_Products: int
    Received_Oil_Fats_Butter: int
    Received_Salt: int
    Number_of_Times_Eaten_Solid_Food: int


# ✅ Predict
@app.post("/prediction")
async def get_prediction(input_data: PredictionInput):
    try:
        print("📥 ได้รับข้อมูลจาก frontend:", input_data.dict())

        if model is None:
            return {"error": "Model not loaded"}
        if scaler is None:
            return {"error": "Scaler not ready"}

        original_input = input_data.dict()

        # ✅ กรองเฉพาะ key ที่อยู่ใน columns เท่านั้น
        filtered_input = {k: v for k, v in original_input.items() if k in columns}

        # ✅ แปลงเป็น DataFrame
        df = pd.DataFrame([filtered_input], columns=columns)

        # ✅ Check feature name match
        if hasattr(model, "feature_names_in_"):
            mismatch = [col for col in df.columns if col not in model.feature_names_in_]
            if mismatch:
                print("❌ Columns mismatch:", mismatch)
            else:
                print("✅ Features names ตรงกับ model แล้ว")

        # ✅ Predict
        df_scaled = pd.DataFrame(scaler.transform(df), columns=columns)
        prediction = model.predict(df_scaled)[0]

        class_names = ['Normal', 'Obesity', 'Overweight', 'SAM', 'Stunting', 'Underweight']
        predicted_class = class_names[prediction]

        return {
            "prediction": predicted_class,
            "input_features": filtered_input
        }

    except Exception as e:
        print("❌ Error:", str(e))
        return {"error": str(e)}

@app.get("/test")
async def test():
    print("Hello")