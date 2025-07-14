import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import EnhancedDashboard from "./pages/EnhancedDashboard";
import { NewDashboard } from "./pages/NewDashboard";
import Admin from "./pages/Admin";
import AdminCategories from "./pages/AdminCategories";
import AdminProfile from "./pages/AdminProfile";
import Pricing from "./pages/Pricing";
import Provider from "./pages/Provider";
import ProviderProfile from "./pages/ProviderProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <NewDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/admin/categories" element={
              <ProtectedRoute>
                <AdminCategories />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute>
                <AdminProfile />
              </ProtectedRoute>
            } />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/provider/:id" element={<Provider />} />
            <Route path="/provider-profile" element={
              <ProtectedRoute>
                <ProviderProfile />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
