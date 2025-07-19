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
import { Loader2, Upload, X } from 'lucide-react';
import servicePlaceholder from '@/assets/findwhosabi-service-placeholder.jpg';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceCreated?: () => void;
  editingService?: Service | null;
  service?: Service | null;
}

export const ServiceModal = ({ isOpen, onClose, onServiceCreated, editingService, service }: ServiceModalProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
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
    setImageUrl(service.image_url || '');
    setImagePreview(service.image_url || '');
  };

  const resetForm = () => {
    setServiceName('');
    setCategory('');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('service-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('service-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 1MB.",
          variant: "destructive"
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please choose an image file.",
          variant: "destructive"
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile || !serviceName || !category) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in service name and category.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = imageUrl;
      
      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        finalImageUrl = await handleImageUpload(imageFile);
        setUploading(false);
      }
      
      // Use placeholder if no image
      if (!finalImageUrl) {
        finalImageUrl = servicePlaceholder;
      }

      const serviceData = {
        service_name: serviceName,
        category,
        description,
        contact_info: { 
          phone: profile.phone, 
          email: profile.email 
        },
        location: (profile as any).formatted_address || (profile as any).address || '', // Use user's address from profile
        image_url: finalImageUrl
      };

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
      setUploading(false);
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

          <div>
            <Label htmlFor="service-image">Service Image</Label>
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Service preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={removeImage}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">No image</span>
                  </div>
                </div>
              )}
              <div>
                <Input
                  id="service-image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                <p className="text-xs text-gray-500 mt-1 mb-4">
                  Upload an image (max 1MB). If no image is uploaded, a FINDWHOSABI placeholder will be used.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
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
              disabled={loading || uploading}
            >
              {(loading || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Uploading...' : (editingService || service) ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};