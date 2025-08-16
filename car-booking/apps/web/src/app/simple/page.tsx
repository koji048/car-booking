'use client';

import { LoginPage } from "@/components/LoginPage";

export default function SimplePage() {
  const handleLogin = (user: any) => {
    console.log("User logged in:", user);
    alert(`Welcome ${user.name}\! Role: ${user.role}`);
  };

  return <LoginPage onLogin={handleLogin} />;
}
EOF < /dev/null