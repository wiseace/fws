-- Update contact_requests RLS policy to align with new seeker access rules
-- Seekers now only need subscription, not verification

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Verified subscribers can create contact requests" ON public.contact_requests;

-- Create new policy that uses the updated can_access_contact_info function
CREATE POLICY "Authorized users can create contact requests"
ON public.contact_requests
FOR INSERT
WITH CHECK (
  seeker_id = auth.uid() 
  AND can_access_contact_info(auth.uid())
);