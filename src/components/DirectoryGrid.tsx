import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from './ServiceCard';
import { CategoryFilter } from './CategoryFilter';
import { ModernServiceCard } from './ModernServiceCard';
import { EditableElement } from './EditableElement';
import { Button } from '@/components/ui/button';
import { Service } from '@/types/database';

interface DirectoryGridProps {
  editMode: boolean;
}

export const DirectoryGrid = ({ editMode }: DirectoryGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: services = [], isLoading, error } = useQuery({
    queryKey: ['services', selectedCategory],
    queryFn: async () => {
      console.log('Fetching services for category:', selectedCategory);
      let query = supabase.from('services').select(`
        *,
        users:user_id (
          id,
          name,
          phone,
          email,
          profile_image_url,
          is_verified,
          user_type,
          subscription_status,
          verification_status,
          created_at,
          updated_at
        )
      `);

      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching services:', error);
        throw error;
      }
      
      console.log('Services fetched:', data);
      
      // Transform the data to match our Service interface
      const transformedServices: Service[] = (data || []).map(service => ({
        ...service,
        user: service.users ? {
          ...service.users,
          verification_status: service.users.verification_status || 'not_verified'
        } : undefined, // Map the joined user data to the user property
        contact_info: typeof service.contact_info === 'object' && service.contact_info !== null 
          ? service.contact_info as { phone?: string; email?: string; }
          : { phone: undefined, email: undefined }
      }));
      
      return transformedServices;
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }
      
      console.log('Raw categories data:', data);
      
      // Extract just the names from the category objects and ensure we return strings
      const categoryNames = data?.map(cat => {
        // Extra safety: ensure we get a string
        if (typeof cat.name === 'string') {
          return cat.name;
        }
        return String(cat.name || '');
      }).filter(name => name.trim() !== '') || [];
      
      console.log('Processed category names:', categoryNames);
      return categoryNames;
    }
  });

  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  // Limit to 12 services for featured section
  const featuredServices = filteredServices.slice(0, 12);

  if (error) {
    console.error('Error in DirectoryGrid:', error);
    return (
      <div className="py-16 px-4 text-center">
        <p className="text-red-600">Error loading services. Please try again later.</p>
      </div>
    );
  }

  return (
    <section className="relative py-20 overflow-hidden min-h-screen">
      {/* Primary Background with Rich Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
      
      {/* Secondary Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-blue-100/30"></div>
      
      {/* Animated Floating Elements */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-indigo-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-20 right-1/3 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '6s' }}></div>
      </div>

      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      ></div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
      <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400 rounded-full opacity-40"></div>
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-indigo-400 rounded-full opacity-50"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-4xl font-bold text-gray-900 mb-4"
            defaultValue="Browse by Category"
          />
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            defaultValue="Find the perfect service provider for your needs. All professionals are verified and rated by our community."
          />
        </div>

        {/* Category Filter */}
        <div className="mb-16">
          <CategoryFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        {/* Featured Services Section */}
        <div className="mb-12" data-section="featured-services">
          <EditableElement
            editMode={editMode}
            type="text"
            className="text-3xl font-bold text-gray-900 mb-8 text-center"
            defaultValue="Featured Services"
          />
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 animate-pulse">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredServices.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {featuredServices.map((service) => (
                  <ModernServiceCard
                    key={service.id}
                    service={service}
                  />
                ))}
              </div>
              
              {/* CTA Button to Services Page */}
              <div className="text-center">
                <Button 
                  onClick={() => window.location.href = '/browse'}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  View All Services
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {selectedCategory === 'All' 
                  ? "No services available at the moment." 
                  : `No services found in the ${selectedCategory} category.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
