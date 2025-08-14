'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [level, setLevel] = useState('Beginner');
  const [email, setEmail] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedResult, setAdaptedResult] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const handleAdapt = async () => {
    if (!text.trim()) {
      alert('Please enter some text to adapt!');
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
      
      // Animate the result in
      setTimeout(() => {
        setAdaptedResult(data);
        setShowEmailCapture(true);
      }, 500);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to adapt text. Please try again.');
    } finally {
      setIsAdapting(false);
    }
  };

  const saveEmail = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, language, level }]);

      if (error) {
        if (error.code === '23505') {
          alert('This email is already on our waitlist!');
        } else {
          throw error;
        }
      } else {
        setEmailSaved(true);
      }
    } catch (error) {
      console.error('Error saving email:', error);
      alert('Failed to save email. Please try again.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section with fade-in animation */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 animate-slide-down">
            Language Lite ✨
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-slide-up">
            Your AI-powered language learning companion that adapts everything to YOUR level
          </p>
          <div className="inline-block animate-pulse">
            <button 
              onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
            >
              Try Demo Below 👇
            </button>
          </div>
        </div>

        {/* Demo Section */}
        <div id="demo" className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all hover:shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Try it now - Paste any text!</h2>
            
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg mb-4 transition-all focus:border-blue-500 focus:shadow-md"
              rows="4"
              placeholder="Paste an article, news story, or any text here..."
            />
            
            <div className="flex gap-4 mb-4">
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
              >
                <option>Hebrew</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Italian</option>
                <option>Portuguese</option>
                <option>Chinese</option>
                <option>Japanese</option>
              </select>
              
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500 transition-all"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
            
            <button 
              onClick={handleAdapt}
              disabled={isAdapting}
              className={`w-full py-3 rounded-lg font-semibold transition-all transform ${
                isAdapting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isAdapting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adapting with AI...
                </span>
              ) : (
                'Adapt This Text! 🎯'
              )}
            </button>
          </div>

          {/* Adapted Result with slide-in animation */}
          {adaptedResult && (
            <div className="mt-8 animate-slide-in">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold mb-4 text-green-800">
                  Adapted for {level} {language} Learners 🎉
                </h3>
                
                <div className="bg-white rounded-lg p-6 mb-6">
                  <p className="text-gray-800 leading-relaxed">
                    {adaptedResult.adaptedText}
                  </p>
                </div>

                  {adaptedResult.vocabulary && Array.isArray(adaptedResult.vocabulary) && (
                    <div className="mb-6">
                      <h4 className="font-bold text-lg mb-3">📚 Key Vocabulary:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {adaptedResult.vocabulary.map((word, index) => (
                            <div 
                              key={index}
                              className="bg-white rounded-lg p-3 transform transition-all hover:scale-105 hover:shadow-md animate-fade-in-delayed"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <span className="font-semibold text-blue-600">
                                {typeof word === 'string' ? word : (word.word || word.term || 'Unknown')}
                              </span>
                              {typeof word === 'object' && word.translation && (
                                <span className="text-gray-600"> - {word.translation}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                {/* Email Capture */}
                {showEmailCapture && !emailSaved && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 animate-bounce-in">
                    <h4 className="font-bold text-lg mb-3">🚀 Want the full experience?</h4>
                    <p className="text-gray-700 mb-4">
                      Join our waitlist to get browser extension, unlimited adaptations, and your personal language podcast!
                    </p>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-blue-500"
                      />
                      <button
                        onClick={saveEmail}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105"
                      >
                        Join Waitlist
                      </button>
                    </div>
                  </div>
                )}

                {emailSaved && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center animate-bounce-in">
                    <h4 className="font-bold text-lg text-green-800 mb-2">🎉 You're on the list!</h4>
                    <p className="text-gray-700">
                      We'll notify you when Language Lite launches. Get ready to revolutionize your language learning!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features remain the same */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Coming Soon</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '🧠', title: 'Language Reflection', desc: 'Map your entire language knowledge' },
              { icon: '🎧', title: 'Personal Podcast', desc: 'Weekly AI-generated learning summary' },
              { icon: '💡', title: 'Hintz', desc: 'Mnemonics based on YOUR interests' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-lg shadow transform transition-all hover:scale-105 hover:shadow-xl animate-fade-in-delayed"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="font-bold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0;
            transform: translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in {
          from { 
            opacity: 0;
            transform: translateX(-20px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-in {
          0% { 
            opacity: 0;
            transform: scale(0.3);
          }
          50% { 
            transform: scale(1.05);
          }
          70% { 
            transform: scale(0.9);
          }
          100% { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        
        .animate-fade-in-delayed {
          opacity: 0;
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}