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
      case 'monthly': return 'from-primary to-primary-dark';
      case 'semi_annual': return 'from-primary-light to-primary';
      case 'yearly': return 'from-secondary to-secondary-dark';
      default: return 'from-primary-light to-primary';
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'yearly': return <Crown className="h-5 w-5 text-secondary-lighter" />;
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
    <Card className={`border shadow-lg transition-all duration-300 bg-white/80 backdrop-blur-sm ${getUrgencyClass()}`}>
      <CardHeader className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} text-white rounded-t-lg py-3`}>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {getPlanIcon(profile.subscription_plan)}
            <span className="capitalize font-medium">{profile.subscription_plan} Plan</span>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-white/20 text-white border-white/30 text-xs px-2 py-1"
          >
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Time Remaining</p>
          
          {/* Countdown Timer - Dark Theme Style */}
          <div className="bg-gray-900 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-center divide-x divide-gray-600">
              {/* Days */}
              <div className="text-center px-3 first:pl-0 last:pr-0">
                <div className="text-2xl font-bold text-white">{String(timeRemaining.days).padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Days</div>
              </div>
              
              {/* Hours */}
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-white">{String(timeRemaining.hours).padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Hours</div>
              </div>
              
              {/* Minutes */}
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-white">{String(timeRemaining.minutes).padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Minutes</div>
              </div>
              
              {/* Seconds */}
              <div className="text-center px-3">
                <div className="text-2xl font-bold text-white">{String(timeRemaining.seconds).padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 mt-1">Seconds</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-2">
            <div 
              className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} h-1.5 rounded-full transition-all duration-500 shadow-sm`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {profile.subscription_expiry && (
            <p className="text-xs text-muted-foreground">
              Expires {new Date(profile.subscription_expiry).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Warning for expiring subscriptions */}
        {(timeRemaining.months * 30 + timeRemaining.weeks * 7 + timeRemaining.days) <= 7 && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-2 text-center">
            <p className="text-red-700 text-xs font-medium">
              ⚠️ Subscription expires soon!
            </p>
            <p className="text-red-600 text-xs mt-1">
              Renew to continue premium features
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};