'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from 'next/link';

const DEMO_CONTENT = {
  original: {
    title: "Climate Change Impact on Global Economy",
    text: "The ramifications of anthropogenic climate change are increasingly manifesting in economic paradigms worldwide. Multinational corporations are implementing comprehensive sustainability protocols while simultaneously navigating volatile commodity markets. The juxtaposition of environmental imperatives against profit maximization creates unprecedented challenges for contemporary business leaders.",
    wordCount: 42,
    readingTime: "2 min"
  },
  adapted: {
    Spanish: {
      Beginner: {
        title: "El Cambio Climático y el Dinero",
        text: "El cambio climático afecta el dinero en todo el mundo. Las grandes empresas ahora cuidan más el planeta. Pero también quieren ganar dinero. Esto es difícil. Los jefes de empresas tienen problemas nuevos. Necesitan pensar en el planeta y en el dinero al mismo tiempo.",
        wordCount: 46,
        vocabulary: [
          { word: "cambio climático", translation: "climate change" },
          { word: "empresas", translation: "companies" },
          { word: "planeta", translation: "planet" },
          { word: "ganar dinero", translation: "make money" }
        ]
      },
      Intermediate: {
        title: "El Impacto del Cambio Climático en la Economía",
        text: "El cambio climático causado por los humanos está afectando la economía mundial. Las empresas internacionales están creando planes para ser más sostenibles. Al mismo tiempo, tienen que manejar mercados que cambian mucho. Es complicado porque las empresas quieren proteger el ambiente pero también necesitan ganancias.",
        wordCount: 44,
        vocabulary: [
          { word: "sostenibles", translation: "sustainable" },
          { word: "mercados", translation: "markets" },
          { word: "ganancias", translation: "profits" },
          { word: "manejar", translation: "manage" }
        ]
      }
    },
    French: {
      Beginner: {
        title: "Le Climat Change et l'Argent",
        text: "Le climat change et cela touche l'argent dans le monde. Les grandes sociétés font attention à la planète maintenant. Mais elles veulent aussi gagner de l'argent. C'est difficile. Les chefs d'entreprise ont de nouveaux problèmes. Ils doivent penser à la planète et à l'argent ensemble.",
        wordCount: 45,
        vocabulary: [
          { word: "climat", translation: "climate" },
          { word: "sociétés", translation: "companies" },
          { word: "planète", translation: "planet" },
          { word: "ensemble", translation: "together" }
        ]
      }
    }
  }
};

export default function LandingPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('Spanish');
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [showAdapted, setShowAdapted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        window.location.href = '/';
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        window.location.href = '/';
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Auto-cycle between original and adapted every 3 seconds
    const interval = setInterval(() => {
      setShowAdapted(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentContent = showAdapted 
    ? DEMO_CONTENT.adapted[selectedLanguage]?.[selectedLevel] || DEMO_CONTENT.adapted.Spanish.Beginner
    : DEMO_CONTENT.original;

  return (
    <main className="min-h-screen flex">
      {/* Left Panel - Auth */}
      <div className="w-full lg:w-2/5 bg-white flex flex-col justify-center p-8 lg:p-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2 font-serif">
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
              redirectTo="https://language-lite.com"
              onlyThirdPartyProviders={false}
              view="magic_link"
              showLinks={false}
              localization={{
                variables: {
                  magic_link: {
                    email_input_label: 'Email Address',
                    email_input_placeholder: 'you@example.com',
                    button_label: 'Get Started Free →',
                    loading_button_label: 'Sending magic link...',
                  },
                },
              }}
            />
          </div>

          {/* Trust Indicator */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Join 1,000+ language learners reading at their level
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Demo */}
      <div className="hidden lg:flex w-3/5 bg-gradient-to-br from-indigo-500 to-purple-600 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute transform rotate-45 -right-40 -top-40 w-80 h-80 bg-white rounded-full"></div>
          <div className="absolute transform rotate-45 -left-40 -bottom-40 w-80 h-80 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Demo Controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
            <h3 className="text-white font-semibold mb-4">Try it live:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/80 text-sm block mb-2">Target Language</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-white/90 backdrop-blur text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="Spanish">🇪🇸 Spanish</option>
                  <option value="French">🇫🇷 French</option>
                </select>
              </div>
              <div>
                <label className="text-white/80 text-sm block mb-2">Your Level</label>
                <select 
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-white/90 backdrop-blur text-gray-900 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                </select>
              </div>
            </div>
          </div>

          {/* Demo Content */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500">
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                showAdapted 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {showAdapted ? '✨ Adapted' : '📄 Original'}
              </span>
              <span className="text-sm text-gray-500">
                {currentContent.wordCount} words • {currentContent.readingTime || '1 min'}
              </span>
            </div>

            {/* Article */}
            <article>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
                {currentContent.title}
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {currentContent.text}
              </p>
            </article>

            {/* Vocabulary Preview */}
            {showAdapted && currentContent.vocabulary && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Vocabulary</h3>
                <div className="grid grid-cols-2 gap-2">
                  {currentContent.vocabulary.map((item, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                      <span className="font-medium text-gray-900">{item.word}</span>
                      <span className="text-gray-500 text-sm ml-2">→ {item.translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center mt-6">
            <p className="text-white/90">
              Ready to read at your level? 
              <span className="font-semibold ml-2">← Sign up free</span>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-serif {
          font-family: 'Playfair Display', serif;
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