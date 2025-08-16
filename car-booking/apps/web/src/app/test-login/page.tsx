"use client"

export default function TestLoginPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Login Page</h1>
      <p>This is a test page without auth session check.</p>
      <form>
        <div>
          <label>Email:</label>
          <input type="email" />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}