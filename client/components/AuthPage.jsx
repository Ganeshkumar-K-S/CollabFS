import React from "react";
import TextContent from "./TextContent";
import Login_Signup from "./Login_Signup";

export default function AuthPage({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isSignup,
  setIsSignup,
}) {
  return (
    <div className="min-h-screen text-black px-4 py-2 flex flex-col items-center justify-center gap-12 max-w-4xl mx-auto">
      
      {/* Text content (always on top) */}
      <div className="w-full max-w-2xl flex justify-center">
        <TextContent />
      </div>

      {/* Login / Signup form (always below) */}
      <div className="w-full max-w-3xl flex justify-center">
        <Login_Signup
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          isSignup={isSignup}
          setIsSignup={setIsSignup}
        />
      </div>
    </div>
  );
}
