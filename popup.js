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

document.getElementById('geminiSaveMe').addEventListener('click', () => {
    const data = document.querySelector('.output').textContent;
    console.log(data);
    const outputElement = document.querySelector('.output');
    
    fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: data + 'Give me an answer from this question and options. Make Sure you give me the answer in html formate and Give me only the answers with it corresponding question index. I dont want any other text like question it self or its option etc' }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json(); // Parse the JSON response
    })
    .then(data => {
        // Assuming `data` contains a `text` property
        if (data && data.text) {
            document.querySelector('.output').innerHTML = data.text; // Update the `.output` element with the `text` property
        } else {
            document.querySelector('.output').textContent = 'No text found in response.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});



// 'Save & Next'
// option -> options
// rightQuestionContent -> p -> question