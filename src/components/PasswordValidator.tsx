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

  return (
    <div className="mt-2 p-3 bg-card rounded-lg border border-border">
      <p className="text-sm font-medium text-foreground mb-2">Password requirements:</p>
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