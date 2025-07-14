
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { PasswordValidator, isPasswordValid } from '@/components/PasswordValidator';
import { Link } from 'react-router-dom';

const Auth = () => {
  const { signIn, signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
  // Sign up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [userType, setUserType] = useState<'provider' | 'seeker'>('seeker');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showPasswordValidator, setShowPasswordValidator] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      if (profile.user_type === 'admin') {
        window.location.href = '/admin';
      } else {
        // Redirect all users (providers and seekers) to their dashboard
        window.location.href = '/dashboard';
      }
    }
  }, [user, profile]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await signIn(signInEmail, signInPassword);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
      } else {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully."
        });
        // Don't redirect here, let useEffect handle it based on user type
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid(signUpPassword)) {
      toast({
        title: "Invalid password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp(signUpEmail, signUpPassword, signUpName, userType);
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Please check your email to verify your account."
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full blur-xl animate-bounce-subtle"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full blur-xl animate-bounce-subtle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-white rounded-full blur-xl animate-bounce-subtle" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md backdrop-blur-lg bg-white/90 border-white/20 shadow-2xl animate-fade-in-up">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary animate-pulse-glow" />
              <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                FINDWHOSABI
              </CardTitle>
            </div>
            <p className="text-muted-foreground">Connect with skilled professionals</p>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Link>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="transition-all">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="transition-all">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-12 border-2 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? "text" : "password"}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-12 border-2 focus:border-primary transition-colors pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all transform hover:scale-[1.02] font-semibold" 
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 border-2 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-12 border-2 focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        onFocus={() => setShowPasswordValidator(true)}
                        placeholder="Create a strong password"
                        className="h-12 border-2 focus:border-primary transition-colors pr-12"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 h-8 w-8 p-0"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <PasswordValidator 
                      password={signUpPassword} 
                      isVisible={showPasswordValidator}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">I am a:</Label>
                    <RadioGroup 
                      value={userType} 
                      onValueChange={(value: 'provider' | 'seeker') => setUserType(value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="seeker" id="seeker" />
                        <Label htmlFor="seeker" className="cursor-pointer">Service Seeker</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="provider" id="provider" />
                        <Label htmlFor="provider" className="cursor-pointer">Service Provider</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all transform hover:scale-[1.02] font-semibold" 
                    disabled={loading || !isPasswordValid(signUpPassword)}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
