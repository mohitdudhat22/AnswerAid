document.getElementById('changeText').addEventListener('click', () => {
    const query = document.getElementById('your-class-name').value;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (query) => {
                const iframes = document.querySelectorAll('iframe');
                let allTextContent = '';
                const processFrame = (frame) => {
                    try {
                        const doc = frame.contentDocument || frame.contentWindow.document;
                        const questions = doc.querySelectorAll(`${query}`);
                        questions.forEach(question => {
                            allTextContent += question.textContent.trim() + '\n';
                        });
                    } catch (e) {
                        console.error('Error accessing iframe:', e);
                    }
                };
                
                // Process the main document
                const questions = document.querySelectorAll(`${query}`);
                questions.forEach(question => {
                    allTextContent += question.textContent.trim() + '\n';
                });

                // Process iframes
                iframes.forEach(processFrame);
                
                return allTextContent.trim() || 'No content found';
            },
            args: [query]
        }, (results) => {
            if (results && results[0] && results[0].result) {
                document.querySelector('.output').textContent = results[0].result || 'No content found';
            } else {
                document.querySelector('.output').textContent = 'No content found';
            }
        });
    });
});

// 'Save & Next'
// option -> options
// rightQuestionContent -> p -> question