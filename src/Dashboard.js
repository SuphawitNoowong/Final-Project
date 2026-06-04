import React from "react";
import { useLocation } from "react-router-dom";
import "./styles.css";

function Dashboard() {
  const location = useLocation();
  const userRole = location.state?.role || "Parent";

  return (
    <div className="dashboard-container">
      <h1>{userRole} Dashboard</h1>
      <p>Welcome to the {userRole} section!</p>
    </div>
  );
}

export default Dashboard;
