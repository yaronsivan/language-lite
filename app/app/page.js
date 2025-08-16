'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const LANGUAGES = [
  'Hebrew', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian',
  'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Greek', 'Turkish', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Persian',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay', 'Tagalog', 'Swahili', 'Yoruba', 'Zulu', 'Amharic', 'English'
];

const PROCESSING_WORDS = ['Reading', 'Analyzing', 'Modifying', 'Reviewing', 'Adapting', 'Highlighting'];

export default function AppPage() {
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [credits, setCredits] = useState(0);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('Beginner');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [processingWordIndex, setProcessingWordIndex] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        handleAuthUser(user);
      } else {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
          checkUserCredits(savedEmail);
        } else {
          window.location.href = '/';
        }
      }
    };

    initAuth();
    
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
  }, []);

  // Load user preferences or demo defaults
  useEffect(() => {
    if (isRegistered) {
      const savedLanguage = localStorage.getItem('lastLanguage') || 'Spanish';
      const savedLevel = localStorage.getItem('lastLevel') || 'Beginner';
      setLanguage(savedLanguage);
      setLevel(savedLevel);
    }
  }, [isRegistered]);

  // Processing words animation
  useEffect(() => {
    let interval;
    if (isAdapting && !isTyping) {
      interval = setInterval(() => {
        setProcessingWordIndex(prev => (prev + 1) % PROCESSING_WORDS.length);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isAdapting, isTyping]);

  const handleAuthUser = useCallback(async (user) => {
    const userEmail = user.email;
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('credits, language, level')
      .eq('email', userEmail)
      .single();

    if (existingUser) {
      setEmail(userEmail);
      setCredits(existingUser.credits);
      setLanguage(existingUser.language || 'Spanish');
      setLevel(existingUser.level || 'Beginner');
      setIsRegistered(true);
    } else {
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

  const checkUserCredits = async (userEmail) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('credits, language, level')
        .eq('email', userEmail)
        .single();

      if (data) {
        setEmail(userEmail);
        setCredits(data.credits);
        setLanguage(data.language || 'Spanish');
        setLevel(data.level || 'Beginner');
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Error checking credits:', error);
    }
  };

  const typewriterEffect = (text) => {
    setIsTyping(true);
    setTypedText('');
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypedText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 20); // Fast typing effect
  };

  const renderHighlightedText = (text, vocabulary) => {
    if (!vocabulary || vocabulary.length === 0) return text;
    
    let result = text;
    const elements = [];
    let lastIndex = 0;
    
    vocabulary.forEach((item, idx) => {
      const word = typeof item === 'string' ? item : item.word;
      const translation = typeof item === 'string' ? word : item.translation;
      const index = result.toLowerCase().indexOf(word.toLowerCase(), lastIndex);
      
      if (index !== -1) {
        // Add text before highlight
        if (index > lastIndex) {
          elements.push(result.substring(lastIndex, index));
        }
        
        // Add highlighted word
        elements.push(
          <span 
            key={idx}
            className="relative inline-block"
            onMouseEnter={() => setActiveTooltip(idx)}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <span className="bg-yellow-200 px-1 rounded cursor-pointer">
              {result.substring(index, index + word.length)}
            </span>
            {activeTooltip === idx && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                {translation}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </span>
        );
        
        lastIndex = index + word.length;
      }
    });
    
    // Add remaining text
    if (lastIndex < result.length) {
      elements.push(result.substring(lastIndex));
    }
    
    return elements;
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

    // Save preferences
    localStorage.setItem('lastLanguage', language);
    localStorage.setItem('lastLevel', level);

    setIsAdapting(true);
    setIsAnimating(true);
    setAdaptedResult(null);
    setProcessingWordIndex(0);

    try {
      const response = await fetch('/api/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, level }),
      });

      const data = await response.json();
      
      // Start typewriter effect
      setTimeout(() => {
        typewriterEffect(data.adaptedText);
        setAdaptedResult(data);
      }, 1000);

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
          language,
          level,
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
      setTimeout(() => {
        setIsAdapting(false);
      }, 2000);
    }
  };

  if (!isRegistered) {
    return <div className="min-h-screen bg-[#ffb238] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-900">Loading...</p>
      </div>
    </div>;
  }

  return (
    <main className="min-h-screen bg-[#ffb238] transition-all duration-500">
      <div className={`flex transition-all duration-700 ${isAnimating ? 'transform' : ''}`}>
        {/* Left Side - Input */}
        <div className={`${isAnimating ? 'w-1/2' : 'w-full'} p-8 transition-all duration-700`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4 font-zain">
                Language Lite - adapt any text to your level of reading
              </h1>
              
              {/* User Info */}
              <div className="flex justify-center items-center gap-6 mb-6">
                <span className="text-gray-700">Welcome, {email.split('@')[0]}</span>
                <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold">
                  {credits} credits remaining
                </span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem('userEmail');
                    window.location.href = '/';
                  }}
                  className="text-gray-700 hover:text-gray-900 underline"
                >
                  Sign out
                </button>
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <div className="border border-black bg-white p-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 resize-none border-none outline-none font-bodoni text-lg leading-relaxed"
                  placeholder="Paste here..."
                  style={{ fontFamily: 'Bodoni Moda, serif' }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Target Language
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Adapt Button */}
            <div className="text-center">
              <button
                onClick={handleAdapt}
                disabled={isAdapting || credits <= 0 || !text.trim()}
                className={`px-8 py-4 font-bold text-lg rounded-lg transition-colors ${
                  isAdapting || credits <= 0 || !text.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isAdapting ? 'Adapting...' : 'Adapt Text'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Results */}
        {isAnimating && (
          <div className="w-1/2 p-8 bg-[#e8e9eb] transition-all duration-700">
            <div className="max-w-3xl">
              {!adaptedResult ? (
                // Processing Animation
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-700 mb-4">
                      {PROCESSING_WORDS[processingWordIndex]}...
                    </div>
                    <div className="flex space-x-2 justify-center">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 bg-gray-700 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Results
                <div>
                  {/* Adapted Text */}
                  <div className="border border-black bg-white p-6 mb-6">
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adapted Text ({language} - {level})
                      </span>
                    </div>
                    <div className="font-bodoni text-lg leading-relaxed text-gray-800">
                      {isTyping ? (
                        <span>
                          {typedText}
                          <span className="animate-pulse">|</span>
                        </span>
                      ) : (
                        renderHighlightedText(adaptedResult.adaptedText, adaptedResult.vocabulary)
                      )}
                    </div>
                  </div>

                  {/* Vocabulary Table */}
                  {adaptedResult.vocabulary && adaptedResult.vocabulary.length > 0 && !isTyping && (
                    <div className="bg-white border border-gray-300 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        New Vocabulary
                      </h3>
                      <div className="overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-semibold text-gray-700">Word</th>
                              <th className="text-left py-2 font-semibold text-gray-700">Translation</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adaptedResult.vocabulary.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 font-medium text-gray-900">
                                  {typeof item === 'string' ? item : item.word}
                                </td>
                                <td className="py-3 text-gray-700">
                                  {typeof item === 'string' ? item : item.translation}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Zain:wght@700;800;900&family=Inter:wght@400;500;600;700&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600&display=swap');
        
        .font-zain {
          font-family: 'Zain', sans-serif;
        }
        
        .font-bodoni {
          font-family: 'Bodoni Moda', serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </main>
  );
}