'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const LANGUAGES = [
  'Hebrew', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian',
  'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Greek', 'Turkish', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Persian',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay', 'Tagalog', 'Swahili', 'Yoruba', 'Zulu', 'Amharic', 'English'
];

export default function Home() {
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [credits, setCredits] = useState(0);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('Beginner');
  const [searchLang, setSearchLang] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState(null);

  useEffect(() => {
    // Check for authenticated user
    checkAuthUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else {
        setIsRegistered(false);
        setEmail('');
        setCredits(0);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [checkAuthUser]);

  const checkAuthUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      handleAuthUser(user);
    } else {
      // Fallback to old localStorage method
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) {
        checkUserCredits(savedEmail);
      }
    }
  }, []);

  const handleAuthUser = async (user) => {
    const userEmail = user.email;
    
    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('credits')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      setEmail(userEmail);
      setCredits(existingUser.credits);
      setIsRegistered(true);
    } else {
      // Create user in our table
      const { data: newUser } = await supabase
        .from('users')
        .insert([{
          email: userEmail,
          language: 'Spanish',
          level: 'Beginner',
          credits: 6,
          last_credit_refresh: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      if (newUser) {
        setEmail(userEmail);
        setCredits(newUser.credits);
        setIsRegistered(true);
      }
    }
  };

  const checkUserCredits = async (userEmail) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('credits')
        .eq('email', userEmail)
        .single();

      if (data) {
        setEmail(userEmail);
        setCredits(data.credits);
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Error checking credits:', error);
    }
  };

  const handleRegister = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .upsert([
          { 
            email, 
            language, 
            level,
            credits: 6,
            last_credit_refresh: new Date().toISOString().split('T')[0]
          }
        ], { onConflict: 'email' })
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem('userEmail', email);
      setCredits(data.credits);
      setIsRegistered(true);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to register. Please try again.');
    }
  };

  const handleAdapt = async () => {
    if (!text.trim()) {
      alert('Please enter some text to adapt');
      return;
    }

    if (credits <= 0) {
      alert('No credits remaining! You get 2 free credits daily at midnight.');
      return;
    }

    setIsAdapting(true);
    setAdaptedResult(null);

    try {
      const response = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, level }),
      });

      const data = await response.json();
      setAdaptedResult(data);

      const newCredits = credits - 1;
      setCredits(newCredits);

      const { data: userData } = await supabase
        .from('users')
        .select('total_adaptations')
        .eq('email', email)
        .single();

      await supabase
        .from('users')
        .update({ 
          credits: newCredits,
          total_adaptations: (userData?.total_adaptations || 0) + 1
        })
        .eq('email', email);

      await supabase
        .from('adaptations')
        .insert([{
          user_email: email,
          original_text: text.substring(0, 500),
          adapted_text: data.adaptedText.substring(0, 500),
          language,
          level
        }]);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to adapt text. Please try again.');
    } finally {
      setIsAdapting(false);
    }
  };

  const filteredLanguages = LANGUAGES.filter(lang => 
    lang.toLowerCase().includes(searchLang.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Simple Header - guaranteed to work */}
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Language Lite</h1>
              <p className="text-gray-300 text-sm">
                AI-powered language adaptation
              </p>
            </div>
            {isRegistered && (
              <div className="text-right">
                <div className="text-sm text-gray-300">Logged in as</div>
                <div className="font-semibold text-white">{email.split('@')[0]}</div>
                <div className="mt-1">
                  <span className="bg-white text-gray-900 px-3 py-1 font-bold text-sm inline-block">
                    {credits} credits remaining
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem('userEmail');
                    setIsRegistered(false);
                    setEmail('');
                    setCredits(0);
                  }}
                  className="mt-2 text-xs text-gray-300 hover:text-white underline"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!isRegistered ? (
          // Simple Registration
          <div className="max-w-md mx-auto mt-12">
            <div className="bg-white border-2 border-gray-800 shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Enjoy reading any text in the language you are studying!
              </h2>
              <p className="text-xl text-gray-800 mb-4">
                For every level!
              </p>
              <p className="text-gray-700 mb-6">
                Make everything a learning material, read what really interests you - but in a simplified language.
              </p>
              <div className="bg-gray-50 border-l-4 border-gray-600 p-4 mb-6">
                <p className="text-sm text-gray-800">
                  Get <strong>6 free credits</strong> immediately, plus <strong>2 credits daily</strong> forever.
                </p>
              </div>
              
              {/* Social Login with Supabase Auth UI */}
              <div className="mb-6">
                <Auth
                  supabaseClient={supabase}
                  appearance={{
                    theme: ThemeSupa,
                    variables: {
                      default: {
                        colors: {
                          brand: '#111827',
                          brandAccent: '#1f2937',
                        },
                      },
                    },
                    className: {
                      container: 'auth-container',
                      button: 'auth-button',
                      divider: 'my-4',
                    },
                  }}
                  providers={['google', 'facebook']}
                  redirectTo={typeof window !== 'undefined' ? window.location.origin : ''}
                  onlyThirdPartyProviders={false}
                  view="magic_link"
                  showLinks={false}
                  localization={{
                    variables: {
                      magic_link: {
                        email_input_label: 'Email Address',
                        email_input_placeholder: 'you@example.com',
                        button_label: 'Start Learning with Email →',
                        loading_button_label: 'Sending magic link...',
                        link_text: ''
                      },
                    },
                  }}
                />
              </div>
              
              <style jsx global>{`
                .auth-container {
                  width: 100%;
                }
                .auth-container button {
                  width: 100%;
                  padding: 0.75rem;
                  font-weight: bold;
                  border: 2px solid #e5e7eb;
                  transition: all 0.2s;
                }
                .auth-container button:hover {
                  background-color: #f9fafb;
                  border-color: #6b7280;
                }
                .auth-container [data-supabase-auth-ui_button] {
                  background-color: #111827;
                  color: white;
                }
                .auth-container [data-supabase-auth-ui_button]:hover {
                  background-color: #1f2937;
                }
                .auth-container input {
                  width: 100%;
                  padding: 0.75rem;
                  border: 2px solid #d1d5db;
                  color: black;
                  background-color: white;
                }
                .auth-container input:focus {
                  border-color: #4b5563;
                  outline: none;
                }
                .auth-container .supabase-auth-ui_ui-divider {
                  margin: 1.5rem 0;
                  text-align: center;
                  position: relative;
                }
                .auth-container .supabase-auth-ui_ui-divider::before {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 0;
                  right: 0;
                  height: 1px;
                  background: #e5e7eb;
                }
                .auth-container .supabase-auth-ui_ui-divider span {
                  background: white;
                  padding: 0 1rem;
                  position: relative;
                  color: #6b7280;
                  font-size: 0.875rem;
                }
              `}</style>
            </div>
          </div>
        ) : (
          // Main App - Simple B&W
          <>
            {/* Input Section */}
            <div className="bg-white border-2 border-gray-200 shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Step 1: Paste Your Text
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Enter any article, story, or text you want to adapt to your learning level
              </p>
              
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 text-black bg-gray-50 focus:bg-white focus:border-gray-600 focus:outline-none"
                rows="6"
                placeholder="Paste or type your text here..."
              />
            </div>

            {/* Settings */}
            <div className="bg-white border-2 border-gray-200 shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Step 2: Choose Your Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Target Language
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={showLangDropdown ? searchLang : language}
                      onChange={(e) => setSearchLang(e.target.value)}
                      onFocus={() => setShowLangDropdown(true)}
                      placeholder="Type to search..."
                      className="w-full p-3 border-2 border-gray-300 text-black bg-white focus:border-gray-600 focus:outline-none"
                    />
                    {showLangDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 shadow-lg max-h-48 overflow-y-auto">
                        {filteredLanguages.map(lang => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang);
                              setShowLangDropdown(false);
                              setSearchLang('');
                            }}
                            className="w-full text-left p-3 text-black hover:bg-gray-100 focus:bg-gray-100"
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 text-black bg-white focus:border-gray-600 focus:outline-none"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="bg-gray-50 border-2 border-gray-400 shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Step 3: Adapt Your Text
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Uses 1 credit • You have {credits} credits remaining
              </p>

              <button
                onClick={handleAdapt}
                disabled={isAdapting || credits <= 0 || !text.trim()}
                className={`w-full py-4 font-bold text-lg transition-all ${
                  isAdapting || credits <= 0 || !text.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isAdapting ? 'Processing Your Text...' : 'Adapt This Text'}
              </button>
            </div>

            {/* Results */}
            {adaptedResult && (
              <div className="bg-white border-2 border-gray-400 shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  ✓ Successfully Adapted!
                </h2>

                <div className="bg-gray-50 border-l-4 border-gray-600 p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Adapted Text:</h3>
                  <p className="text-black leading-relaxed">
                    {adaptedResult.adaptedText}
                  </p>
                </div>

                {adaptedResult.vocabulary && adaptedResult.vocabulary.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Key Vocabulary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {adaptedResult.vocabulary.map((word, index) => (
                        <div key={index} className="bg-gray-50 border-l-4 border-gray-400 p-3">
                          <span className="font-bold text-black">
                            {typeof word === 'string' ? word : word.word}
                          </span>
                          {typeof word === 'object' && word.translation && (
                            <>
                              <span className="mx-2 text-gray-400">→</span>
                              <span className="text-gray-700">{word.translation}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer with privacy links */}
        <footer className="mt-16 pt-8 pb-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <a href="/privacy" className="hover:text-gray-900 hover:underline">Privacy Policy</a>
            <span className="mx-2">•</span>
            <a href="/delete-account" className="hover:text-gray-900 hover:underline">Data Deletion</a>
            <span className="mx-2">•</span>
            <a href="mailto:yaron@ulpan.co.il" className="hover:text-gray-900 hover:underline">Contact</a>
          </div>
        </footer>
      </div>
    </main>
  );
}