# Explainable AI System for Toddler Malnutrition Risk Prediction
[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-lightgrey)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange?logo=mysql)](https://www.mysql.com/)
[![Python](https://img.shields.io/badge/AI%2FML-Python-yellow?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

## Project Overview
This project is a web application prototype designed to predict and assess the risk of malnutrition in toddlers using an **Explainable Artificial Intelligence (XAI)** model. 

The system leverages the Open Data from the Wellness and Agriculture for Life Advancement (WALA) Project (data from 214,974 households in Malawi) to train an **Extra Trees Classifier** machine learning model, achieving a high accuracy of **96.50%**. To ensure medical transparency, the system integrates **SHAP (SHapley Additive exPlanations)** to interpret the model's predictions, helping medical personnel understand the underlying features contributing to the risk.

## Key Features

The application supports 3 main user roles:

### 1.Parents (ผู้ปกครอง)
* **Authentication:** Secure login using Hospital Number (HN) and OTP.
* **Health Assessment:** Input toddler's data (weight, height, dietary habits, hygiene) to receive real-time malnutrition risk evaluations (e.g., Normal vs. Should see a doctor).
* **Recommendations:** View personalized dietary and care guidelines.

### 2. Medical Personnel (บุคลากรทางการแพทย์)
* **Assessment Review:** Access patients' assessment results and historical health trends (BMI, weight, height charts).
* **AI Explanations (XAI):** View detailed SHAP analyses showing which behavioral or health features most heavily influence the toddler's malnutrition risk.
* **Medical Recommendations:** Add and edit diagnostic notes and provide direct advice to parents.

### 3. Administrator (ผู้ดูแลระบบ)
* **User Management:** Add, edit, and delete user profiles (Parents, Doctors) via HN.
* **Relationship Management:** Map family relationships between parents and toddlers.

##  Tech Stack

### Frontend
* **Framework:** React.js (Single Page Application) 
* **Routing & HTTP:** React Router DOM, Axios
* **Data Visualization:** Chart.js, Plotly.js, Recharts (for health trends & SHAP values) 
* **UI Components:** React-icons, React-modal 

### Backend
* **Runtime & Framework:** Node.js, Express.js (RESTful API) 
* **Middleware:** CORS, Body-parser 
* **Database:** MySQL (using `mysql2` package for connection)

### Machine Learning & AI
* **Language & API:** Python, FastAPI 
* **Libraries:** Scikit-learn, Pandas, NumPy, SMOTE 
* **Model:** Extra Trees Classifier 
* **Explainable AI:** SHAP
## System Architecture
1.  **Frontend (React):** Handles user interactions, data input, and displays health dashboards/charts.
2.  **Backend (Node.js/Express):** Manages authentication, database queries (MySQL), and business logic.
3.  **ML API (FastAPI):** Exposes the trained Extra Trees model and SHAP explainer as an endpoint. The Node.js backend communicates with this FastAPI service to retrieve real-time predictions and explanations.

## Local Setup & Installation

*(Note to developer: Add your specific `.env` variables or port configurations here)*

### 1.Database Setup
* Install MySQL.
* Import the database schema using the provided `.sql` file in the `/database` folder.

### 2.Machine Learning API (FastAPI)
```bash
cd ml-api
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3.Backend (Node.js)
```bash
cd backend
npm install
npm start
```

### 4.Frontend (React)
```bash
cd frontend
npm install
npm start
```

## Developers
* Supphawit Noowong
* Natchapon Tonganant
* Pruettapon Paritsiraprapa

