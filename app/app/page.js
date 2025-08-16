'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import yaml from 'js-yaml';

const LANGUAGES = [
  'Hebrew', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Russian',
  'Ukrainian', 'Czech', 'Romanian', 'Hungarian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Greek', 'Turkish', 'Arabic', 'Hindi', 'Bengali', 'Urdu', 'Persian',
  'Chinese (Simplified)', 'Chinese (Traditional)', 'Japanese', 'Korean', 'Vietnamese', 'Thai',
  'Indonesian', 'Malay', 'Tagalog', 'Swahili', 'Yoruba', 'Zulu', 'Amharic', 'English'
];

const RTL_LANGUAGES = ['Hebrew', 'Arabic', 'Urdu', 'Persian'];

const PROCESSING_WORDS = ['Reading', 'Analyzing', 'Modifying', 'Reviewing', 'Adapting', 'Highlighting'];

export default function AppPage() {
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [credits, setCredits] = useState(0);
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('Beginner');
  const [motherTongue, setMotherTongue] = useState('English');
  const [lastAdaptedLanguage, setLastAdaptedLanguage] = useState('Spanish');
  const [lastAdaptedLevel, setLastAdaptedLevel] = useState('Beginner');
  const [translations, setTranslations] = useState(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [processingWordIndex, setProcessingWordIndex] = useState(0);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedTable, setCopiedTable] = useState(false);
  
  const typingTimeoutRef = useRef(null);

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
  }, [handleAuthUser]);

  // Load translations
  useEffect(() => {
    fetch('/translations.yaml')
      .then(res => res.text())
      .then(text => {
        const content = yaml.load(text);
        setTranslations(content);
      })
      .catch(err => console.error('Error loading translations:', err));
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
    }, 5); // Very fast typing effect
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'text') {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      } else if (type === 'table') {
        setCopiedTable(true);
        setTimeout(() => setCopiedTable(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getTranslation = (key) => {
    if (!translations || !translations.languages[motherTongue]) {
      return translations?.languages?.English?.[key] || key;
    }
    return translations.languages[motherTongue][key] || key;
  };

  const formatTableForCopy = (vocabulary) => {
    if (!vocabulary || vocabulary.length === 0) return '';
    
    let result = `${getTranslation('word')}\t${getTranslation('translation')}\n`;
    vocabulary.forEach(item => {
      const word = typeof item === 'string' ? item : item.word;
      const translation = typeof item === 'string' ? item : item.translation;
      result += `${word}\t${translation}\n`;
    });
    return result;
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
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm whitespace-nowrap z-10 font-sans">
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
    setLastAdaptedLanguage(language);
    setLastAdaptedLevel(level);

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
      {/* User Info Bar */}
      <div className="bg-[#ffb238] bg-opacity-80 p-3">
        <div className="flex justify-center items-center gap-6 text-sm">
          <span className="text-gray-700">Welcome, {email.split('@')[0]}</span>
          <span className="bg-gray-900 text-white px-3 py-1 font-semibold">
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
      
      <div className={`flex transition-all duration-700 ${isAnimating ? 'transform' : ''}`}>
        {/* Left Side - Input */}
        <div className={`${isAnimating ? 'w-1/3' : 'w-full'} p-8 transition-all duration-700`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-left mb-8">
              <h1 className="mb-4">
                <span className="text-5xl font-bold text-gray-900 font-zain block">Language Lite</span>
                <span className="text-lg text-gray-700 font-light">adapt any text to your level of reading</span>
              </h1>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <div className="border border-black bg-white p-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-64 resize-none border-none outline-none font-bodoni text-lg leading-relaxed text-black"
                  placeholder="Paste here..."
                  style={{ fontFamily: 'Bodoni Moda, serif', color: 'black' }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Language
                </label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full ${isAnimating ? 'p-2 text-sm' : 'p-3'} border border-gray-300 bg-white text-gray-900 font-medium`}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Your Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className={`w-full ${isAnimating ? 'p-2 text-sm' : 'p-3'} border border-gray-300 bg-white text-gray-900 font-medium`}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  My Mother Tongue
                </label>
                <select
                  value={motherTongue}
                  onChange={(e) => setMotherTongue(e.target.value)}
                  className={`w-full ${isAnimating ? 'p-2 text-sm' : 'p-3'} border border-gray-300 bg-white text-gray-900 font-medium`}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Adapt Button */}
            <div className="text-right">
              <button
                onClick={handleAdapt}
                disabled={isAdapting || credits <= 0 || !text.trim()}
                className={`px-8 py-4 font-bold text-lg transition-colors ${
                  isAdapting || credits <= 0 || !text.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {isAdapting ? 'Adapting...' : 'Adapt Text'}
              </button>
            </div>

            {/* Footer Links */}
            <div className="absolute bottom-4 left-8 text-xs text-gray-600 space-x-4">
              <a href="/privacy" className="hover:text-gray-800 underline">Privacy Policy</a>
              <a href="/delete-account" className="hover:text-gray-800 underline">Data Deletion</a>
            </div>
          </div>
        </div>

        {/* Right Side - Results */}
        {isAnimating && (
          <div className="w-2/3 p-8 bg-[#e8e9eb] transition-all duration-700">
            <div className="max-w-3xl">
              {!adaptedResult ? (
                // Processing Animation
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-3">
                    <div className="text-lg text-gray-700 font-bodoni">
                      {PROCESSING_WORDS[processingWordIndex]}
                    </div>
                    <svg className="w-5 h-5 text-gray-700 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  </div>
                </div>
              ) : (
                // Results
                <div>
                  {/* Adapted Text */}
                  <div className="border border-black bg-white p-6 mb-6">
                    <div className="mb-3 flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {getTranslation('adaptedText')} ({lastAdaptedLanguage} - {lastAdaptedLevel})
                      </span>
                      <button
                        onClick={() => copyToClipboard(adaptedResult.adaptedText, 'text')}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        title="Copy adapted text"
                      >
                        {copiedText ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div 
                      className="font-bodoni text-lg leading-relaxed text-gray-800"
                      dir={RTL_LANGUAGES.includes(lastAdaptedLanguage) ? 'rtl' : 'ltr'}
                    >
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
                    <div className="bg-white border border-gray-300 p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getTranslation('newVocabulary')}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(formatTableForCopy(adaptedResult.vocabulary), 'table')}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="Copy vocabulary table"
                        >
                          {copiedTable ? (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 font-semibold text-gray-700">{getTranslation('word')}</th>
                              <th className="text-left py-2 font-semibold text-gray-700">{getTranslation('translation')}</th>
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