export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Language Lite ✨
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your AI-powered language learning companion that adapts everything to YOUR level
          </p>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition">
            Try Demo Below 👇
          </button>
        </div>

        {/* Demo Section */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Try it now - Paste any text!</h2>
          <textarea 
            className="w-full p-4 border border-gray-300 rounded-lg mb-4"
            rows="4"
            placeholder="Paste an article, news story, or any text here..."
          />
          <div className="flex gap-4 mb-4">
            <select className="flex-1 p-2 border border-gray-300 rounded-lg">
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Italian</option>
            </select>
            <select className="flex-1 p-2 border border-gray-300 rounded-lg">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            Adapt This Text! 🎯
          </button>
        </div>

        {/* Coming Soon Features */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-8">Coming Soon</h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-bold mb-2">Language Reflection</h4>
              <p className="text-gray-600">Map your entire language knowledge</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">🎧</div>
              <h4 className="font-bold mb-2">Personal Podcast</h4>
              <p className="text-gray-600">Weekly AI-generated learning summary</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-2">💡</div>
              <h4 className="font-bold mb-2">Hintz</h4>
              <p className="text-gray-600">Mnemonics based on YOUR interests</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}