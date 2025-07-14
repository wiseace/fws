-- Enable realtime for verification_requests table
ALTER TABLE public.verification_requests REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_requests;