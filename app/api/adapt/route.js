import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text, language, level } = await request.json();

    // Detect if text is English
    const isEnglishText = /^[A-Za-z\s.,!?'"()-]+$/.test(text.substring(0, 100));
    
    let prompt;
    
    if (language === 'English') {
      prompt = `Simplify this English text for ${level} English learners:
      
      Rules:
      1. ${level === 'Beginner' ? 'Use only simple words and short sentences' : level === 'Intermediate' ? 'Use moderate vocabulary' : 'Keep most vocabulary but explain complex terms'}
      2. Keep the main meaning
      3. Extract 5 vocabulary words that are important to understand
      4. IMPORTANT: Properly escape all quotation marks in your response
      
      Return valid JSON with properly escaped quotes:
      {
        "adaptedText": "simplified English text here with \\"escaped quotes\\" like this",
        "vocabulary": [
          {"word": "example", "translation": "definition or simpler synonym"}
        ]
      }
      
      Text: ${text}`;
    } else if (isEnglishText) {
      prompt = `Translate this English text to ${language} at ${level} level:
      
      Rules:
      1. Translate to ${language}
      2. Use ${level} level vocabulary in ${language}
      3. Keep sentences ${level === 'Beginner' ? 'short and simple' : level === 'Intermediate' ? 'moderate length' : 'natural'}
      4. Extract 5 key ${language} words with English translations
      5. IMPORTANT: Properly escape all quotation marks in your response
      
      Return valid JSON with properly escaped quotes:
      {
        "adaptedText": "text in ${language} with \\"escaped quotes\\" like this",
        "vocabulary": [
          {"word": "${language} word", "translation": "English translation"}
        ]
      }
      
      Text: ${text}`;
    } else {
      prompt = `Simplify this ${language} text for ${level} ${language} learners:
      
      Rules:
      1. Keep the text in ${language}
      2. Simplify to ${level} level while keeping it in ${language}
      3. ${level === 'Beginner' ? 'Use basic vocabulary and short sentences' : level === 'Intermediate' ? 'Use moderate vocabulary' : 'Keep most vocabulary but simplify complex parts'}
      4. Extract 5 important ${language} words with English translations
      5. IMPORTANT: Properly escape all quotation marks in your response
      
      Return valid JSON with properly escaped quotes:
      {
        "adaptedText": "simplified ${language} text with \\"escaped quotes\\" like this",
        "vocabulary": [
          {"word": "${language} word", "translation": "English meaning"}
        ]
      }
      
      Text: ${text}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `You are a language learning assistant. Always output valid JSON only. 
          CRITICAL: All quotation marks in text must be properly escaped as \\" 
          Never use unescaped quotes inside JSON string values.`
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseText = completion.choices[0].message.content;
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', responseText);
      
      // Try to fix common issues
      try {
        // Attempt to fix unescaped quotes
        const fixedText = responseText
          .replace(/([^\\])"/g, '$1\\"')  // Escape unescaped quotes
          .replace(/\\\\"/g, '\\"');      // Fix double-escaped quotes
        
        result = JSON.parse(fixedText);
      } catch (secondError) {
        // If still failing, return a safe fallback
        result = {
          adaptedText: "Text adaptation failed due to formatting issues. Please try again with different text.",
          vocabulary: []
        };
      }
    }

    // Additional safety: clean the adapted text
    if (result.adaptedText) {
      // Remove any broken quotes or problematic characters
      result.adaptedText = result.adaptedText
        .replace(/\\"/g, '"')  // Convert escaped quotes back to normal quotes for display
        .replace(/\\/g, '')    // Remove any remaining backslashes
        .trim();
    }

    // Ensure vocabulary is an array
    if (!Array.isArray(result.vocabulary)) {
      result.vocabulary = [];
    }

    // Clean vocabulary translations too
    result.vocabulary = result.vocabulary.map(item => {
      if (typeof item === 'object' && item.word) {
        return {
          word: item.word.replace(/\\"/g, '"').replace(/\\/g, ''),
          translation: item.translation ? item.translation.replace(/\\"/g, '"').replace(/\\/g, '') : ''
        };
      }
      return item;
    });

    return Response.json(result);
  } catch (error) {
    console.error('Error in adapt API:', error);
    return Response.json({ 
      adaptedText: "Service temporarily unavailable. Please try again.",
      vocabulary: []
    }, { status: 500 });
  }
}