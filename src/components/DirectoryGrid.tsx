
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service, User } from '@/types/database';
import { ModernServiceCard } from './ModernServiceCard';
import { CategoryFilter } from './CategoryFilter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DirectoryGridProps {
  editMode: boolean;
}

interface ServiceWithUser extends Service {
  user: User;
}

export const DirectoryGrid = ({ editMode }: DirectoryGridProps) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [services, setServices] = useState<ServiceWithUser[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchServicesAndCategories();
  }, []);

  const fetchServicesAndCategories = async () => {
    try {
      setLoading(true);
      
      // Fetch services with user data
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          user:users(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        setError('Failed to load services');
        return;
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      setServices((servicesData as ServiceWithUser[]) || []);
      
      // Extract unique categories from services and merge with database categories
      const serviceCategories = [...new Set(servicesData?.map(s => s.category) || [])];
      const dbCategories = categoriesData?.map(c => c.name) || [];
      const allCategories = [...new Set([...serviceCategories, ...dbCategories])];
      setCategories(allCategories);
      
    } catch (err) {
      console.error('Error in fetchServicesAndCategories:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  if (loading) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchServicesAndCategories}>Try Again</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12 animate-fade-in-up">
        <h2 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
          Featured Services
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with verified service providers in your area
        </p>
      </div>

      <div className="animate-fade-in-up">
        <CategoryFilter 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12 animate-fade-in-up">
        {filteredServices && filteredServices.length > 0 ? (
          filteredServices.map((service, index) => (
            <div 
              key={service.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ModernServiceCard 
                service={service}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-primary/10 flex items-center justify-center">
              <span className="text-4xl text-primary">🔍</span>
            </div>
            <div className="text-muted-foreground text-lg mb-4">
              No services found in this category.
            </div>
            <div className="text-muted-foreground/70">
              Try selecting a different category or check back later.
            </div>
          </div>
        )}
      </div>

      {editMode && user && (
        <div className="mt-8 text-center animate-fade-in-up">
          <Button 
            className="bg-gradient-primary hover:opacity-90 transform hover:scale-105 transition-all"
            onClick={() => window.location.href = '/dashboard'}
          >
            + Add New Service
          </Button>
        </div>
      )}
    </section>
  );
};
