document.getElementById('openInNewPage').style.display = 'none';
document.getElementById('CopyText').style.display = 'none';
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
                if(results[0].result) document.getElementById('CopyText').style.display = 'block';
            } else {
                document.querySelector('.output').textContent = 'No content found';
            }
        });
    });
});
document.getElementById('geminiSaveMe').addEventListener('click', () => {
    const data = document.querySelector('.output').textContent;
    document.querySelector('.output').textContent = '';
    const loadingMessages = [
        "ડબ્બા માંથી કોડ કાઢી રહ્યા છીએ...",
        "Gemini સાથે વાતચીત ચાલી રહી છે...",
        "લોડ થઈ રહ્યું છે...",
        "લોડિંગ થાય ત્યાં સુધી ચા પીલો...",
        "મોજ કરે છે, એક સેકન્ડ રુકો...",
        "થોડી રાહ જુઓ, ફાફડા તળાય છે...",
        "ડેટા ને ઢોકળા જેમ શેકીએ છીએ...",
        "ઘઉંની જેમ દળાય છે...",
        "ગાંઠીયા ગણી રહ્યા છીએ...",
        "દાળ-ભાત ની જેમ મિક્સ કરી રહ્યા છીએ...",
        "કાકડી કાપી રહ્યા છીએ...",
        "ભજીયા તળી રહ્યા છીએ...",
        "ચા ઉકાળી રહ્યા છીએ...",
        "મમરા કૂટી રહ્યા છીએ...",
        "કોડમાં રસાયણ ભળી રહ્યું છે..."
    ];
    let messageIndex = 0;
    document.querySelector('.toast-message').textContent = loadingMessages[messageIndex];
    messageIndex++;
    const intervalId = setInterval(() => {
        document.querySelector('.toast-message').textContent = loadingMessages[messageIndex];
        messageIndex = (messageIndex + 1) % loadingMessages.length;
    }, 2500);
    fetch(`https://gemini-server-rjxr.onrender.com/api/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: data + "\n\n\n\n Analyze the following text, which contains a question followed by four options. Identify the correct answer. Then, create an HTML output that includes only the question index number and the correct answer. Format the output as follows:\n<p style='font-size: 18px;'>[Question Index]. [Correct Answer]</p>\nDo not include the question text, options, or any additional information. Ensure the font size is set to 18px as shown in the HTML tag. Give me Direct Answers Only"
          })
        })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        return response.json();
    })
    .then(data => {
        clearInterval(intervalId);
        document.querySelector('.toast-message').textContent = '';
        if (data && data.text) {
            document.querySelector('.output').innerHTML = data.text;
            document.getElementById('openInNewPage').style.display = 'block';
        } else {
            document.querySelector('.output').textContent = 'No text found in response.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});


document.getElementById('openInNewPage').addEventListener('click', () => {
    const content = document.querySelector('.output').innerHTML;
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Page</title>
            <style>
                /* Add any styles you need here */
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    chrome.tabs.create({ url: url });
});
document.getElementById('CopyText').addEventListener('click', () => {
    const text = document.querySelector('.output').textContent.replace(/\s+/g, ' ').trim();
    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (!successful) throw new Error('Unable to copy');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    }
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            document.querySelector('.toast-message').textContent = 'Text copied to clipboard!';
        }).catch((err) => {
            console.error('Async: Could not copy text: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        fallbackCopyTextToClipboard(text);
    }
    document.querySelector('.toast-message').textContent = 'Text copied to clipboard!';
        setTimeout(() => {
        document.querySelector('.toast-message').textContent = '';
    }, 3000);
    document.querySelector('.output').innerHTML = '';
});

// 'Save & Next'
// option -> options
// rightQuestionContent -> p -> question