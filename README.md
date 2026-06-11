# Explainable AI System for Toddler Malnutrition Risk Prediction
[![React](https://img.shields.io/badge/Frontend-React-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Framework-Express.js-lightgrey)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL-orange?logo=mysql)](https://www.mysql.com/)
[![Python](https://img.shields.io/badge/AI%2FML-Python-yellow?logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

## Project Overview
[cite_start]This project is a web application prototype designed to predict and assess the risk of malnutrition in toddlers using an **Explainable Artificial Intelligence (XAI)** model[cite: 58]. 

[cite_start]The system leverages the Open Data from the Wellness and Agriculture for Life Advancement (WALA) Project (data from 214,974 households in Malawi) to train an **Extra Trees Classifier** machine learning model, achieving a high accuracy of **96.50%**[cite: 50, 51, 59, 61]. [cite_start]To ensure medical transparency, the system integrates **SHAP (SHapley Additive exPlanations)** to interpret the model's predictions, helping medical personnel understand the underlying features contributing to the risk[cite: 155].

## Key Features

[cite_start]The application supports 3 main user roles[cite: 118]:

### 1.Parents (ผู้ปกครอง)
* [cite_start]**Authentication:** Secure login using Hospital Number (HN) and OTP[cite: 121].
* [cite_start]**Health Assessment:** Input toddler's data (weight, height, dietary habits, hygiene) to receive real-time malnutrition risk evaluations (e.g., Normal vs. Should see a doctor)[cite: 123, 124, 125, 128, 509].
* [cite_start]**Recommendations:** View personalized dietary and care guidelines[cite: 136].

### 2. Medical Personnel (บุคลากรทางการแพทย์)
* [cite_start]**Assessment Review:** Access patients' assessment results and historical health trends (BMI, weight, height charts)[cite: 139, 144, 519].
* [cite_start]**AI Explanations (XAI):** View detailed SHAP analyses showing which behavioral or health features most heavily influence the toddler's malnutrition risk[cite: 155, 454].
* [cite_start]**Medical Recommendations:** Add and edit diagnostic notes and provide direct advice to parents[cite: 143, 509].

### 3. Administrator (ผู้ดูแลระบบ)
* [cite_start]**User Management:** Add, edit, and delete user profiles (Parents, Doctors) via HN[cite: 147, 501].
* [cite_start]**Relationship Management:** Map family relationships between parents and toddlers[cite: 149, 502].

##  Tech Stack

### Frontend
* [cite_start]**Framework:** React.js (Single Page Application) [cite: 1210]
* [cite_start]**Routing & HTTP:** React Router DOM, Axios [cite: 1213]
* [cite_start]**Data Visualization:** Chart.js, Plotly.js, Recharts (for health trends & SHAP values) [cite: 1213]
* [cite_start]**UI Components:** React-icons, React-modal [cite: 1213]

### Backend
* [cite_start]**Runtime & Framework:** Node.js, Express.js (RESTful API) [cite: 1218, 1221]
* [cite_start]**Middleware:** CORS, Body-parser [cite: 1218, 1221]
* [cite_start]**Database:** MySQL (using `mysql2` package for connection) [cite: 1218, 1221]

### Machine Learning & AI
* [cite_start]**Language & API:** Python, FastAPI [cite: 157, 185]
* [cite_start]**Libraries:** Scikit-learn, Pandas, NumPy, SMOTE [cite: 184, 1063]
* [cite_start]**Model:** Extra Trees Classifier [cite: 51]
* [cite_start]**Explainable AI:** SHAP [cite: 185, 298]

## System Architecture
1.  **Frontend (React):** Handles user interactions, data input, and displays health dashboards/charts.
2.  [cite_start]**Backend (Node.js/Express):** Manages authentication, database queries (MySQL), and business logic[cite: 1218].
3.  **ML API (FastAPI):** Exposes the trained Extra Trees model and SHAP explainer as an endpoint. [cite_start]The Node.js backend communicates with this FastAPI service to retrieve real-time predictions and explanations[cite: 157].

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

### 3.Backend (Node.js)
```bash
cd backend
npm install
npm start

### 4.Frontend (React)
```bash
cd frontend
npm install
npm start

## Developers
* Natchapon Tonganant
