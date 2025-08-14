import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text, language, level } = await request.json();

    const prompt = `Adapt the following text to ${level} level ${language} learning:
    
    Rules:
    1. Use simpler vocabulary and shorter sentences for beginner level
    2. Maintain the main meaning and information
    3. After the adapted text, list 3-5 key vocabulary words with their translations
    
    Respond with a JSON object with exactly this structure:
    {
      "adaptedText": "the adapted text here",
      "vocabulary": [
        {"word": "word1", "translation": "translation1"},
        {"word": "word2", "translation": "translation2"}
      ]
    }
    
    Original text: ${text}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let result;
    try {
      // Try to parse as JSON
      result = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      // If parsing fails, create a simple response
      console.log('Failed to parse OpenAI response as JSON, creating fallback');
      result = {
        adaptedText: completion.choices[0].message.content,
        vocabulary: []
      };
    }
    console.log('OpenAI Response:', result);
    // Ensure vocabulary is an array
    if (!Array.isArray(result.vocabulary)) {
      result.vocabulary = [];
    }

    return Response.json(result);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return Response.json({ 
      error: 'Failed to adapt text',
      adaptedText: "Sorry, we couldn't adapt this text right now. Please try again.",
      vocabulary: []
    }, { status: 500 });
  }
}