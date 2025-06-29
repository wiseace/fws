
export type UserType = 'provider' | 'seeker';
export type SubscriptionStatus = 'free' | 'monthly' | 'semi_annual' | 'yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: UserType;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  subscription_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  service_name: string;
  category: string;
  description?: string;
  contact_info: {
    phone?: string;
    email?: string;
  };
  location?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
}
