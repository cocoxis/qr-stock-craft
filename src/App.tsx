import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import StockPage from "./pages/StockPage";
import StockItemDetailPage from "./pages/StockItemDetailPage";
import StockItemEditPage from "./pages/StockItemEditPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductEditPage from "./pages/ProductEditPage";
import AssemblyPage from "./pages/AssemblyPage";
import AssemblyDetailPage from "./pages/AssemblyDetailPage";
import AssemblyEditPage from "./pages/AssemblyEditPage";
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
        <Route path="/stock/new/edit" element={<StockItemEditPage />} />
        <Route path="/stock/:id" element={<StockItemDetailPage />} />
        <Route path="/stock/:id/edit" element={<StockItemEditPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new/edit" element={<ProductEditPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/edit" element={<ProductEditPage />} />
        <Route path="/assembly" element={<AssemblyPage />} />
        <Route path="/assembly/new/edit" element={<AssemblyEditPage />} />
        <Route path="/assembly/:id" element={<AssemblyDetailPage />} />
        <Route path="/assembly/:id/edit" element={<AssemblyEditPage />} />
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
