'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import yaml from 'js-yaml';

// Available languages from your app
const LANGUAGES = [
  'Hebrew', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian',
  'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Greek', 'Turkish', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Persian',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay', 'Tagalog', 'Swahili', 'Yoruba', 'Zulu', 'Amharic', 'English'
];

export default function HomePage() {
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [demoContent, setDemoContent] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Load demo content
    fetch('/demo-content.yaml')
      .then(res => res.text())
      .then(text => {
        const content = yaml.load(text);
        setDemoContent(content);
      })
      .catch(err => console.error('Error loading demo content:', err));

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      localStorage.setItem('referralCode', referralCode);
    }

    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = '/app';
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && event === 'SIGNED_IN') {
        // Handle referral claim if there's a stored referral code
        const storedReferralCode = localStorage.getItem('referralCode');
        if (storedReferralCode) {
          try {
            await fetch('/api/referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'claim',
                referralCode: storedReferralCode,
                newUserEmail: session.user.email
              }),
            });
            localStorage.removeItem('referralCode'); // Clean up
          } catch (error) {
            console.error('Error claiming referral:', error);
          }
        }
        window.location.href = '/app';
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const [activeTooltip, setActiveTooltip] = useState(0); // Start with first word showing

  // Helper function to render text with highlights
  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;
    
    let result = text;
    let elements = [];
    let lastIndex = 0;
    
    // Sort highlights by their position in text
    const sortedHighlights = [...highlights].sort((a, b) => {
      const posA = text.indexOf(`{${a.word}}`);
      const posB = text.indexOf(`{${b.word}}`);
      return posA - posB;
    });
    
    sortedHighlights.forEach((highlight, idx) => {
      const pattern = `{${highlight.word}}`;
      const index = result.indexOf(pattern);
      
      if (index !== -1) {
        // Add text before highlight
        if (index > lastIndex) {
          elements.push(
            <span key={`text-${idx}`}>
              {result.substring(lastIndex, index)}
            </span>
          );
        }
        
        // Add highlighted word
        elements.push(
          <span 
            key={`highlight-${idx}`}
            className="relative inline-block"
            onMouseEnter={() => setActiveTooltip(idx)}
          >
            <span className="bg-yellow-200 px-1 rounded cursor-pointer">
              {highlight.word}
            </span>
            {activeTooltip === idx && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                {highlight.translation}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </span>
        );
        
        lastIndex = index + pattern.length;
      }
    });
    
    // Add remaining text
    if (lastIndex < result.length) {
      elements.push(
        <span key="text-final">
          {result.substring(lastIndex).replace(/[{}]/g, '')}
        </span>
      );
    }
    
    return elements;
  };

  const getCurrentContent = () => {
    if (!demoContent) return null;
    
    const langData = demoContent.languages[selectedLanguage];
    if (!langData) return null;
    
    const levelData = langData.levels[selectedLevel];
    if (!levelData) return null;
    
    return {
      original: {
        ...langData.original,
        direction: langData.direction,
        font: langData.font
      },
      adapted: {
        ...levelData,
        direction: langData.direction,
        font: langData.font
      }
    };
  };

  const content = getCurrentContent();

  return (
    <main className="min-h-screen flex">
      {/* Left Panel - Auth */}
      <div className="w-full lg:w-2/5 bg-[#e8e9eb] flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 font-zain">
              Language Lite
            </h1>
            <p className="text-lg text-gray-600">
              Read anything in your target language, at your level
            </p>
          </div>

          {/* Value Props */}
          <div className="mb-8 space-y-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">Transform any text to your learning level instantly</span>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">Learn vocabulary in context, not isolation</span>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-gray-700">Read what interests you, adapted to your level</span>
            </div>
          </div>

          {/* Free Credits Badge */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎁</span>
              <div>
                <p className="font-semibold text-indigo-900">Start Free Today</p>
                <p className="text-sm text-indigo-700">6 credits instantly + 2 daily credits forever</p>
              </div>
            </div>
          </div>

          {/* Auth Component */}
          <div className="space-y-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#4f46e5',
                      brandAccent: '#4338ca',
                    },
                  },
                },
                className: {
                  container: 'auth-container-landing',
                  button: 'auth-button-landing',
                },
              }}
              providers={['google', 'facebook']}
              redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/app` : 'https://language-lite.com/app'}
              onlyThirdPartyProviders={true}
              view="sign_in"
              showLinks={false}
            />
          </div>

          {/* Trust Indicator */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Join 1,000+ language learners reading at their level
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <a href="/privacy" className="hover:text-gray-700 hover:underline">Privacy</a>
            <span className="mx-2">•</span>
            <a href="/delete-account" className="hover:text-gray-700 hover:underline">Data Deletion</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Demo */}
      <div className="hidden lg:flex w-3/5 bg-[#ffb238] p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute transform rotate-45 -right-40 -top-40 w-80 h-80 bg-white rounded-full"></div>
          <div className="absolute transform rotate-45 -left-40 -bottom-40 w-80 h-80 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {content && (
            <>
              {/* Original Text */}
              <div className="mb-6">
                <div className="border border-black p-6 bg-white/95">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Original ({selectedLanguage})</span>
                  </div>
                  <p 
                    className="text-gray-800 leading-relaxed font-bodoni text-lg"
                    dir={content.original.direction}
                    style={content.original.font !== 'default' ? { fontFamily: content.original.font } : {}}
                  >
                    {content.original.text}
                  </p>
                </div>
              </div>

              {/* Adapted Text */}
              <div className="mb-6">
                <div className="border border-black p-6 bg-white/95">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adapted ({selectedLanguage} - {selectedLevel})
                    </span>
                  </div>
                  <p 
                    className="text-gray-800 leading-relaxed font-bodoni text-lg"
                    dir={content.adapted.direction}
                    style={content.adapted.font !== 'default' ? { fontFamily: content.adapted.font } : {}}
                  >
                    {renderHighlightedText(
                      content.adapted.text, 
                      content.adapted.highlights
                    )}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-white/90 backdrop-blur text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white font-medium"
                  >
                    {LANGUAGES.filter(lang => 
                      demoContent?.languages?.[lang]
                    ).map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select 
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-white/90 backdrop-blur text-gray-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white font-medium"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Zain:wght@700;800;900&family=Inter:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600&family=Noto+Sans+Arabic:wght@400;500;600&family=Noto+Sans+SC:wght@400;500&family=Noto+Sans+JP:wght@400;500&display=swap');
        
        .font-zain {
          font-family: 'Zain', sans-serif;
        }
        
        .font-bodoni {
          font-family: 'Bodoni Moda', serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        .auth-container-landing {
          width: 100%;
        }
        
        .auth-container-landing button {
          width: 100%;
          padding: 0.75rem;
          font-weight: 600;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        
        .auth-container-landing [data-supabase-auth-ui_button] {
          background-color: #4f46e5;
          color: white;
        }
        
        .auth-container-landing [data-supabase-auth-ui_button]:hover {
          background-color: #4338ca;
          transform: translateY(-1px);
        }
        
        .auth-container-landing input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
        }
        
        .auth-container-landing input:focus {
          border-color: #4f46e5;
          outline: none;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </main>
  );
}