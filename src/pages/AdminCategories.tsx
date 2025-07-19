import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Category } from '@/types/database';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CompactAdminTableControls } from '@/components/admin/CompactAdminTableControls';

const AdminCategories = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [processedCategories, setProcessedCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    startIndex: 0,
    endIndex: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchCategories();
    }
  }, [profile]);

  const handleDataChange = (data: Category[], paginationInfo: { currentPage: number; totalPages: number; totalItems: number; startIndex: number; endIndex: number }) => {
    setProcessedCategories(data);
    setPagination(paginationInfo);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null
          })
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Category updated successfully"
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Category created successfully"
        });
      }
      
      // Reset form and close dialog
      setFormData({ name: '', description: '', icon: '' });
      setEditingCategory(null);
      setIsCreateOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || ''
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
      
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setIsCreateOpen(true);
  };

  if (!user || profile?.user_type !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="p-8">
            <CardContent>
              <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
              <p className="text-gray-600">You do not have admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header editMode={false} onToggleEdit={() => {}} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
              <p className="text-sm text-gray-600">Create and manage service categories for providers</p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew} size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Home Services, Technology, Education"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this category"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                    <Input
                      id="icon"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="e.g., home, laptop, book"
                    />
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <CompactAdminTableControls
            data={categories}
            searchFields={['name', 'description']}
            sortOptions={[
              { field: 'name', label: 'Name' },
              { field: 'description', label: 'Description' },
              { field: 'created_at', label: 'Created Date' }
            ]}
            filterOptions={[]}
            onDataChange={handleDataChange}
          />

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading categories...</p>
                </div>
              ) : processedCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-sm font-medium text-foreground">No categories found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try adjusting your search terms or create a new category.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead className="font-medium text-xs text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground">
                        Description
                      </TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground">Icon</TableHead>
                      <TableHead className="font-medium text-xs text-muted-foreground w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedCategories.map((category) => (
                      <TableRow key={category.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center">
                            {category.icon && <Tag className="w-4 h-4 mr-2 text-muted-foreground" />}
                            <span className="font-medium text-sm text-foreground">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm text-muted-foreground">
                            {category.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs text-muted-foreground font-mono">
                            {category.icon || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(category)}
                              className="h-7 w-7 p-0 hover:bg-muted"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(category.id)}
                              className="h-7 w-7 p-0 hover:bg-destructive/10 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Footer editMode={false} />
      </div>
    </ProtectedRoute>
  );
};

export default AdminCategories;