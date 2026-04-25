import { useState } from "react";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

export function AuthScreen() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e12] p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-card border border-border animate-slide-up">
        {mode === "signIn" ? (
          <SignInForm onToggle={() => setMode("signUp")} />
        ) : (
          <SignUpForm onToggle={() => setMode("signIn")} />
        )}
      </div>
    </div>
  );
}
