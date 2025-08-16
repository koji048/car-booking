"use client"

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthTestPage() {
  const router = useRouter();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("");

  const handleSignIn = async () => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });
      setMessage(`Sign in successful! User: ${result.data?.user?.name}`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error: any) {
      setMessage(`Sign in failed: ${error.message}`);
    }
  };

  const handleSignUp = async () => {
    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: "Test User",
      });
      setMessage(`Sign up successful! User: ${result.data?.user?.name}`);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error: any) {
      setMessage(`Sign up failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginTop: "20px" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{ marginRight: "10px", padding: "5px" }}
        />
      </div>
      
      <div style={{ marginTop: "10px" }}>
        <button onClick={handleSignIn} style={{ marginRight: "10px", padding: "5px 10px" }}>
          Test Sign In
        </button>
        <button onClick={handleSignUp} style={{ padding: "5px 10px" }}>
          Test Sign Up
        </button>
      </div>
      
      {message && (
        <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f0f0f0" }}>
          {message}
        </div>
      )}
    </div>
  );
}