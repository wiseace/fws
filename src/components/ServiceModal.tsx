import { useState, useEffect, useRef } from 'react';
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
import { Upload, ImageIcon, Loader2 } from 'lucide-react';
import servicePlaceholder from '@/assets/service-placeholder.jpg';

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
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
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
  };

  const resetForm = () => {
    setServiceName('');
    setCategory('');
    setDescription('');
    setImageUrl('');
  };

  const handleImageUpload = async (file: File) => {
    if (!user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, WEBP, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      
      toast({
        title: "Image Uploaded",
        description: "Your service image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
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

    // Use profile contact info automatically
    const serviceData = {
      service_name: serviceName,
      category,
      description,
      contact_info: { 
        phone: profile?.phone || '', 
        email: profile?.email || user.email 
      },
      location: '', // Not needed per requirements
      image_url: imageUrl || servicePlaceholder
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
    if (!loading && !uploading) {
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
            <Label>Service Image</Label>
            <div className="mt-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {imageUrl ? (
                  <div className="space-y-4">
                    <img 
                      src={imageUrl} 
                      alt="Service preview" 
                      className="max-h-40 mx-auto rounded-lg object-cover"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || loading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Change Image
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setImageUrl('')}
                        disabled={uploading || loading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || loading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Recommended: 1024x576px (16:9 ratio) • Max 5MB • JPG, PNG, WEBP
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        High-quality images help attract more clients
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Contact Information</h4>
            <p className="text-sm text-blue-700">
              Your contact details from your profile will be used automatically:
            </p>
            <div className="mt-2 space-y-1 text-sm text-blue-600">
              <p><strong>Email:</strong> {profile?.email || user?.email}</p>
              {profile?.phone && <p><strong>Phone:</strong> {profile.phone}</p>}
            </div>
            <p className="text-xs text-blue-500 mt-2">
              Update your contact info in your profile settings if needed.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90"
              disabled={loading || uploading}
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