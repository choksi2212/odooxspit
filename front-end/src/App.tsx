import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/Layout/MainLayout";
import { OfflineIndicator } from "@/components/OfflineIndicator";

// Auth pages
import LoginPage from "@/routes/Auth/LoginPage";
import SignupPage from "@/routes/Auth/SignupPage";
import ForgotPasswordPage from "@/routes/Auth/ForgotPasswordPage";
import ResetPasswordPage from "@/routes/Auth/ResetPasswordPage";

// Main pages
import DashboardPage from "@/routes/Dashboard/DashboardPage";
import ReceiptsListPage from "@/routes/Operations/ReceiptsListPage";
import ReceiptDetailPage from "@/routes/Operations/ReceiptDetailPage";
import DeliveriesListPage from "@/routes/Operations/DeliveriesListPage";
import DeliveryDetailPage from "@/routes/Operations/DeliveryDetailPage";
import TransfersListPage from "@/routes/Operations/TransfersListPage";
import TransferDetailPage from "@/routes/Operations/TransferDetailPage";
import AdjustmentsListPage from "@/routes/Operations/AdjustmentsListPage";
import AdjustmentDetailPage from "@/routes/Operations/AdjustmentDetailPage";
import ProductsPage from "@/routes/Products/ProductsPage";
import MoveHistoryPage from "@/routes/MoveHistory/MoveHistoryPage";
import WarehousesPage from "@/routes/Settings/WarehousesPage";
import LocationsPage from "@/routes/Settings/LocationsPage";
import ProfilePage from "@/routes/ProfilePage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/auth/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
      <Route path="/auth/forgot-password" element={<AuthRoute><ForgotPasswordPage /></AuthRoute>} />
      <Route path="/auth/reset-password" element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      
      {/* Operations */}
      <Route path="/operations/receipts" element={<ProtectedRoute><ReceiptsListPage /></ProtectedRoute>} />
      <Route path="/operations/receipts/:id" element={<ProtectedRoute><ReceiptDetailPage /></ProtectedRoute>} />
      <Route path="/operations/deliveries" element={<ProtectedRoute><DeliveriesListPage /></ProtectedRoute>} />
      <Route path="/operations/deliveries/:id" element={<ProtectedRoute><DeliveryDetailPage /></ProtectedRoute>} />
      <Route path="/operations/transfers" element={<ProtectedRoute><TransfersListPage /></ProtectedRoute>} />
      <Route path="/operations/transfers/:id" element={<ProtectedRoute><TransferDetailPage /></ProtectedRoute>} />
      <Route path="/operations/adjustments" element={<ProtectedRoute><AdjustmentsListPage /></ProtectedRoute>} />
      <Route path="/operations/adjustments/:id" element={<ProtectedRoute><AdjustmentDetailPage /></ProtectedRoute>} />
      
      {/* Products */}
      <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
      
      {/* Move History */}
      <Route path="/move-history" element={<ProtectedRoute><MoveHistoryPage /></ProtectedRoute>} />
      
      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      
      {/* Settings */}
      <Route path="/settings/warehouses" element={<ProtectedRoute><WarehousesPage /></ProtectedRoute>} />
      <Route path="/settings/locations" element={<ProtectedRoute><LocationsPage /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
