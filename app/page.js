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

// Demo content for split-screen showcase
const DEMO_CONTENT = {
  original: {
    text: "Recent technological breakthroughs in artificial intelligence have revolutionized numerous industries, fundamentally transforming how businesses operate and consumers interact with digital platforms.",
    wordCount: 24,
    complexity: "Advanced"
  },
  adapted: {
    Spanish: {
      Beginner: {
        text: "Los nuevos avances en inteligencia artificial han cambiado muchas industrias. Ahora las empresas trabajan de manera diferente y las personas usan las plataformas digitales de forma nueva.",
        vocabulary: [
          { word: "avances", translation: "advances" },
          { word: "inteligencia artificial", translation: "artificial intelligence" },
          { word: "industrias", translation: "industries" },
          { word: "empresas", translation: "businesses" }
        ],
        wordCount: 29,
        complexity: "Beginner"
      },
      Intermediate: {
        text: "Los recientes avances tecnológicos en inteligencia artificial han revolucionado numerosas industrias, transformando fundamentalmente cómo operan las empresas y cómo los consumidores interactúan con plataformas digitales.",
        vocabulary: [
          { word: "avances tecnológicos", translation: "technological advances" },
          { word: "revolucionado", translation: "revolutionized" },
          { word: "numerosas", translation: "numerous" },
          { word: "fundamentalmente", translation: "fundamentally" }
        ],
        wordCount: 26,
        complexity: "Intermediate"
      }
    },
    French: {
      Beginner: {
        text: "Les nouvelles technologies d'intelligence artificielle ont changé beaucoup d'industries. Maintenant les entreprises travaillent différemment et les gens utilisent les plateformes numériques d'une nouvelle façon.",
        vocabulary: [
          { word: "technologies", translation: "technologies" },
          { word: "intelligence artificielle", translation: "artificial intelligence" },
          { word: "industries", translation: "industries" },
          { word: "entreprises", translation: "businesses" }
        ],
        wordCount: 28,
        complexity: "Beginner"
      }
    }
  }
};

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
  
  // Demo state for split-screen
  const [demoLanguage, setDemoLanguage] = useState('Spanish');
  const [demoLevel, setDemoLevel] = useState('Beginner');
  const [showOriginal, setShowOriginal] = useState(true);

  const handleAuthUser = useCallback(async (user) => {
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
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // Check for authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        handleAuthUser(user);
      } else {
        // Fallback to old localStorage method
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
          checkUserCredits(savedEmail);
        } else {
          // Redirect to landing page if not authenticated
          window.location.href = '/landing';
        }
      }
    };

    initAuth();
    
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
  }, [handleAuthUser]);

  const checkUserCredits = async (userEmail) => {
    try {
      const { data } = await supabase
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

  // Helper function to get demo content
  const getDemoContent = () => {
    const adapted = DEMO_CONTENT.adapted[demoLanguage]?.[demoLevel];
    return adapted || DEMO_CONTENT.adapted.Spanish.Beginner;
  };

  // Auto-cycle demo text every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setShowOriginal(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {!isRegistered ? (
        // New split-screen landing page
        <div className="min-h-screen flex">
          {/* Left Panel - Authentication */}
          <div className="w-2/5 bg-gray-50 flex flex-col justify-center px-8 lg:px-12">
            <div className="max-w-md mx-auto w-full">
              {/* Logo & Brand */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{fontFamily: "'Playfair Display', serif"}}>
                  Language Lite
                </h1>
                <p className="text-xl text-gray-600">
                  Transform any text into perfect learning material
                </p>
              </div>

              {/* Value Props */}
              <div className="mb-8 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Read what interests you at your exact level</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">Instant vocabulary explanations</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">35+ languages supported</p>
                </div>
              </div>

              {/* Auth Component */}
              <div className="bg-white border border-gray-200 shadow-lg p-6 rounded-lg">
                <div className="mb-4">
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-4">
                    <p className="text-sm text-indigo-800">
                      Get <strong>6 free credits</strong> immediately, plus <strong>2 credits daily</strong>
                    </p>
                  </div>
                </div>
                
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
                      container: 'auth-container-new',
                      button: 'auth-button-new',
                    },
                  }}
                  providers={['google', 'facebook']}
                  redirectTo="https://language-lite.com"
                  onlyThirdPartyProviders={false}
                  view="magic_link"
                  showLinks={false}
                  localization={{
                    variables: {
                      magic_link: {
                        email_input_label: 'Email Address',
                        email_input_placeholder: 'you@example.com',
                        button_label: 'Start Learning →',
                        loading_button_label: 'Sending magic link...',
                        link_text: ''
                      },
                    },
                  }}
                />
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Trusted by 10,000+ language learners worldwide
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Live Demo */}
          <div className="w-3/5 bg-gradient-to-br from-indigo-600 to-purple-700 flex flex-col justify-center px-8 lg:px-12 text-white">
            <div className="max-w-2xl mx-auto w-full">
              {/* Demo Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
                  See It In Action
                </h2>
                <p className="text-indigo-100 text-lg">
                  Watch how complex text transforms into perfect learning material
                </p>
              </div>

              {/* Language Controls */}
              <div className="mb-6 flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex-1 min-w-48">
                  <label className="block text-sm font-medium text-indigo-100 mb-2">
                    Learning Language
                  </label>
                  <select
                    value={demoLanguage}
                    onChange={(e) => setDemoLanguage(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="Spanish" className="text-gray-900">🇪🇸 Spanish</option>
                    <option value="French" className="text-gray-900">🇫🇷 French</option>
                  </select>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex-1 min-w-32">
                  <label className="block text-sm font-medium text-indigo-100 mb-2">
                    Your Level
                  </label>
                  <select
                    value={demoLevel}
                    onChange={(e) => setDemoLevel(e.target.value)}
                    className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="Beginner" className="text-gray-900">Beginner</option>
                    <option value="Intermediate" className="text-gray-900">Intermediate</option>
                  </select>
                </div>
              </div>

              {/* Text Transformation Demo */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {showOriginal ? 'Original Text (English)' : `Adapted Text (${demoLanguage})`}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full transition-colors ${showOriginal ? 'bg-red-400' : 'bg-green-400'}`}></div>
                    <span className="text-sm text-indigo-100">
                      {showOriginal ? 'Complex' : getDemoContent().complexity}
                    </span>
                  </div>
                </div>
                
                <div className="bg-white/95 rounded-lg p-4 text-gray-900 min-h-24">
                  <p className="leading-relaxed transition-all duration-500">
                    {showOriginal ? DEMO_CONTENT.original.text : getDemoContent().text}
                  </p>
                </div>
                
                <div className="mt-4 flex justify-between items-center text-sm text-indigo-100">
                  <span>
                    Words: {showOriginal ? DEMO_CONTENT.original.wordCount : getDemoContent().wordCount}
                  </span>
                  <span className="text-yellow-300">
                    Auto-switching every 3 seconds
                  </span>
                </div>
              </div>

              {/* Vocabulary Preview */}
              {!showOriginal && getDemoContent().vocabulary && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Key Vocabulary
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {getDemoContent().vocabulary.slice(0, 4).map((word, index) => (
                      <div key={index} className="bg-yellow-400/20 border border-yellow-400/30 rounded-md p-3">
                        <div className="font-medium text-yellow-300">{word.word}</div>
                        <div className="text-sm text-yellow-100">{word.translation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="mt-8 text-center">
                <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg inline-flex items-center space-x-2 font-semibold">
                  <span>Start learning with your own text</span>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Existing authenticated view
        <>
          <header className="bg-gray-900 text-white shadow-lg">
            <div className="container mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-white">Language Lite</h1>
                  <p className="text-gray-300 text-sm">
                    AI-powered language adaptation
                  </p>
                </div>
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
              </div>
            </div>
          </header>

          <div className="container mx-auto px-4 py-8 max-w-4xl">
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
        </>
      )}
    </main>
  );
}