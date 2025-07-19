import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordValidatorProps {
  password: string;
  isVisible: boolean;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    label: 'At least 4 letters',
    test: (password) => (password.match(/[a-zA-Z]/g) || []).length >= 4
  },
  {
    label: 'At least 1 number',
    test: (password) => /\d/.test(password)
  },
  {
    label: 'At least 1 special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export const PasswordValidator = ({ password, isVisible }: PasswordValidatorProps) => {
  if (!isVisible || !password) return null;

  // Calculate password strength percentage
  const passedRules = validationRules.filter(rule => rule.test(password)).length;
  const strengthPercentage = Math.round((passedRules / validationRules.length) * 100);
  
  // Determine strength level and color
  const getStrengthColor = () => {
    if (strengthPercentage <= 25) return 'bg-red-500';
    if (strengthPercentage <= 50) return 'bg-orange-500';
    if (strengthPercentage <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strengthPercentage <= 25) return 'Weak';
    if (strengthPercentage <= 50) return 'Fair';
    if (strengthPercentage <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="mt-2 p-3 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-foreground">Password strength:</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${strengthPercentage <= 25 ? 'text-red-600' : 
            strengthPercentage <= 50 ? 'text-orange-600' : 
            strengthPercentage <= 75 ? 'text-yellow-600' : 'text-green-600'}`}>
            {getStrengthText()}
          </span>
          <span className="text-xs text-muted-foreground">
            {strengthPercentage}%
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strengthPercentage}%` }}
        ></div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">Requirements:</p>
      <div className="space-y-1">
        {validationRules.map((rule, index) => {
          const isValid = rule.test(password);
          return (
            <div key={index} className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                {rule.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const isPasswordValid = (password: string): boolean => {
  return validationRules.every(rule => rule.test(password));
};