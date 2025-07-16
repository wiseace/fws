
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-r from-blue-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Find Professional Services
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with verified service providers in your area
          </p>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search for any service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 border-0 focus:ring-0 text-lg bg-transparent"
                />
              </div>
              <div className="relative min-w-[200px]">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-12 border-0 focus:ring-0 text-lg bg-transparent"
                />
              </div>
              <Button 
                size="lg"
                className="rounded-xl px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>
          
          {/* Modern Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <button
              onClick={() => setSelectedCategory('')}
              className={`group p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedCategory === '' 
                  ? 'border-blue-500 bg-blue-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">All</span>
                </div>
                <span className="text-sm font-medium text-gray-700">All Services</span>
              </div>
            </button>
            
            {categories.slice(0, 11).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`group p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedCategory === category.name 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Filter Actions */}
          {(searchTerm || selectedCategory || locationFilter) && (
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setLocationFilter('');
                }}
                className="rounded-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(searchTerm || selectedCategory || locationFilter) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Search Results {services.length > 0 && `(${services.length} found)`}
              </h3>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Category: {selectedCategory}
                  </Badge>
                )}
                {locationFilter && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Location: {locationFilter}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Finding services for you...</p>
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
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn't find any services matching your criteria. Try adjusting your search or filters.
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setLocationFilter('');
                  }}
                  className="rounded-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer editMode={false} />
    </div>
  );
};

export default Browse;
