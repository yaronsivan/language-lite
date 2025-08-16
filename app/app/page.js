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
  const [motivationalQuotes, setMotivationalQuotes] = useState(null);
  const [currentQuote, setCurrentQuote] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReferralPopup, setShowReferralPopup] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
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

  // Load translations and motivational quotes
  useEffect(() => {
    // Load translations
    fetch('/translations.yaml')
      .then(res => res.text())
      .then(text => {
        const content = yaml.load(text);
        setTranslations(content);
      })
      .catch(err => console.error('Error loading translations:', err));

    // Load motivational quotes
    fetch('/motivational-quotes.yaml')
      .then(res => res.text())
      .then(text => {
        const content = yaml.load(text);
        setMotivationalQuotes(content);
      })
      .catch(err => console.error('Error loading motivational quotes:', err));
  }, []);

  // Update motivational quote during processing
  useEffect(() => {
    if (isAdapting && motivationalQuotes && !isTyping) {
      const quotes = motivationalQuotes.quotes[motherTongue] || motivationalQuotes.quotes.English;
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setCurrentQuote(randomQuote);
    }
  }, [isAdapting, motivationalQuotes, motherTongue, processingWordIndex, isTyping]);

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
      }, 2000); // Much slower - 2 seconds per word
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

  const shareToWhatsApp = () => {
    const text = `Check out this adapted text from Language Lite:\n\n${adaptedResult.adaptedText}\n\nVocabulary:\n${adaptedResult.vocabulary.map(item => `• ${item.word}: ${item.translation}`).join('\n')}\n\nTry it yourself at language-lite.com`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent('Adapted Text from Language Lite');
    const body = encodeURIComponent(`I adapted this text using Language Lite:\n\n${adaptedResult.adaptedText}\n\nVocabulary:\n${adaptedResult.vocabulary.map(item => `• ${item.word}: ${item.translation}`).join('\n')}\n\nCheck out Language Lite at language-lite.com`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Just adapted text to my learning level with Language Lite! 📚✨ Check it out: language-lite.com`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const generateReferralLink = async () => {
    setIsGeneratingReferral(true);
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referrerEmail: email,
          action: 'generate'
        }),
      });

      const data = await response.json();
      if (data.referralCode) {
        setReferralCode(data.referralCode);
        setReferralLink(data.shareLink);
      }
    } catch (error) {
      console.error('Error generating referral link:', error);
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  const shareReferralToWhatsApp = () => {
    const text = `Hey! I've been using Language Lite to adapt texts to my reading level and it's amazing! 📚✨\n\nYou can try it for free here: ${referralLink}\n\nWhen you sign up, we both get 20 extra credits! 🎉`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const shareReferralToEmail = () => {
    const subject = encodeURIComponent('Try Language Lite - Get Free Credits!');
    const body = encodeURIComponent(`Hi!\n\nI've been using Language Lite to adapt texts to my reading level and it's fantastic!\n\nYou can try it for free here: ${referralLink}\n\nWhen you sign up using this link, we both get 20 extra credits!\n\nCheck it out: language-lite.com`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const renderHighlightedText = (text, vocabulary) => {
    if (!vocabulary || vocabulary.length === 0) {
      // Split by double line breaks to preserve paragraphs
      return text.split('\n\n').map((paragraph, pIndex) => (
        <p key={pIndex} className="mb-4 last:mb-0">
          {paragraph.replace(/\n/g, ' ')}
        </p>
      ));
    }
    
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
    
    // Convert the elements array to text, then split by paragraphs
    const fullText = elements.map(el => typeof el === 'string' ? el : el.props.children[0].props.children).join('');
    const paragraphs = fullText.split('\n\n');
    
    // Re-process each paragraph to maintain highlights
    return paragraphs.map((paragraph, pIndex) => {
      const paragraphElements = [];
      let paragraphLastIndex = 0;
      
      vocabulary.forEach((item, idx) => {
        const word = typeof item === 'string' ? item : item.word;
        const translation = typeof item === 'string' ? word : item.translation;
        const index = paragraph.toLowerCase().indexOf(word.toLowerCase(), paragraphLastIndex);
        
        if (index !== -1) {
          // Add text before highlight
          if (index > paragraphLastIndex) {
            paragraphElements.push(paragraph.substring(paragraphLastIndex, index));
          }
          
          // Add highlighted word
          paragraphElements.push(
            <span 
              key={`p${pIndex}-${idx}`}
              className="relative inline-block"
              onMouseEnter={() => setActiveTooltip(`p${pIndex}-${idx}`)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <span className="bg-yellow-200 px-1 rounded cursor-pointer">
                {paragraph.substring(index, index + word.length)}
              </span>
              {activeTooltip === `p${pIndex}-${idx}` && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm whitespace-nowrap z-10 font-sans">
                  {translation}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </span>
          );
          
          paragraphLastIndex = index + word.length;
        }
      });
      
      // Add remaining text in paragraph
      if (paragraphLastIndex < paragraph.length) {
        paragraphElements.push(paragraph.substring(paragraphLastIndex));
      }
      
      return (
        <p key={pIndex} className="mb-4 last:mb-0">
          {paragraphElements.length > 0 ? paragraphElements : paragraph.replace(/\n/g, ' ')}
        </p>
      );
    });
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
        body: JSON.stringify({ text, language, level, motherTongue }),
      });

      const data = await response.json();
      
      // Check if the response was successful
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
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
      console.error('Error in handleAdapt:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        requestData: { text: text.substring(0, 100), language, level, motherTongue }
      });
      alert(`Failed to adapt text: ${error.message}`);
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
      {/* Top Navigation Bar */}
      <div className="bg-[#ffb238] bg-opacity-80 p-3">
        <div className="flex justify-between items-center">
          {/* Left: Language Lite + Credits */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 font-zain">Language Lite</h1>
            <span className="bg-gray-900 text-white px-3 py-1 text-sm font-semibold">
              {credits} credits remaining
            </span>
          </div>

          {/* Right: Send to Friend + Menu */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setShowReferralPopup(true);
                if (!referralLink) {
                  generateReferralLink();
                }
              }}
              className="text-sm text-gray-700 hover:text-gray-900 underline"
            >
              Share & Earn Credits
            </button>
            
            {/* Hamburger Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                  <div className="py-2">
                    <button 
                      onClick={() => setShowPremiumPopup(true)}
                      className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>Adaptive Learning Path</span>
                      <span className="text-yellow-500">👑</span>
                    </button>
                    <button 
                      onClick={() => setShowPremiumPopup(true)}
                      className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>Custom Reading Library</span>
                      <span className="text-yellow-500">👑</span>
                    </button>
                    <button 
                      onClick={() => setShowPremiumPopup(true)}
                      className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>Word Mastery Vault</span>
                      <span className="text-yellow-500">👑</span>
                    </button>
                    <button 
                      onClick={() => setShowPremiumPopup(true)}
                      className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>Learn Everywhere</span>
                      <span className="text-yellow-500">👑</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => window.location.href = '/upgrade'}
                      className="w-full px-4 py-2 text-left text-gray-900 hover:bg-gray-50 font-medium"
                    >
                      Upgrade
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        localStorage.removeItem('userEmail');
                        window.location.href = '/';
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className={`flex flex-col lg:flex-row transition-all duration-700 ${isAnimating ? 'transform' : ''}`}>
        {/* Left Side - Input */}
        <div className={`${isAnimating ? 'lg:w-1/3 w-full' : 'w-full'} p-4 lg:p-8 transition-all duration-700`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-left mb-8">
              <h2 className="text-lg text-gray-700 font-light uppercase tracking-wide">ADAPT ANY TEXT TO YOUR LEVEL OF READING:</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {getTranslation('targetLanguage')}
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
                  {getTranslation('yourLevel')}
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
                  {getTranslation('motherTongue')}
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
                {isAdapting ? getTranslation('adapting') : getTranslation('adaptText')}
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
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="text-lg text-gray-700 font-bodoni">
                      {PROCESSING_WORDS[processingWordIndex]}
                    </div>
                    <svg className="w-5 h-5 text-gray-700 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                  </div>
                  {currentQuote && (
                    <div className="text-center px-6 max-w-md">
                      <p className="text-sm text-gray-600 italic">
                        &ldquo;{currentQuote}&rdquo;
                      </p>
                    </div>
                  )}
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
                      <div className="flex gap-2">
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
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Share adapted text"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                            </svg>
                            Share
                          </button>
                          
                          {showShareMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => shareToWhatsApp()}
                                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="text-green-600">📱</span> WhatsApp
                                </button>
                                <button
                                  onClick={() => shareToEmail()}
                                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="text-blue-600">📧</span> Email
                                </button>
                                <button
                                  onClick={() => shareToTwitter()}
                                  className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <span className="text-blue-400">🐦</span> Twitter
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="font-bodoni text-lg leading-relaxed text-gray-800"
                      dir={RTL_LANGUAGES.includes(lastAdaptedLanguage) ? 'rtl' : 'ltr'}
                    >
                      {isTyping ? (
                        <div>
                          {typedText.split('\n\n').map((paragraph, pIndex) => (
                            <p key={pIndex} className="mb-4 last:mb-0">
                              {paragraph.replace(/\n/g, ' ')}
                            </p>
                          ))}
                          <span className="animate-pulse">|</span>
                        </div>
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

      {/* Referral Popup */}
      {showReferralPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share & Earn Credits</h3>
              <p className="text-gray-600 mb-6">
                Share Language Lite with friends and earn 20 credits when they sign up!
              </p>
              
              {isGeneratingReferral ? (
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Generating your referral link...</p>
                </div>
              ) : referralLink ? (
                <div className="mb-6">
                  <div className="bg-gray-100 p-3 rounded border mb-4">
                    <p className="text-xs text-gray-600 mb-1">Your referral link:</p>
                    <p className="text-sm font-mono break-all">{referralLink}</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={shareReferralToWhatsApp}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      <span>📱</span> Share on WhatsApp
                    </button>
                    <button
                      onClick={shareReferralToEmail}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      <span>📧</span> Share via Email
                    </button>
                    <button
                      onClick={copyReferralLink}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      <span>📋</span> Copy Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-red-500">Failed to generate referral link. Please try again.</p>
                </div>
              )}
              
              <button
                onClick={() => setShowReferralPopup(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Feature Popup */}
      {showPremiumPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Premium Features</h3>
              <p className="text-gray-600 mb-6">
                For just $1 a month, get access to all these premium features and more:
              </p>
              <ul className="text-left text-gray-700 mb-6 space-y-2">
                <li>• Personalized level assessments</li>
                <li>• Save and organize your texts</li>
                <li>• Personal vocabulary collection</li>
                <li>• Browser extension</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPremiumPopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowPremiumPopup(false);
                    window.location.href = '/upgrade';
                  }}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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