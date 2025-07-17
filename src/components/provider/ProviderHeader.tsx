
import { Card } from '@/components/ui/card';
import { Verified } from 'lucide-react';

interface ProviderHeaderProps {
  user: any;
  mainService: any;
}

export const ProviderHeader = ({ user, mainService }: ProviderHeaderProps) => {
  // Updated default background image with African professional
  const defaultBackground = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&h=400&fit=crop&q=80";

  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800 relative">
        <img 
          src={mainService.image_url || defaultBackground} 
          alt={mainService.service_name}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="p-6 text-white">
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold mr-3">{user?.name}</h1>
              {user?.is_verified && (
                <div className="bg-blue-600 rounded-full p-1">
                  <Verified className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <p className="text-blue-100 text-lg">{mainService.service_name}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
