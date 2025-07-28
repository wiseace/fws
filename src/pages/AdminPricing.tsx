import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface PricingPlan {
  id: string;
  plan: string;
  currency_code: string;
  price: number;
  user_type: 'provider' | 'seeker' | 'admin';
  created_at?: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const AdminPricing = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states for new/edit plan
  const [formData, setFormData] = useState({
    plan: '',
    currency_code: '',
    price: '',
    user_type: 'provider' as 'provider' | 'seeker'
  });

  useEffect(() => {
    if (profile?.user_type === 'admin') {
      fetchPricingPlans();
      fetchCurrencies();
    }
  }, [profile]);

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_pricing')
        .select('*')
        .order('user_type', { ascending: true })
        .order('plan', { ascending: true });

      if (error) throw error;
      setPricingPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('code, name, symbol')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleSave = async () => {
    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid price",
          variant: "destructive"
        });
        return;
      }

      const planData = {
        plan: formData.plan,
        currency_code: formData.currency_code,
        price,
        user_type: formData.user_type
      };

      if (editingPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_pricing')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Pricing plan updated successfully"
        });
      } else {
        // Create new plan
        const { error } = await supabase
          .from('subscription_pricing')
          .insert(planData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Pricing plan created successfully"
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      setFormData({ plan: '', currency_code: '', price: '', user_type: 'provider' });
      fetchPricingPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save pricing plan",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (plan: PricingPlan) => {
    // Only allow editing provider and seeker plans
    if (plan.user_type === 'admin') return;
    
    setEditingPlan(plan);
    setFormData({
      plan: plan.plan,
      currency_code: plan.currency_code,
      price: plan.price.toString(),
      user_type: plan.user_type as 'provider' | 'seeker'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return;

    try {
      const { error } = await supabase
        .from('subscription_pricing')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Pricing plan deleted successfully"
      });
      fetchPricingPlans();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete pricing plan",
        variant: "destructive"
      });
    }
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setFormData({ plan: '', currency_code: '', price: '', user_type: 'provider' });
    setIsDialogOpen(true);
  };

  if (profile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header editMode={false} onToggleEdit={() => {}} />
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header editMode={false} onToggleEdit={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pricing Management</h1>
            <p className="text-muted-foreground mt-2">Manage subscription pricing for providers and seekers</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Add Pricing Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plan">Plan Type</Label>
                  <Select
                    value={formData.plan}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, plan: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="user_type">User Type</Label>
                  <Select
                    value={formData.user_type}
                    onValueChange={(value: 'provider' | 'seeker') => setFormData(prev => ({ ...prev, user_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider">Provider</SelectItem>
                      <SelectItem value="seeker">Seeker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency_code}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency_code: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    {editingPlan ? 'Update' : 'Create'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading pricing plans...</div>
        ) : (
          <div className="grid gap-6">
            {/* Provider Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="default">Provider Plans</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pricingPlans
                    .filter(plan => plan.user_type === 'provider')
                    .map((plan) => (
                      <Card key={plan.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold capitalize">{plan.plan}</h3>
                              <p className="text-sm text-muted-foreground">{plan.currency_code}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(plan)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-2xl font-bold">
                            {currencies.find(c => c.code === plan.currency_code)?.symbol}
                            {plan.price.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Seeker Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Seeker Plans</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pricingPlans
                    .filter(plan => plan.user_type === 'seeker')
                    .map((plan) => (
                      <Card key={plan.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold capitalize">{plan.plan}</h3>
                              <p className="text-sm text-muted-foreground">{plan.currency_code}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(plan)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(plan.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-2xl font-bold">
                            {currencies.find(c => c.code === plan.currency_code)?.symbol}
                            {plan.price.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPricing;