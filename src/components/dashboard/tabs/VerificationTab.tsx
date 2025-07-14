import { ProviderVerificationFlow } from '@/components/dashboard/ProviderVerificationFlow';

export const VerificationTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Verification</h2>
      <ProviderVerificationFlow />
    </div>
  );
};