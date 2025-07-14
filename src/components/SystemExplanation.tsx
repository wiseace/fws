import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Shield, LayoutDashboard, Phone, Mail } from 'lucide-react';

const SystemExplanation = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Contact Requests System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What are Contact Requests?</h3>
            <p className="text-blue-800 text-sm">
              Contact requests are messages sent by <strong>service seekers</strong> to <strong>service providers</strong> 
              when they want to inquire about or hire a specific service. They serve as the primary communication bridge 
              between clients and providers on the platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                For Service Seekers
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Browse services and find providers</li>
                <li>• Send contact requests to providers</li>
                <li>• Include custom messages with specific requirements</li>
                <li>• Choose preferred contact method (phone/email)</li>
                <li>• Track all sent requests in their dashboard</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                For Service Providers
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Receive contact requests from potential clients</li>
                <li>• View client messages and requirements</li>
                <li>• See seeker's preferred contact method</li>
                <li>• Respond through their preferred communication channel</li>
                <li>• Track all received requests in their dashboard</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">Access Requirements</h4>
            <p className="text-yellow-800 text-sm">
              To send contact requests, users need to be <Badge className="bg-green-100 text-green-800">verified</Badge> 
              and have an active <Badge className="bg-blue-100 text-blue-800">paid subscription</Badge>. 
              This ensures quality interactions and prevents spam.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Admin Panel vs User Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-800">
                <Shield className="h-5 w-5" />
                Admin Panel (/admin)
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-red-700">System Administration</p>
                <ul className="text-red-700 space-y-1 ml-4">
                  <li>• Manage all users and their roles</li>
                  <li>• Process verification requests</li>
                  <li>• Monitor contact requests across platform</li>
                  <li>• Oversee all services and categories</li>
                  <li>• View system-wide statistics</li>
                  <li>• Delete users and moderate content</li>
                  <li>• Access admin profile settings</li>
                </ul>
                <Badge className="bg-red-100 text-red-800 border-red-200">Admin Only</Badge>
              </div>
            </div>
            
            <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                <LayoutDashboard className="h-5 w-5" />
                User Dashboard (/dashboard)
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-blue-700">Personal Management</p>
                <ul className="text-blue-700 space-y-1 ml-4">
                  <li>• Manage personal services (providers)</li>
                  <li>• View own contact requests</li>
                  <li>• Update personal profile</li>
                  <li>• Manage subscription settings</li>
                  <li>• Track personal statistics</li>
                  <li>• Browse available services (seekers)</li>
                  <li>• Submit verification requests</li>
                </ul>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">All Users</Badge>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Key Differences</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Scope</p>
                <p className="text-gray-600">Admin: System-wide | Dashboard: Personal</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Access</p>
                <p className="text-gray-600">Admin: Admin role only | Dashboard: All users</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Purpose</p>
                <p className="text-gray-600">Admin: Management | Dashboard: Usage</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemExplanation;