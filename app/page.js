'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      checkUserCredits(savedEmail);
    }
  }, []);

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
                Get Started
              </h2>
              <p className="text-gray-700 mb-6">
                Sign up to receive <strong>6 free credits</strong> immediately, plus <strong>2 credits daily</strong> forever.
              </p>
              
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 border-2 border-gray-300 text-black focus:border-gray-600 focus:outline-none mb-2"
              />
              <p className="text-sm text-gray-600 mb-4">
                We&#39;ll only use this to save your credits and progress.
              </p>
              
              <button
                onClick={handleRegister}
                className="w-full bg-gray-900 text-white font-bold py-3 hover:bg-gray-800 transition-colors"
              >
                Start Learning →
              </button>
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
      </div>
    </main>
  );
}