'use client';
import { useState } from 'react';

export default function UpgradePage() {
  const [showUnavailable, setShowUnavailable] = useState(false);

  const handleUpgrade = () => {
    setShowUnavailable(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      {/* Header */}
      <div className="bg-[#ffb238] p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 font-zain">Language Lite</h1>
          <button
            onClick={() => window.location.href = '/app'}
            className="text-gray-700 hover:text-gray-900"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Upgrade Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">👑</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">Unlock the full power of Language Lite</p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-yellow-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Premium Plan</h2>
            <div className="text-white">
              <span className="text-4xl font-bold">$1</span>
              <span className="text-lg">/month</span>
            </div>
            <p className="text-yellow-100 mt-2">Cancel anytime</p>
          </div>

          <div className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">What&apos;s Included:</h3>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Unlimited text adaptations
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Personalized level assessments
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Save and organize your texts
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Personal vocabulary collection
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Browser extension
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Advanced learning analytics
              </li>
              <li className="flex items-center text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Priority support
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold py-4 px-6 rounded-xl text-lg hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105"
            >
              Upgrade to Premium
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Secure payment powered by Stripe • Cancel anytime
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Trusted by thousands of language learners</p>
          <div className="flex justify-center items-center gap-8 text-gray-400">
            <div className="text-sm">🔒 Secure</div>
            <div className="text-sm">💯 Money-back guarantee</div>
            <div className="text-sm">⚡ Instant access</div>
          </div>
        </div>
      </div>

      {/* Service Unavailable Popup */}
      {showUnavailable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Service Temporarily Unavailable</h3>
              <p className="text-gray-600 mb-6">
                We&apos;re currently updating our payment system. Please try again later or contact support.
              </p>
              <button
                onClick={() => setShowUnavailable(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Zain:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        
        .font-zain {
          font-family: 'Zain', sans-serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </main>
  );
}