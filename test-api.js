const axios = require('axios');
require('dotenv').config();

async function testOpenAI() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.');
            return;
        }
        
        console.log('Testing OpenAI API with model: gpt-4o-mini');
        console.log('API Key (first few chars):', apiKey.substring(0, 10) + '...');
        
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello, how are you?' }
                ],
                max_tokens: 50
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        
        console.log('API Response:', response.data);
        console.log('Success! The API is working with the gpt-4o-mini model.');
    } catch (error) {
        console.error('Error calling OpenAI API:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testOpenAI(); 