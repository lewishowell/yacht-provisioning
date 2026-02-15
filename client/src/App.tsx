import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProvisioningListsPage } from './pages/ProvisioningListsPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { MealsPage } from './pages/MealsPage';
import { MealDetailPage } from './pages/MealDetailPage';
import { MealPlansPage } from './pages/MealPlansPage';
import { MealPlanDetailPage } from './pages/MealPlanDetailPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/provisioning" element={<ProvisioningListsPage />} />
                <Route path="/provisioning/:id" element={<ListDetailPage />} />
                <Route path="/meals" element={<MealsPage />} />
                <Route path="/meals/:id" element={<MealDetailPage />} />
                <Route path="/meal-plans" element={<MealPlansPage />} />
                <Route path="/meal-plans/:id" element={<MealPlanDetailPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
