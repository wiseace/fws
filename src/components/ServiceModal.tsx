import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Service, Category } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated?: () => void;
  editingService?: Service | null;
  service?: Service | null;
}

export const ServiceModal = ({ isOpen, onClose, onServiceCreated, editingService, service }: ServiceModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      const serviceToEdit = editingService || service;
      if (serviceToEdit) {
        populateForm(serviceToEdit);
      }
    }
  }, [isOpen, editingService]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const populateForm = (service: Service) => {
    setServiceName(service.service_name);
    setCategory(service.category);
    setDescription(service.description || '');
    setPhone(service.contact_info.phone || '');
    setEmail(service.contact_info.email || '');
    setLocation(service.location || '');
    setImageUrl(service.image_url || '');
  };

  const resetForm = () => {
    setServiceName('');
    setCategory('');
    setDescription('');
    setPhone('');
    setEmail('');
    setLocation('');
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !serviceName || !category) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in service name and category.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const serviceData = {
      service_name: serviceName,
      category,
      description,
      contact_info: { phone, email },
      location,
      image_url: imageUrl
    };

    try {
      const serviceToEdit = editingService || service;
      if (serviceToEdit) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', serviceToEdit.id);
          
        if (error) throw error;
        
        toast({
          title: "Service Updated!",
          description: "Your service has been updated successfully."
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([{ ...serviceData, user_id: user.id }]);
          
        if (error) throw error;
        
        toast({
          title: "Service Created!",
          description: "Your service is now live and visible to potential clients."
        });
      }

      resetForm();
      onClose();
      onServiceCreated?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {(editingService || service) ? 'Edit Service' : 'Create New Service'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g., Professional Web Design"
                required
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory} required disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your service in detail..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@example.com"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Service Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, NY or Remote"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="image-url">Service Image URL</Label>
            <Input
              id="image-url"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/service-image.jpg"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {(editingService || service) ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};