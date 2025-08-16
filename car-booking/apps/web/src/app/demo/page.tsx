'use client';

import { useState } from "react";

export default function DemoApp() {
  const [currentPage, setCurrentPage] = useState("login");
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    setUser({ name: "Demo User", role: "Employee" });
    setCurrentPage("my-bookings");
  };

  if (currentPage === "login") {
    return (
      <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Car Booking System - Login</h1>
        <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "8px" }}>
          <h2>Demo Login</h2>
          <button 
            onClick={handleLogin}
            style={{ 
              padding: "10px 20px", 
              background: "#4CAF50", 
              color: "white", 
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Login as Employee
          </button>
          <p style={{ marginTop: "10px", color: "#666" }}>
            Click to simulate login and see navigation flow
          </p>
        </div>
      </div>
    );
  }

  if (currentPage === "my-bookings") {
    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>My Bookings Page</h1>
        <div style={{ background: "#f0f0f0", padding: "20px", borderRadius: "8px" }}>
          <p>Welcome, {user?.name}\!</p>
          <p>Role: {user?.role}</p>
          <div style={{ marginTop: "20px" }}>
            <button 
              onClick={() => setCurrentPage("car-booking")}
              style={{ 
                padding: "15px 30px", 
                background: "#2196F3", 
                color: "white", 
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "18px",
                marginRight: "10px"
              }}
            >
              New Booking → Go to Car Booking Page
            </button>
            <button 
              onClick={() => {
                setUser(null);
                setCurrentPage("login");
              }}
              style={{ 
                padding: "10px 20px", 
                background: "#f44336", 
                color: "white", 
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div style={{ marginTop: "20px", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h3>Your Previous Bookings</h3>
          <p style={{ color: "#666" }}>(List of bookings would appear here)</p>
        </div>
      </div>
    );
  }

  if (currentPage === "car-booking") {
    return (
      <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ background: "#e3f2fd", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          <button 
            onClick={() => setCurrentPage("my-bookings")}
            style={{ 
              padding: "8px 15px", 
              background: "#1976d2", 
              color: "white", 
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "20px"
            }}
          >
            ← Back to My Bookings
          </button>
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>
            CAR BOOKING PAGE
          </span>
        </div>
        
        <div style={{ background: "white", padding: "30px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h1 style={{ color: "#1976d2" }}>Create New Car Booking</h1>
          
          <div style={{ marginTop: "20px" }}>
            <h3>Booking Form</h3>
            <div style={{ display: "grid", gap: "15px", marginTop: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>Destination:</label>
                <input type="text" placeholder="Enter destination" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>Start Date:</label>
                <input type="date" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>End Date:</label>
                <input type="date" style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px" }}>Vehicle Type:</label>
                <select style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}>
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Van</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  alert("Booking submitted successfully\!\n\nIn the full app, this would:\n1. Submit to backend\n2. Go through approval workflow\n3. Show in My Bookings");
                  setCurrentPage("my-bookings");
                }}
                style={{ 
                  padding: "12px 30px", 
                  background: "#4CAF50", 
                  color: "white", 
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginTop: "10px"
                }}
              >
                Submit Booking
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: "20px", padding: "20px", background: "#fff3e0", borderRadius: "8px" }}>
          <h4>Navigation Flow:</h4>
          <ol>
            <li>Login Page → User logs in</li>
            <li>My Bookings Page → User clicks "New Booking"</li>
            <li><strong>Car Booking Page (Current) → User fills form and submits</strong></li>
            <li>Approval Workflow → Booking goes through approval</li>
          </ol>
        </div>
      </div>
    );
  }

  return null;
}