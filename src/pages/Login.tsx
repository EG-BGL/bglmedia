import Layout from '@/components/layout/Layout';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [facebookName, setFacebookName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gamertag, setGamertag] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          facebook_name: facebookName || undefined,
          birth_year: birthYear ? parseInt(birthYear) : undefined,
          gamertag: gamertag || undefined,
        });
        if (error) toast.error(error.message);
        else toast.success('Check your email to confirm.');
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Signed in!');
          navigate('/portal');
          return;
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
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-black tracking-tight">{isSignUp ? 'Create Account' : 'Sign In'}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isSignUp ? 'Create your coach or admin account' : 'Access the coach or admin portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName" className="text-xs font-bold">First Name *</Label>
                    <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-xs font-bold">Last Name *</Label>
                    <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Smith" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="facebookName" className="text-xs font-bold">Facebook Name</Label>
                  <Input id="facebookName" value={facebookName} onChange={e => setFacebookName(e.target.value)} placeholder="Your Facebook display name" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="birthYear" className="text-xs font-bold">Birth Year</Label>
                    <Input id="birthYear" type="number" min="1940" max={new Date().getFullYear()} value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="1990" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
                  </div>
                  <div>
                    <Label htmlFor="gamertag" className="text-xs font-bold">PSN / Gamertag / Steam</Label>
                    <Input id="gamertag" value={gamertag} onChange={e => setGamertag(e.target.value)} placeholder="YourTag123" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email" className="text-xs font-bold">Email (Must be active) *</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="coach@example.com" className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-bold">Password *</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className="mt-1 h-11 rounded-xl bg-secondary/40 border-border/40" />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" disabled={loading}>
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