import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginFormProps {
  onLogin: (token: string) => void;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, isLoading = false }: LoginFormProps) {
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('admin_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="cyberpunk-body min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background matrix effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="cyberpunk-scanlines"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyberpunk-cyan/5 to-transparent"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="cyberpunk-card p-8 border-2 border-cyberpunk-cyan/30 rounded-lg backdrop-blur-lg relative overflow-hidden">
          {/* Card glow effect */}
          <div className="absolute inset-0 cyberpunk-glow opacity-50 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-cyberpunk-magenta/10 to-cyberpunk-cyan/10 pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Terminal header */}
            <div className="text-center mb-8 space-y-4">
              <div className="cyberpunk-terminal-header">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-cyberpunk-red animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-cyberpunk-yellow animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <div className="w-3 h-3 rounded-full bg-cyberpunk-green animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>
                <div className="cyberpunk-text text-sm mb-2 font-mono">
                  ADMIN_TERMINAL_v2.1.47
                </div>
              </div>
              
              <h1 className="text-3xl font-bold cyberpunk-text-glow mb-2 font-mono tracking-wider">
                ≫ SYSTEM ACCESS ≪
              </h1>
              <p className="cyberpunk-text text-sm font-mono opacity-80">
                Authorized personnel only • Đăng nhập để truy cập
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="cyberpunk-alert bg-cyberpunk-red/10 border border-cyberpunk-red/50 rounded p-3 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-cyberpunk-red/5 animate-pulse"></div>
                  <p className="cyberpunk-text text-sm text-center font-mono relative z-10">
                    ⚠ ERROR: {error}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="cyberpunk-input-group">
                  <label htmlFor="username" className="block cyberpunk-text text-sm font-medium mb-2 font-mono">
                    └─ USERNAME:
                  </label>
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="Enter username..."
                      className="cyberpunk-input w-full bg-transparent border-2 border-cyberpunk-cyan/50 text-cyberpunk-cyan placeholder-cyberpunk-cyan/50 font-mono text-sm px-4 py-3 rounded focus:border-cyberpunk-magenta focus:ring-0 focus:outline-none transition-all duration-300"
                      disabled={isSubmitting}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyberpunk-cyan rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="cyberpunk-input-group">
                  <label htmlFor="password" className="block cyberpunk-text text-sm font-medium mb-2 font-mono">
                    └─ PASSWORD:
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Enter password..."
                      className="cyberpunk-input w-full bg-transparent border-2 border-cyberpunk-cyan/50 text-cyberpunk-cyan placeholder-cyberpunk-cyan/50 font-mono text-sm px-4 py-3 rounded focus:border-cyberpunk-magenta focus:ring-0 focus:outline-none transition-all duration-300"
                      disabled={isSubmitting}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyberpunk-cyan rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full cyberpunk-button bg-gradient-to-r from-cyberpunk-magenta/20 to-cyberpunk-cyan/20 border-2 border-cyberpunk-magenta hover:border-cyberpunk-cyan cyberpunk-text-glow font-mono py-3 px-6 rounded transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                disabled={isSubmitting || isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyberpunk-magenta/10 to-cyberpunk-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-cyberpunk-cyan/30 border-t-cyberpunk-cyan rounded-full animate-spin"></div>
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <span>≫ CONNECT ≪</span>
                  )}
                </div>
              </Button>
            </form>

            <div className="mt-8 text-center">
              <div className="cyberpunk-info-panel bg-cyberpunk-background/50 border border-cyberpunk-cyan/20 rounded p-3 backdrop-blur-sm">
                <p className="cyberpunk-text text-xs font-mono opacity-60">
                  DEFAULT_CREDS → user: <code className="cyberpunk-code bg-cyberpunk-cyan/10 px-1 rounded text-cyberpunk-cyan">admin</code> | 
                  pass: <code className="cyberpunk-code bg-cyberpunk-cyan/10 px-1 rounded text-cyberpunk-cyan">admin123</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}