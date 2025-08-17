'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ExtensionAuth() {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleAuth();
  }, []);

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

      // Send token to extension
      if (window.chrome && chrome.runtime) {
        // Get extension ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const extensionId = urlParams.get('extension_id') || 'YOUR_EXTENSION_ID';
        
        // Send message to extension with token
        chrome.runtime.sendMessage(
          extensionId,
          { 
            action: 'setAuthToken',
            token: session.access_token 
          },
          (response) => {
            if (response && response.success) {
              setStatus('success');
              // Close window after success
              setTimeout(() => {
                window.close();
              }, 1500);
            } else {
              throw new Error('Failed to send token to extension');
            }
          }
        );
      } else {
        // Fallback: Display token for manual copy
        setStatus('manual');
        navigator.clipboard.writeText(session.access_token);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message);
      setStatus('error');
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
            <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 mb-2">You need to log in first</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-gray-700 mb-2">Extension authenticated successfully!</p>
            <p className="text-sm text-gray-500">You can close this window</p>
          </div>
        )}
        
        {status === 'manual' && (
          <div className="text-center">
            <div className="text-blue-500 text-4xl mb-4">📋</div>
            <p className="text-gray-700 mb-2">Token copied to clipboard!</p>
            <p className="text-sm text-gray-500">Please paste it in the extension manually</p>
            <button 
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Close Window
            </button>
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