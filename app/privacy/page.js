import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 mb-4">
            <strong>Last updated: August 17, 2025</strong>
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Welcome to Language Lite</h2>
          <p className="text-gray-700 mb-4">
            We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we handle your information when you use Language Lite through our web application and Chrome extension.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">What We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Web Application & Chrome Extension</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Email address (for authentication and account management)</li>
            <li>Name (if provided through social login)</li>
            <li>Language learning preferences (selected languages and difficulty levels)</li>
            <li>Text content you submit for adaptation (temporarily processed, not permanently stored)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Chrome Extension Specific</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Authentication tokens:</strong> Securely stored locally to connect your extension with your Language Lite account</li>
            <li><strong>Selected website content:</strong> Only text that you explicitly select on webpages for adaptation</li>
            <li><strong>User preferences:</strong> Reading level and language settings stored locally in your browser</li>
            <li><strong>No automatic data collection:</strong> We never scan or collect webpage content without your explicit selection</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">How We Use Your Information</h2>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>To provide and maintain our language learning service across web and extension platforms</li>
            <li>To manage your account and credits</li>
            <li>To process your text adaptations using AI (both from web app and Chrome extension)</li>
            <li>To authenticate and secure your Chrome extension connection</li>
            <li>To store your preferences locally in your browser for better extension experience</li>
            <li>To communicate with you about service updates (only if you opt-in)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Data Security</h2>
          <p className="text-gray-700 mb-4">
            We use industry-standard security measures to protect your data. Your information is stored securely using Supabase&apos;s encrypted database. We never sell or share your personal information with third parties for marketing purposes.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Chrome Extension Security</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Local storage only:</strong> Your authentication tokens and preferences are stored locally in your browser, not on external servers</li>
            <li><strong>Secure communication:</strong> All data transmission between the extension and our servers uses HTTPS encryption</li>
            <li><strong>No background scanning:</strong> The extension only processes text when you explicitly select it</li>
            <li><strong>Minimal permissions:</strong> The extension only requests permissions necessary for its core functionality</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            We use the following services to operate Language Lite:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Supabase:</strong> For authentication and data storage</li>
            <li><strong>OpenAI:</strong> For text adaptation (content is processed but not stored by OpenAI)</li>
            <li><strong>Google/Facebook:</strong> For optional social authentication (if you choose to use it)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Your Rights</h2>
          <p className="text-gray-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt-out of any communications</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We keep your account data as long as your account is active. Text adaptations are processed in real-time and only stored temporarily for your session. You can request account deletion at any time.
          </p>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Chrome Extension Data Retention</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-4">
            <li><strong>Local data:</strong> Authentication tokens and preferences are stored locally until you disconnect the extension or uninstall it</li>
            <li><strong>Selected text:</strong> Text you select for adaptation is sent to our API, processed immediately, and not permanently stored</li>
            <li><strong>Extension removal:</strong> Uninstalling the Chrome extension automatically removes all locally stored data</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Children&apos;s Privacy</h2>
          <p className="text-gray-700 mb-4">
            Language Lite is intended for users aged 13 and above. We do not knowingly collect information from children under 13.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Updates to This Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this privacy policy from time to time. We will notify you of any significant changes by email or through the app.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this privacy policy or your data, please contact us at:
          </p>
          <p className="text-gray-700 mb-6">
            Email: <a href="mailto:yaron@ulpan.co.il" className="text-blue-600 hover:underline">yaron@ulpan.co.il</a>
          </p>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:underline">← Back to Language Lite</Link>
          </div>
        </div>
      </div>
    </main>
  );
}