document.addEventListener('DOMContentLoaded', () => {
    const documentText = document.getElementById('document-text');
    const classifyBtn = document.getElementById('classify-btn');
    const resultContent = document.getElementById('result-content');
    
    // API URL for classification
    const API_URL = 'http://localhost:3000/api/classify';
    
    // Function to classify the document
    async function classifyDocument() {
        const text = documentText.value.trim();
        
        if (!text) {
            showError('Please enter document text to classify.');
            return;
        }
        
        // Show loading state
        resultContent.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <p>Analyzing document...</p>
        `;
        
        try {
            // Try to use the backend API
            let classification;
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ document: text })
                });
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                classification = data;
            } catch (error) {
                console.warn('Backend API not available, using client-side classification');
                // Fallback to client-side classification
                classification = clientSideClassify(text);
            }
            
            displayClassificationResult(classification);
        } catch (error) {
            console.error('Error classifying document:', error);
            showError('An error occurred while classifying the document. Please try again.');
        }
    }
    
    // Function to classify the document on the client side (fallback)
    function clientSideClassify(text) {
        // This is a simplified classification logic
        // In a real application, this would be more sophisticated
        
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
    
    // Function to display the classification result
    function displayClassificationResult(result) {
        resultContent.className = 'result-content ' + result.resultClass;
        
        resultContent.innerHTML = `
            <div class="result-title">${result.classification}</div>
            <div class="result-explanation">${result.explanation}</div>
            <div class="criteria-summary">
                <div class="criteria-item">
                    <span class="criteria-icon ${result.criteria.isCaseDocument ? 'yes' : 'no'}">
                        <i class="fas ${result.criteria.isCaseDocument ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </span>
                    <span class="criteria-text">
                        Criteria 1: ${result.criteria.isCaseDocument ? 'Is' : 'Is not'} a case document
                    </span>
                </div>
                <div class="criteria-item">
                    <span class="criteria-icon ${result.criteria.isCorrespondence ? 'yes' : 'no'}">
                        <i class="fas ${result.criteria.isCorrespondence ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </span>
                    <span class="criteria-text">
                        Criteria 2: ${result.criteria.isCorrespondence ? 'Has' : 'Has not'} been sent to or received by the organization
                    </span>
                </div>
                <div class="criteria-item">
                    <span class="criteria-icon ${result.criteria.hasDocumentationValue ? 'yes' : 'no'}">
                        <i class="fas ${result.criteria.hasDocumentationValue ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    </span>
                    <span class="criteria-text">
                        Criteria 3: ${result.criteria.hasDocumentationValue ? 'Does' : 'Does not'} hold value as documentation
                    </span>
                </div>
            </div>
        `;
    }
    
    // Function to show error message
    function showError(message) {
        resultContent.className = 'result-content';
        resultContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }
    
    // Add event listener to the classify button
    classifyBtn.addEventListener('click', classifyDocument);
    
    // Also allow classification when pressing Enter in the textarea
    documentText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            classifyDocument();
        }
    });
}); 