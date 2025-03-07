const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

// Add global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// OpenAI API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Get API key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ 
                error: 'OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.' 
            });
        }
        
        // Check if we should use fallback mode (for testing)
        const useFallback = process.env.USE_FALLBACK === 'true';
        
        if (useFallback) {
            console.log('Using fallback mode instead of OpenAI API');
            
            // Create a more natural fallback response based on the message content
            let fallbackResponse = '';
            
            const lowerMessage = message.toLowerCase();
            console.log('Fallback mode - received message:', lowerMessage);
            
            // Simplified logic with more specific conditions
            if (lowerMessage.includes('hello') || lowerMessage.includes('hi ')) {
                console.log('Matched greeting pattern');
                fallbackResponse = "Hello! I'm currently operating in fallback mode due to API limitations. How can I assist you today?";
            } else if (lowerMessage.includes('help me') || lowerMessage.includes('can you help')) {
                console.log('Matched help pattern');
                fallbackResponse = "I'd be happy to help! However, I'm currently operating in fallback mode with limited capabilities due to API service limitations. Please try again later for full functionality.";
            } else if (lowerMessage.includes('why') || lowerMessage.includes('what happened')) {
                console.log('Matched why pattern');
                fallbackResponse = "I'm currently operating in fallback mode because the OpenAI API service is temporarily unavailable due to quota limitations. This is usually resolved by updating the account's billing information.";
            } else {
                console.log('Using default fallback response');
                fallbackResponse = "I'm currently operating in fallback mode with limited capabilities due to API service limitations. Your message has been received, but I can only provide basic responses at this time. Please try again later for full functionality.";
            }
            
            return res.json({ 
                response: fallbackResponse,
                fallback: true
            });
        }
        
        console.log('Making request to OpenAI API with model: gpt-4o-mini');
        
        try {
            // Call OpenAI API
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            const assistantResponse = response.data.choices[0].message.content;
            
            res.json({ response: assistantResponse });
        } catch (apiError) {
            console.error('Error calling OpenAI API:', apiError.response?.data || apiError.message);
            
            // Check if it's a quota exceeded error
            if (apiError.response?.data?.error?.code === 'insufficient_quota') {
                return res.status(503).json({
                    error: 'Service temporarily unavailable',
                    message: 'The AI service is currently unavailable due to quota limitations. Please try again later.',
                    details: 'OpenAI API quota exceeded. Please check billing details.'
                });
            }
            
            // Handle other API errors
            res.status(500).json({ 
                error: 'Error processing your request',
                message: 'There was a problem connecting to the AI service. Please try again later.',
                details: apiError.response?.data?.error?.message || apiError.message
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'An unexpected error occurred on the server. Please try again later.'
        });
    }
});

// Document classification API endpoint
app.post('/api/classify', async (req, res) => {
    try {
        const { document } = req.body;
        
        if (!document) {
            return res.status(400).json({ error: 'Document text is required' });
        }
        
        // Check if we should use fallback mode
        const useFallback = process.env.USE_FALLBACK === 'true';
        
        if (useFallback) {
            console.log('Using fallback mode for classification');
            // Return a simple classification in fallback mode
            return res.json(clientSideClassify(document));
        }
        
        console.log('Making request to OpenAI API for document classification');
        
        try {
            // Get API key from environment variables
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
                return res.status(500).json({ 
                    error: 'OpenAI API key not found. Please set the OPENAI_API_KEY environment variable.' 
                });
            }
            
            // Prepare the prompt for classification
            const prompt = `
You are tasked with classifying documents based on the following criteria derived from the https://www.arkivverket.no/veiledere-for-offentlig-sektor/veileder-for-arkivering-og-journalforing#!#substep-saksbehandling:
 
1. **Determine if the document is a 'saksdokument' (case document):**
   - Does it pertain to a specific case or matter handled by the organization?
 
2. **Assess if the document has been sent to or received by the organization:**
   - Is it an incoming or outgoing correspondence relevant to the organization's operations?
 
3. **Evaluate if the document is subject to processing and holds value as documentation:**
   - Will it be used in decision-making processes or serve as evidence of the organization's activities?
 
**Document to be Classified:**
 
"${document}"
 
**Classification Instructions:**
 
- If the document meets all three criteria, classify it as: **"Requires Archiving and Journalføring"**.
- If the document meets only the first and third criteria (i.e., it is internal but holds value), classify it as: **"Requires Archiving Only"**.
- If the document does not meet the above criteria, classify it as: **"Does Not Require Archiving or Journalføring"**.

Provide your classification in JSON format with the following structure:
{
  "classification": "The classification result",
  "resultClass": "CSS class name (result-requires-both, result-requires-archiving, or result-not-required)",
  "explanation": "A brief explanation of why this classification was chosen",
  "criteria": {
    "isCaseDocument": true/false,
    "isCorrespondence": true/false,
    "hasDocumentationValue": true/false
  }
}
`;
            
            // Call OpenAI API
            const response = await axios.post(
                'https://api.openai.com/v1/chat/completions',
                {
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a document classification assistant specialized in Norwegian archiving regulations.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1000
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );
            
            const assistantResponse = response.data.choices[0].message.content;
            
            // Parse the JSON response
            try {
                // Extract JSON from the response (in case there's additional text)
                const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const jsonStr = jsonMatch[0];
                    const classification = JSON.parse(jsonStr);
                    res.json(classification);
                } else {
                    throw new Error('No valid JSON found in the response');
                }
            } catch (parseError) {
                console.error('Error parsing classification JSON:', parseError);
                // Fallback to client-side classification if parsing fails
                res.json(clientSideClassify(document));
            }
        } catch (apiError) {
            console.error('Error calling OpenAI API for classification:', apiError.response?.data || apiError.message);
            
            // Fallback to client-side classification
            res.json(clientSideClassify(document));
        }
    } catch (error) {
        console.error('Server error during classification:', error);
        res.status(500).json({ 
            error: 'Server error',
            message: 'An unexpected error occurred on the server during classification.'
        });
    }
});

