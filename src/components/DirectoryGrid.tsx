
import { useState } from 'react';
import { ProfileCard } from './ProfileCard';
import { CategoryFilter } from './CategoryFilter';

interface DirectoryGridProps {
  editMode: boolean;
}

const sampleProfiles = [
  {
    id: 1,
    name: 'Sarah Johnson',
    title: 'UX Designer',
    bio: 'Creative UX designer with 8+ years of experience in user-centered design.',
    location: 'New York, NY',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
    category: 'Design',
    rating: 4.9,
    verified: true
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'Full Stack Developer',
    bio: 'Passionate developer specializing in modern web technologies and cloud solutions.',
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
    category: 'Technology',
    rating: 4.8,
    verified: true
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    title: 'Business Consultant',
    bio: 'Strategic business consultant helping startups and SMEs achieve sustainable growth.',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
    category: 'Consulting',
    rating: 5.0,
    verified: true
  },
  {
    id: 4,
    name: 'David Park',
    title: 'Wedding Photographer',
    bio: 'Professional photographer capturing life\'s most precious moments with artistic flair.',
    location: 'Los Angeles, CA',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
    category: 'Photography',
    rating: 4.7,
    verified: false
  },
  {
    id: 5,
    name: 'Lisa Thompson',
    title: 'Content Writer',
    bio: 'Award-winning content writer specializing in B2B marketing and thought leadership.',
    location: 'Chicago, IL',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
    category: 'Writing',
    rating: 4.9,
    verified: true
  },
  {
    id: 6,
    name: 'James Wilson',
    title: 'Life Coach',
    bio: 'Certified life coach empowering individuals to unlock their potential and achieve goals.',
    location: 'Miami, FL',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
    category: 'Coaching',
    rating: 4.8,
    verified: true
  }
];

export const DirectoryGrid = ({ editMode }: DirectoryGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [profiles] = useState(sampleProfiles);

  const filteredProfiles = selectedCategory === 'All' 
    ? profiles 
    : profiles.filter(profile => profile.category === selectedCategory);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Featured Professionals
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect with verified experts and professionals in various fields
        </p>
      </div>

      <CategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {filteredProfiles.map((profile) => (
          <ProfileCard 
            key={profile.id} 
            profile={profile} 
            editMode={editMode}
          />
        ))}
      </div>

      {editMode && (
        <div className="mt-8 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            + Add New Profile
          </button>
        </div>
      )}
    </section>
  );
};
