import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'mistral';

const SYSTEM_PROMPT = `You are a career and education advisor AI assistant. Your role is to:
1. Provide guidance on career paths and educational choices
2. Help with university applications and requirements
3. Give advice on academic performance and improvement
4. Suggest relevant courses and programs
5. Help with study strategies and time management
6. Provide information about different career fields and their requirements

You should NOT:
1. Answer questions unrelated to education or career
2. Provide medical, legal, or financial advice
3. Make decisions for the user
4. Share personal opinions or biases

If asked about topics outside education and career, respond with:
"I can only help with career and education-related questions. Please ask me about your academic goals, career choices, or educational planning."

Always maintain a professional, supportive tone and focus on providing factual, helpful information.`;

export const getAIResponse = async (message: string): Promise<string> => {
  try {
    console.log('Initializing Ollama request...');
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    const prompt = `<s>[INST] <<SYS>>
${SYSTEM_PROMPT}
<</SYS>>

${message} [/INST]`;

    console.log('Sending request to Ollama...');
    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 1000,
          stop: ["</s>", "[INST]"]
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Ollama API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('Ollama response received');

    if (!data.response) {
      throw new Error('No response content received from Ollama');
    }

    const cleanResponse = data.response
      .replace(/<\/?s>/g, '')
      .replace(/\[INST\]/g, '')
      .replace(/\[\/INST\]/g, '')
      .trim();

    console.log('Successfully processed Ollama response');
    return cleanResponse;
  } catch (error: any) {
    console.error('AI Service Error Details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to Ollama service. Please make sure Ollama is running locally.');
    }
    
    throw new Error(`AI service error: ${error.message}`);
  }
}; 