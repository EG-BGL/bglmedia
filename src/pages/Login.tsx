import Layout from '@/components/layout/Layout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) toast.error(error.message);
        else toast.success('Check your email to confirm.');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Signed in!');
          navigate('/portal');
          return; // Don't reset loading — page is navigating
        }
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-black text-sm">SD</span>
            </div>
            <h1 className="text-xl font-black tracking-tight">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isSignUp ? 'Create your coach or admin account' : 'Access the coach or admin portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs font-bold">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="coach@example.com" className="mt-1 h-12 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-bold">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className="mt-1 h-12 rounded-xl" />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={loading}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-primary hover:underline font-semibold">
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
