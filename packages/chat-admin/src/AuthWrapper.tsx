import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/LoginForm';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  // Show loading spinner during initial auth check
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Đang kiểm tra xác thực...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  // Render main app with logout button
  return (
    <div className="relative">
      {/* Logout button overlay */}
      <div className="hidden fixed top-4 right-4 z-50">
        <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
          <div className="flex items-center space-x-2 text-white text-sm">
            <User className="w-4 h-4" />
            <span>{user?.username}</span>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 hover:text-white transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Main app content */}
      {children}
    </div>
  );
}