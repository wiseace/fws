import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Crown } from 'lucide-react';
import { User } from '@/types/database';

interface SubscriptionCountdownProps {
  profile: User;
}

interface TimeRemaining {
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export const SubscriptionCountdown = ({ profile }: SubscriptionCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  const calculateTimeRemaining = (): TimeRemaining => {
    if (!profile.subscription_expiry || profile.subscription_plan === 'free') {
      return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const expiryDate = new Date(profile.subscription_expiry);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    const weeks = Math.floor(remainingDays / 7);
    const finalDays = remainingDays % 7;

    return {
      months,
      weeks,
      days: finalDays,
      hours,
      minutes,
      seconds,
      expired: false
    };
  };

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining());
    };

    updateTimer(); // Initial calculation
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [profile.subscription_expiry, profile.subscription_plan]);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'monthly': return 'from-blue-500 to-blue-600';
      case 'semi_annual': return 'from-purple-500 to-purple-600';
      case 'yearly': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'yearly': return <Crown className="h-5 w-5 text-amber-200" />;
      default: return <Calendar className="h-5 w-5 text-white/80" />;
    }
  };

  const getUrgencyClass = () => {
    const totalDays = timeRemaining.months * 30 + timeRemaining.weeks * 7 + timeRemaining.days;
    if (totalDays <= 7) return 'animate-pulse border-red-300 shadow-red-200';
    if (totalDays <= 30) return 'border-amber-300 shadow-amber-200';
    return 'border-green-300 shadow-green-200';
  };

  const getProgressPercentage = () => {
    const totalDays = timeRemaining.months * 30 + timeRemaining.weeks * 7 + timeRemaining.days;
    const maxDays = profile.subscription_plan === 'yearly' ? 365 : 
                   profile.subscription_plan === 'semi_annual' ? 180 : 30;
    return Math.max(0, Math.min(100, (totalDays / maxDays) * 100));
  };

  if (profile.subscription_plan === 'free' || timeRemaining.expired) {
    return (
      <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-gray-500" />
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              Free Plan
            </Badge>
          </div>
          <p className="text-gray-600 text-sm">
            Upgrade to a premium plan to unlock all features
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 shadow-lg transition-all duration-300 ${getUrgencyClass()}`}>
      <CardHeader className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} text-white rounded-t-lg`}>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {getPlanIcon(profile.subscription_plan)}
            <span className="capitalize">{profile.subscription_plan} Plan</span>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-white/20 text-white border-white/30 font-semibold"
          >
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Time Remaining</p>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {timeRemaining.months > 0 && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-3 mb-1">
                  <div className="text-2xl font-bold">{timeRemaining.months}</div>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Month{timeRemaining.months !== 1 ? 's' : ''}
                </div>
              </div>
            )}
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-3 mb-1">
                <div className="text-2xl font-bold">{timeRemaining.days}</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                Day{timeRemaining.days !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Real-time countdown for smaller units */}
          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md p-2 mb-1">
                <div className="text-lg font-bold">{String(timeRemaining.hours).padStart(2, '0')}</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Hours</div>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md p-2 mb-1">
                <div className="text-lg font-bold">{String(timeRemaining.minutes).padStart(2, '0')}</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Minutes</div>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md p-2 mb-1 animate-pulse">
                <div className="text-lg font-bold">{String(timeRemaining.seconds).padStart(2, '0')}</div>
              </div>
              <div className="text-xs text-muted-foreground font-medium">Seconds</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {profile.subscription_expiry && (
            <p className="text-xs text-muted-foreground">
              Expires on {new Date(profile.subscription_expiry).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Warning for expiring subscriptions */}
        {(timeRemaining.months * 30 + timeRemaining.weeks * 7 + timeRemaining.days) <= 7 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-red-700 text-sm font-medium">
              ⚠️ Your subscription expires soon!
            </p>
            <p className="text-red-600 text-xs mt-1">
              Renew now to continue enjoying premium features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};