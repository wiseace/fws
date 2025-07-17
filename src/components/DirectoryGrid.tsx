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
        user: service.users, // Map the joined user data to the user property
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
    <section className="relative py-16 overflow-hidden">
      {/* Enhanced Background with Gradient and Subtle Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-primary/5"></div>
      
      {/* Subtle Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-secondary/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-1/3 w-56 h-56 bg-secondary/5 rounded-full blur-xl"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      ></div>

      {/* Content */}
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
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
