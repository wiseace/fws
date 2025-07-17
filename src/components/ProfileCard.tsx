
import { Star, MapPin, Verified, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Profile {
  id: number;
  name: string;
  title: string;
  bio: string;
  location: string;
  image: string;
  category: string;
  rating: number;
  verified: boolean;
}

interface ProfileCardProps {
  profile: Profile;
  editMode: boolean;
}

export const ProfileCard = ({ profile, editMode }: ProfileCardProps) => {
  // Updated with African professional image
  const profileImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80";

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <CardContent className="p-6">
        {/* Profile Image and Verification */}
        <div className="relative mb-4">
          <img
            src={profileImage}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-white shadow-md"
          />
          {profile.verified && (
            <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1">
              <Verified className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Name and Title */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {profile.name}
          </h3>
          <p className="text-blue-600 font-medium mb-2">
            {profile.title}
          </p>
          <Badge variant="secondary" className="mb-3">
            {profile.category}
          </Badge>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {profile.bio}
        </p>

        {/* Location and Rating */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {profile.location}
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
            {profile.rating}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="w-4 h-4 mr-1" />
            Contact
          </Button>
        </div>

        {/* Edit Mode Overlay */}
        {editMode && (
          <div className="absolute inset-0 bg-blue-600/10 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="bg-white px-4 py-2 rounded-lg shadow-md text-blue-600 font-medium">
              Edit Profile
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
