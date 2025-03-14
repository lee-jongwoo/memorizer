document.addEventListener('DOMContentLoaded', () => {
    const passageSelect = document.getElementById('passage-select');
    const passageDisplay = document.getElementById('passage-display');
    const difficultySlider = document.getElementById('difficulty-slider');
    const gradeButton = document.getElementById('grade-btn');
    const redoButton = document.getElementById('redo-btn');

    let db;  // IndexedDB instance
    const dbName = 'speechMemorizerDB';
    const storeName = 'wordStats';
    let currentFileName = '';  // Track the current file selected

    // Initialize IndexedDB
    function initDB() {
        const request = indexedDB.open(dbName, 1);

        request.onerror = (event) => {
            console.error('Database error:', event.target.errorCode);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const store = db.createObjectStore(storeName, { keyPath: 'word' });
            store.createIndex('correct', 'correct', { unique: false });
            store.createIndex('wrong', 'wrong', { unique: false });
        };

        request.onsuccess = (event) => {
            db = event.target.result;
        };
    }

    // Function to save progress for each word
    function saveWordProgress(word, isCorrect) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(word);

        getRequest.onsuccess = () => {
            const data = getRequest.result || { word: word, correct: 0, wrong: 0 };
            if (isCorrect) {
                data.correct += 1;
            } else {
                data.wrong += 1;
            }
            store.put(data);
        };
    }

    // Function to load and populate passage options
    async function loadPassages() {
        try {
            const response = await fetch('texts/index.json');
            const passages = await response.json();
            passages.forEach(passage => {
                const option = document.createElement('option');
                option.value = passage.file;
                option.textContent = passage.name;
                passageSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading passages:', error);
        }
    }

    // Function to load selected passage and process text
    async function loadPassage(fileName) {
        try {
            currentFileName = fileName;  // Save the current file name
            const response = await fetch(`texts/${fileName}`);
            const text = await response.text();
            displayPassageWithBlanks(text);
        } catch (error) {
            console.error('Error loading passage:', error);
        }
    }

    // Helper function to strip punctuation from the beginning and end of a word
    function stripPunctuation(word) {
        const punctuationPattern = /^[^\w]*|[^\w]*$/g;
        const strippedWord = word.replace(punctuationPattern, '');
        const leadingPunctuation = word.match(/^[^\w]*/)[0];
        const trailingPunctuation = word.match(/[^\w]*$/)[0];
        return {
            strippedWord: strippedWord,
            leadingPunctuation: leadingPunctuation,
            trailingPunctuation: trailingPunctuation
        };
    }

    // Function to replace certain words with blanks based on difficulty
    function displayPassageWithBlanks(text) {
        const words = text.replace(/\n/g, ' \n ').split(' '); // Split text by spaces while preserving newlines
        const numberOfBlanks = Math.floor(words.length * (difficultySlider.value / 100));
        const blankIndices = [];

        passageDisplay.innerHTML = ''; // Clear previous content

        while (blankIndices.length < numberOfBlanks) {
            const randomIndex = Math.floor(Math.random() * words.length);
            if (!blankIndices.includes(randomIndex) && words[randomIndex] !== '\n') {
                blankIndices.push(randomIndex);
            }
        }

        words.forEach((word, wordIndex) => {
            const { strippedWord, leadingPunctuation, trailingPunctuation } = stripPunctuation(word);

            if (word === '\n') {
                passageDisplay.appendChild(document.createElement('br'));
            } else if (blankIndices.includes(wordIndex)) {
                passageDisplay.appendChild(document.createTextNode(leadingPunctuation));

                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'blank';
                input.size = strippedWord.length;
                input.dataset.correctWord = strippedWord; // Store the correct word as a data attribute
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        const inputs = Array.from(passageDisplay.getElementsByClassName('blank'));
                        const index = inputs.indexOf(e.target);
                        if (index >= 0 && index < inputs.length - 1) {
                            inputs[index + 1].focus(); // Focus next blank
                        }
                    }
                });

                passageDisplay.appendChild(input);
                passageDisplay.appendChild(document.createTextNode(trailingPunctuation + ' '));
            } else {
                passageDisplay.appendChild(document.createTextNode(word + ' '));
            }
        });
    }

    // Function to grade the answers
    function gradeAnswers() {
        const inputs = passageDisplay.getElementsByClassName('blank');

        for (let input of inputs) {
            const isCorrect = input.value.trim().toLowerCase() === input.dataset.correctWord.toLowerCase();
            if (isCorrect) {
                input.style.backgroundColor = 'lightgreen'; // Green for correct
            } else {
                input.style.backgroundColor = 'lightcoral'; // Red for incorrect
                if (!input.nextSibling || !input.nextSibling.classList || !input.nextSibling.classList.contains('correct-answer')) {
                    const feedback = document.createElement('span');
                    feedback.className = 'correct-answer';
                    feedback.style.color = 'gray';
                    feedback.textContent = ` (${input.dataset.correctWord})`;
                    passageDisplay.insertBefore(feedback, input.nextSibling);
                }
            }
            saveWordProgress(input.dataset.correctWord, isCorrect);
        }
    }

    // Function to redo the passage
    function redoPassage() {
        if (currentFileName) {
            loadPassage(currentFileName);  // Reload the current passage
        }
    }

    // Event listener for passage selection
    passageSelect.addEventListener('change', (event) => {
        const selectedFile = event.target.value;
        if (selectedFile) {
            loadPassage(selectedFile);
        }
    });

    // Event listeners for buttons
    gradeButton.addEventListener('click', gradeAnswers);
    redoButton.addEventListener('click', redoPassage);

    // Initial load of passage list
    loadPassages();
    initDB();
});

// dontchange
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then((registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, (error) => {
          console.log('ServiceWorker registration failed: ', error);
      });
  });
}