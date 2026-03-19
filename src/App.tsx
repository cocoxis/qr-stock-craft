import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import StockPage from "./pages/StockPage";
import ProductsPage from "./pages/ProductsPage";
import AssemblyPage from "./pages/AssemblyPage";
import AuthPage from "./pages/AuthPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isApproved, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    );
  }

  if (!isApproved) {
    return (
      <Routes>
        <Route path="*" element={<PendingApprovalPage />} />
      </Routes>
    );
  }

  return (
    <WorkspaceProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/assembly" element={<AssemblyPage />} />
        {isAdmin && <Route path="/admin/users" element={<AdminUsersPage />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </WorkspaceProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
