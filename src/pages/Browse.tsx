
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service, Category } from '@/types/database';
import { ServiceCard } from '@/components/ServiceCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Filter, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Browse = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterServices();
  }, [searchTerm, selectedCategory, locationFilter]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (data) setCategories(data);
  };

  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select(`
        *,
        user:users(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (data) {
      const typedServices = data.map(service => ({
        ...service,
        contact_info: service.contact_info as { phone?: string; email?: string; }
      })) as Service[];
      setServices(typedServices);
    }
    setLoading(false);
  };

  const filterServices = async () => {
    setLoading(true);
    let query = supabase
      .from('services')
      .select(`
        *,
        user:users(*)
      `)
      .eq('is_active', true);

    if (searchTerm) {
      query = query.or(`service_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    if (locationFilter) {
      query = query.ilike('location', `%${locationFilter}%`);
    }

    const { data } = await query.order('created_at', { ascending: false });
    
    if (data) {
      const typedServices = data.map(service => ({
        ...service,
        contact_info: service.contact_info as { phone?: string; email?: string; }
      })) as Service[];
      setServices(typedServices);
    }
    setLoading(false);
  };

  const handleContactClick = (service: Service) => {
    // Handle contact functionality
    console.log('Contact service:', service);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      {/* Search Section */}
      <section className="bg-white border-b py-8 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Professional Services
            </h1>
            <p className="text-xl text-gray-600">
              Connect with verified service providers in your area
            </p>
          </div>

          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setLocationFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === '' ? "default" : "secondary"}
              className="cursor-pointer hover:bg-blue-100"
              onClick={() => setSelectedCategory('')}
            >
              All Categories
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.name ? "default" : "secondary"}
                className="cursor-pointer hover:bg-blue-100"
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onContactClick={handleContactClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No services found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setLocationFilter('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer editMode={false} />
    </div>
  );
};

export default Browse;
