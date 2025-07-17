
export type UserType = 'provider' | 'seeker' | 'admin';
export type SubscriptionStatus = 'free' | 'monthly' | 'semi_annual' | 'yearly';
export type SubscriptionPlan = 'free' | 'monthly' | 'semi_annual' | 'yearly';
export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  user_type: UserType;
  is_verified: boolean;
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_expiry?: string;
  verification_status?: VerificationStatus;
  verification_documents?: any;
  can_access_contact?: boolean;
  profile_image_url?: string;
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

export interface VerificationRequest {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  id_document_url?: string;
  skill_proof_url?: string;
  additional_info?: string;
  status: VerificationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id: string;
  seeker_id: string;
  provider_id: string;
  service_id: string;
  message?: string;
  contact_method?: 'phone' | 'email' | 'message';
  created_at: string;
}
