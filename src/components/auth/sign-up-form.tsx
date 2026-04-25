import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Loader2 } from "lucide-react";

export function SignUpForm({ onToggle }: { onToggle: () => void }) {
  const { signIn } = useAuthActions();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn("password", { email, password, name, flow: "signUp" });
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0e0e12] border border-border flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 32 32" className="w-7 h-7">
            <defs>
              <linearGradient id="authGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#4da6ff" }} />
                <stop offset="100%" style={{ stopColor: "#7c3aed" }} />
              </linearGradient>
            </defs>
            <path
              d="M7 24 L7 10 Q7 8 9 8 L11 8 L11 24 Q11 25 10 25 L8 25 Q7 25 7 24Z"
              fill="url(#authGrad2)"
            />
            <path d="M11 11 L16 18 L21 11 L21 13 L16 21 L11 13Z" fill="url(#authGrad2)" />
            <path
              d="M21 8 L23 8 Q25 8 25 10 L25 24 Q25 25 24 25 L22 25 Q21 25 21 24 L21 8Z"
              fill="url(#authGrad2)"
            />
            <circle cx="10" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
            <circle cx="16" cy="4" r="1" fill="#7c3aed" opacity="0.7" />
            <circle cx="22" cy="5" r="1.5" fill="#4da6ff" opacity="0.8" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-2">Start building your knowledge base</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-secondary/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-secondary/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-secondary/50 border-border"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onToggle}
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
