import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageCircle, Calendar, Phone, Mail } from 'lucide-react';

interface ContactRequest {
  id: string;
  message: string | null;
  contact_method: string | null;
  created_at: string;
  services: {
    service_name: string;
    category: string;
  } | null;
  users: {
    name: string;
    email: string;
  } | null;
}

export const ClientRequestsTab = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      if (profile?.user_type === 'provider') {
        // Fetch requests for provider
        const { data, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            services:service_id (service_name, category),
            users:seeker_id (name, email)
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setRequests((data as any) || []);
      } else {
        // Fetch requests for seeker
        const { data, error } = await supabase
          .from('contact_requests')
          .select(`
            *,
            services:service_id (service_name, category),
            users:provider_id (name, email)
          `)
          .eq('seeker_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setRequests((data as any) || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load contact requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Requests ({requests.length})</h2>
        <Badge variant="outline" className="text-sm">
          {profile?.user_type === 'provider' ? 'Received Requests' : 'Sent Requests'}
        </Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No contact requests</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {profile?.user_type === 'provider' 
              ? "You haven't received any contact requests yet. Make sure your services are active and optimized."
              : "You haven't made any contact requests yet. Browse services and connect with providers."
            }
          </p>
          {profile?.user_type === 'seeker' && (
            <Button 
              className="mt-4"
              onClick={() => window.location.href = '/browse'}
            >
              Browse Services
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {request.services?.service_name || 'Service Request'}
                  </CardTitle>
                  <Badge variant="secondary">
                    {request.services?.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">
                      {profile?.user_type === 'provider' ? 'From: ' : 'To: '}
                      {request.users?.name}
                    </span>
                    <span className="text-gray-400">({request.users?.email})</span>
                  </div>

                  {request.message && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                        <p className="text-sm">{request.message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.contact_method && (
                        <div className="flex items-center gap-1">
                          {request.contact_method === 'phone' ? (
                            <Phone className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          {request.contact_method}
                        </div>
                      )}
                    </div>
                    
                    {profile?.user_type === 'provider' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (request.contact_method === 'phone') {
                            window.open(`tel:${request.users?.email}`, '_blank');
                          } else {
                            window.open(`mailto:${request.users?.email}`, '_blank');
                          }
                        }}
                      >
                        Respond
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};