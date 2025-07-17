
import { Card, CardContent } from '@/components/ui/card';
import { Verified, Award } from 'lucide-react';

interface ProviderVerificationProps {
  user: any;
}

export const ProviderVerification = ({ user }: ProviderVerificationProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            {user?.is_verified ? (
              <>
                <div className="bg-secondary/10 rounded-full p-1 mr-3">
                  <Verified className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-secondary font-medium">Verified Provider</span>
              </>
            ) : (
              <>
                <div className="bg-gray-100 rounded-full p-1 mr-3">
                  <Award className="w-4 h-4 text-gray-600" />
                </div>
                <span className="text-gray-600">Unverified</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {user?.is_verified 
              ? "This provider has been verified and meets our quality standards."
              : "This provider has not yet completed verification."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
