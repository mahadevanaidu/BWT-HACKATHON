import { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { CinematicIntro } from './components/intro/CinematicIntro';
import { ToastContainer } from './components/ui/Toast';
import { PageLoader } from './components/ui/Spinner';
import { useIntroStore } from './store/introStore';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const IssueDocumentPage = lazy(() => import('./pages/IssueDocumentPage'));
const DocumentDetailPage = lazy(() => import('./pages/DocumentDetailPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:verificationId" element={<VerifyPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/new" element={<IssueDocumentPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const { hasSeenIntro, setHasSeenIntro } = useIntroStore();
  const [introComplete, setIntroComplete] = useState(hasSeenIntro);

  const isVerifyRoute = window.location.pathname.startsWith('/verify/');

  function handleIntroComplete() {
    setHasSeenIntro(true);
    setIntroComplete(true);
  }

  useEffect(() => {
    const sessionKey = 'verity-session-started';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      if (hasSeenIntro) {
        setIntroComplete(true);
      }
    }
  }, [hasSeenIntro]);

  const showIntro = !introComplete && !isVerifyRoute;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
        {(!showIntro || isVerifyRoute) && <AppRoutes />}
      </BrowserRouter>
      <ToastContainer />
    </QueryClientProvider>
  );
}