// Client-side classification function (for fallback)
function clientSideClassify(text) {
    // Convert text to lowercase for easier matching
    const lowerText = text.toLowerCase();
    
    // Criteria 1: Is it a 'saksdokument' (case document)?
    const isCaseDocument = checkIsCaseDocument(lowerText);
    
    // Criteria 2: Has it been sent to or received by the organization?
    const isCorrespondence = checkIsCorrespondence(lowerText);
    
    // Criteria 3: Is it subject to processing and holds value as documentation?
    const hasDocumentationValue = checkHasDocumentationValue(lowerText);
    
    // Determine classification based on criteria
    let classification;
    let resultClass;
    let explanation;
    
    if (isCaseDocument && isCorrespondence && hasDocumentationValue) {
        classification = "Requires Archiving and Journalføring";
        resultClass = "result-requires-both";
        explanation = "This document meets all three criteria: it is a case document, it has been sent to or received by the organization, and it holds value as documentation.";
    } else if (isCaseDocument && hasDocumentationValue) {
        classification = "Requires Archiving Only";
        resultClass = "result-requires-archiving";
        explanation = "This document is a case document and holds value as documentation, but it has not been sent to or received by the organization (it is internal).";
    } else {
        classification = "Does Not Require Archiving or Journalføring";
        resultClass = "result-not-required";
        explanation = "This document does not meet the necessary criteria for archiving or journalføring.";
    }
    
    return {
        classification,
        resultClass,
        explanation,
        criteria: {
            isCaseDocument,
            isCorrespondence,
            hasDocumentationValue
        }
    };
}

// Helper functions for classification
function checkIsCaseDocument(text) {
    // Keywords that suggest it's a case document
    const caseKeywords = [
        'case', 'sak', 'saksnummer', 'case number', 'matter', 
        'regarding', 'vedrørende', 'ref', 'reference', 'decision',
        'application', 'søknad', 'request', 'forespørsel', 'complaint',
        'klage', 'appeal', 'anke', 'report', 'rapport'
    ];
    
    return caseKeywords.some(keyword => text.includes(keyword));
}

function checkIsCorrespondence(text) {
    // Keywords that suggest it's correspondence
    const correspondenceKeywords = [
        'from:', 'fra:', 'to:', 'til:', 'sent:', 'sendt:', 'received:',
        'mottatt:', 'dear', 'kjære', 'hello', 'hei', 'sincerely',
        'med vennlig hilsen', 'regards', 'hilsen', 'forwarded',
        'videresendt', 'reply', 'svar', 'email', 'e-post', 'letter',
        'brev', 'attachment', 'vedlegg'
    ];
    
    return correspondenceKeywords.some(keyword => text.includes(keyword));
}

function checkHasDocumentationValue(text) {
    // Keywords that suggest it has documentation value
    const valueKeywords = [
        'decision', 'vedtak', 'approval', 'godkjenning', 'agreement',
        'avtale', 'contract', 'kontrakt', 'minutes', 'referat',
        'protocol', 'protokoll', 'report', 'rapport', 'assessment',
        'vurdering', 'recommendation', 'anbefaling', 'conclusion',
        'konklusjon', 'important', 'viktig', 'official', 'offisiell',
        'formal', 'formell', 'legal', 'juridisk', 'regulation',
        'forskrift', 'policy', 'retningslinje', 'procedure', 'prosedyre'
    ];
    
    return valueKeywords.some(keyword => text.includes(keyword));
}

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
try {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    
    // Keep the server running
    server.on('error', (error) => {
        console.error('Server error:', error);
    });
    
    // Keep the process running
    process.stdin.resume();
} catch (error) {
    console.error('Error starting server:', error);
} 