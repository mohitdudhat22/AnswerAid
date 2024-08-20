import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { handleCopyText } from './lib/utils';
import { loadingMessages } from './data';

function App() {
  const [className, setClassName] = useState('[class^="rightQuestionContent"]');
  const [output, setOutput] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [loadingIntervalId, setLoadingIntervalId] = useState(null);

  useEffect(() => {
    // Initially hide the 'Open in New Page' and 'Copy Text' buttons
    document.getElementById('openInNewPage').style.display = 'none';
    document.getElementById('CopyText').style.display = 'none';
  }, []);

  const handleGetTextContent = () => {
    const query = className;

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
          setOutput(results[0].result || 'No content found');
          if (results[0].result) {
            document.getElementById('CopyText').style.display = 'block';
          }
        } else {
          setOutput('No content found');
        }
      });
    });
  };

  const handleGeminiSaveMe = () => {
    const data = output;
    console.log(data, "<<<<<gemini data");
    setOutput('');

    let messageIndex = 0;
    setToastMessage(loadingMessages[messageIndex]);
    messageIndex++;
    const intervalId = setInterval(() => {
      setToastMessage(loadingMessages[messageIndex]);
      messageIndex = (messageIndex + 1) % loadingMessages.length;
    }, 2500);
    setLoadingIntervalId(intervalId);

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
      setToastMessage('');
      if (data && data.text) {
        setOutput(data.text);
        document.getElementById('openInNewPage').style.display = 'block';
      } else {
        setOutput('No text found in response.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleOpenInNewPage = () => {
    const newWindow = window.open();
    newWindow.document.write(output);
    newWindow.document.close();
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">AnswerAid</h1>
      <div className="mb-4">
        <input
          type="text"
          id="your-class-name"
          placeholder="Enter class name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full"
        />
      </div>
      <div className="flex gap-4 mb-4">
        <button id="changeText" onClick={handleGetTextContent} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Get Text Content
        </button>
        <button id="geminiSaveMe" onClick={handleGeminiSaveMe} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Gemini Save Me Button
        </button>
        <button id="openInNewPage" onClick={handleOpenInNewPage} className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Open in New Page
        </button>
        <button id="CopyText" onClick={handleCopyText(output, setToastMessage)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          Copy Text
        </button>
      </div>
      <h5 className="mb-4 text-gray-600">Tip: If Not Working then Please Once Inspect the Question So We can Load the iframe</h5>
      <h2 className="toast-message mb-4 text-yellow-500">{toastMessage}</h2>
      <div className="output p-4 border border-gray-300 rounded bg-gray-100" dangerouslySetInnerHTML={{ __html: output }} />
    </>
  );
}

export default App;
