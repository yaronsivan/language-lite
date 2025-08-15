import Link from 'next/link';

export default function DeleteAccount() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Deletion Request</h1>
        
        <div className="bg-gray-50 border-2 border-gray-200 shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Delete Your Account and Data</h2>
          
          <p className="text-gray-700 mb-6">
            We respect your right to have your personal data deleted from our systems. To request account and data deletion, please follow these steps:
          </p>

          <div className="bg-white border-l-4 border-gray-600 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Request</h3>
            <p className="text-gray-700 mb-4">
              Send an email to: <a href="mailto:yaron@ulpan.co.il?subject=Data Deletion Request - Language Lite" className="text-blue-600 hover:underline font-semibold">yaron@ulpan.co.il</a>
            </p>
            <p className="text-gray-600 text-sm mb-2">
              Please include in your email:
            </p>
            <ul className="list-disc pl-6 text-gray-600 text-sm">
              <li>The email address associated with your Language Lite account</li>
              <li>Confirmation that you want to delete your account and all associated data</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">What Will Be Deleted</h3>
          <ul className="list-disc pl-6 text-gray-700 mb-6">
            <li>Your account information (email, name)</li>
            <li>Your learning preferences and settings</li>
            <li>Your usage history and adaptation records</li>
            <li>Any remaining credits</li>
            <li>All data associated with your account</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Time</h3>
          <p className="text-gray-700 mb-6">
            We will process your deletion request within <strong>48 hours</strong> of receiving your email. You will receive a confirmation email once your data has been completely removed from our systems.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mb-3">Alternative: Temporary Account Deactivation</h3>
          <p className="text-gray-700 mb-6">
            If you&apos;d like to temporarily stop using Language Lite but keep your account for future use, you can simply stop logging in. Your account will remain inactive but available for when you return.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-gray-700">
              <strong>Note:</strong> Account deletion is permanent and cannot be undone. You will lose all your credits and learning history. If you want to use Language Lite again in the future, you&apos;ll need to create a new account.
            </p>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="mailto:yaron@ulpan.co.il?subject=Data Deletion Request - Language Lite&body=I would like to request deletion of my Language Lite account and all associated data.%0A%0AMy account email is: [YOUR EMAIL HERE]%0A%0AI understand this action is permanent and cannot be undone."
            className="inline-block bg-red-600 text-white font-bold py-3 px-6 hover:bg-red-700 transition-colors mb-4"
          >
            Send Deletion Request Email
          </a>
          <p className="text-gray-600 text-sm">
            This will open your email client with a pre-filled deletion request
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="text-blue-600 hover:underline">← Back to Language Lite</Link>
          <span className="mx-2 text-gray-400">|</span>
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}