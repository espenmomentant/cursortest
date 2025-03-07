document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    const actionButtons = document.querySelectorAll('.action-btn');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    // Backend API URL
    const API_URL = 'http://localhost:3000/api/chat';
    
    // Focus the input field when the page loads
    chatInput.focus();
    
    // Function to add a message to the chat history
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'assistant-message');
        
        if (isUser) {
            // User messages are simple text
            messageDiv.textContent = content;
        } else {
            // Format assistant messages with markdown-like syntax
            
            // Process the content with markdown formatting
            let formattedContent = content;
            
            // Handle code blocks (```code```)
            if (formattedContent.includes('```')) {
                const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
                formattedContent = formattedContent.replace(codeBlockRegex, '<pre><code>$1</code></pre>');
            }
            
            // Handle bold text (**text**)
            formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Handle italic text (*text*)
            formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Handle numbered lists
            if (formattedContent.match(/\d+\.\s.+/)) {
                const lines = formattedContent.split('\n');
                let inList = false;
                let listContent = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const listItemMatch = line.match(/^(\d+)\.\s(.+)/);
                    
                    if (listItemMatch) {
                        if (!inList) {
                            listContent += '<ol>';
                            inList = true;
                        }
                        listContent += `<li>${listItemMatch[2]}</li>`;
                    } else {
                        if (inList) {
                            listContent += '</ol>';
                            inList = false;
                        }
                        listContent += line + '\n';
                    }
                }
                
                if (inList) {
                    listContent += '</ol>';
                }
                
                formattedContent = listContent;
            }
            
            // Handle bullet lists
            if (formattedContent.match(/[\-\*]\s.+/)) {
                const lines = formattedContent.split('\n');
                let inList = false;
                let listContent = '';
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const listItemMatch = line.match(/^[\-\*]\s(.+)/);
                    
                    if (listItemMatch) {
                        if (!inList) {
                            listContent += '<ul>';
                            inList = true;
                        }
                        listContent += `<li>${listItemMatch[1]}</li>`;
                    } else {
                        if (inList) {
                            listContent += '</ul>';
                            inList = false;
                        }
                        listContent += line + '\n';
                    }
                }
                
                if (inList) {
                    listContent += '</ul>';
                }
                
                formattedContent = listContent;
            }
            
            // Convert line breaks to <br> tags for paragraphs
            formattedContent = formattedContent.replace(/\n\n/g, '<br><br>');
            formattedContent = formattedContent.replace(/\n/g, '<br>');
            
            messageDiv.innerHTML = formattedContent;
        }
        
        chatHistory.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            indicator.appendChild(dot);
        }
        
        chatHistory.appendChild(indicator);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        return indicator;
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Function to send a message to the backend
    async function sendMessageToBackend(message) {
        try {
            showTypingIndicator();
            
            // Check if the server is running, if not use the fallback
            let useBackend = true;
            
            try {
                // Try to connect to the backend
                const testConnection = await fetch(API_URL.replace('/api/chat', ''), { 
                    method: 'HEAD',
                    mode: 'no-cors'
                });
            } catch (error) {
                console.warn('Backend server not available, using fallback responses');
                useBackend = false;
            }
            
            let assistantResponse;
            
            if (useBackend) {
                // Send request to backend
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Handle specific error types
                    if (response.status === 503 && data.error === 'Service temporarily unavailable') {
                        throw new Error(data.message || 'The AI service is currently unavailable. Please try again later.');
                    } else {
                        throw new Error(data.message || `Server responded with status: ${response.status}`);
                    }
                }
                
                assistantResponse = data.response;
            } else {
                // Fallback: Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Simulate a response for demo purposes
                if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
                    assistantResponse = "Hello! How can I help you today?";
                } else if (message.toLowerCase().includes('code') || message.toLowerCase().includes('programming')) {
                    assistantResponse = "Here's a simple JavaScript function example:\n\n```\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));\n```";
                } else if (message.toLowerCase().includes('help')) {
                    assistantResponse = "I'm here to help! You can ask me questions, request information, or get assistance with various tasks.";
                } else {
                    assistantResponse = "Thanks for your message. It seems the backend server is not running. To use the actual ChatGPT API, please start the Node.js server with your API key configured.";
                }
            }
            
            removeTypingIndicator();
            addMessage(assistantResponse, false);
            
        } catch (error) {
            console.error('Error sending message:', error);
            removeTypingIndicator();
            
            // Display a more user-friendly error message
            if (error.message.includes('quota') || error.message.includes('unavailable')) {
                addMessage('Sorry, the AI service is currently unavailable due to usage limits. Please try again later.', false);
            } else {
                addMessage('Sorry, there was an error processing your request. ' + error.message, false);
            }
        }
    }
    
    // Handle input submission
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            const message = chatInput.value.trim();
            
            // Add user message to chat
            addMessage(message, true);
            
            // Clear input
            chatInput.value = '';
            
            // Send message to backend
            sendMessageToBackend(message);
        }
    });
    
    // Add click event listeners to action buttons
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim();
            console.log(`Action clicked: ${action}`);
            
            // Special handling for voice button
            if (action.includes('Voice')) {
                console.log('Voice input activated');
                // In a real app, this would activate voice input
                addMessage('Voice input is not implemented in this demo.', false);
            }
        });
    });
    
    // Add click event listeners to suggestion buttons
    suggestionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const suggestion = button.textContent.trim();
            console.log(`Suggestion clicked: ${suggestion}`);
            
            // Set the input value to the suggestion
            const message = `Help me ${suggestion.toLowerCase()}`;
            chatInput.value = message;
            chatInput.focus();
            
            // Optional: Automatically send the suggestion
            // addMessage(message, true);
            // sendMessageToBackend(message);
        });
    });
    
    // Add a welcome message
    setTimeout(() => {
        addMessage('Hello! I\'m your AI assistant. How can I help you today?', false);
    }, 500);
}); 