# Document Classification System

A web-based application for classifying documents according to Norwegian archiving regulations (Arkivverket guidelines).

## Features

- Chat interface with AI-powered responses
- Document classification based on Arkivverket guidelines
- Responsive design for desktop and mobile devices
- Fallback mode when API is unavailable

## Classification Criteria

Documents are classified based on three criteria from Arkivverket:

1. **Is it a 'saksdokument' (case document)?**
   - Does it pertain to a specific case or matter handled by the organization?

2. **Has it been sent to or received by the organization?**
   - Is it an incoming or outgoing correspondence relevant to the organization's operations?

3. **Is it subject to processing and holds value as documentation?**
   - Will it be used in decision-making processes or serve as evidence of the organization's activities?

## Classification Results

- **Requires Archiving and Journalføring**: Meets all three criteria
- **Requires Archiving Only**: Meets criteria 1 and 3 but not 2 (internal document)
- **Does Not Require Archiving or Journalføring**: Does not meet the necessary criteria

## Technologies Used

- HTML, CSS, JavaScript
- Node.js and Express
- OpenAI API (GPT-4o-mini)

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`
4. Start the server: `npm start`
5. Open http://localhost:3000 in your browser

## Running in Fallback Mode

If you don't have an OpenAI API key or are experiencing quota limitations, you can run the application in fallback mode:

```
USE_FALLBACK=true npm start
```

In fallback mode, the application will use client-side classification logic instead of the OpenAI API. 