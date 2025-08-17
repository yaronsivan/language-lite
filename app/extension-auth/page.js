'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ExtensionAuth() {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [shortCode, setShortCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15);

  useEffect(() => {
    handleAuth();
  }, []);

  useEffect(() => {
    // Countdown timer for code expiry
    if (status === 'ready' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 60000); // Update every minute
      return () => clearTimeout(timer);
    }
  }, [status, timeRemaining]);

  const handleAuth = async () => {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (!session) {
        setStatus('not_authenticated');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/?extension=true';
        }, 2000);
        return;
      }

      // Generate short code via API
      const response = await fetch('/api/extension-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'generate' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      const { code, expiresIn } = await response.json();
      setShortCode(code);
      setTimeRemaining(expiresIn);
      setStatus('ready');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
      setStatus('error');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <img 
            src="/language-lite-icon-transparent.png" 
            alt="Language Lite" 
            className="w-16 h-16"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">Extension Authentication</h1>
        
        {status === 'checking' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-600">Connecting to extension...</p>
          </div>
        )}
        
        {status === 'not_authenticated' && (
          <div className="text-center">
            <p className="text-gray-700 mb-2">You need to log in first</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        )}
        
        {status === 'ready' && (
          <div className="text-center">
            <div className="text-blue-500 text-2xl mb-4">🔑</div>
            <h2 className="text-lg font-semibold mb-3">Extension Code</h2>
            <p className="text-gray-600 text-sm mb-4">
              Enter this code in your Chrome extension:
            </p>
            
            <div className="bg-gray-100 rounded-lg p-6 mb-4">
              <div className="text-3xl font-bold font-mono tracking-wider">
                {shortCode}
              </div>
            </div>
            
            <button 
              onClick={copyToClipboard}
              className={`w-full px-4 py-2 rounded font-medium transition-colors ${
                copySuccess 
                  ? 'bg-green-500 text-white' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {copySuccess ? 'Copied! ✓' : 'Copy Code'}
            </button>
            
            <p className="text-xs text-gray-500 mt-3">
              Expires in {timeRemaining} minutes
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <p className="text-gray-700 mb-2">Authentication failed</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button 
              onClick={handleAuth}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}