import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Logo } from "#/components/ui/logo";
import { Loader2 } from "lucide-react";

export function SignInForm({ onToggle }: { onToggle: () => void }) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0e0e12] border border-border flex items-center justify-center mx-auto mb-4">
          <Logo />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-2">Sign in to your Memoria account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

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
            className="bg-secondary/50 border-border"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onToggle}
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
