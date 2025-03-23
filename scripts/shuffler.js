document.addEventListener('DOMContentLoaded', () => {
  const passageSelect = document.getElementById('passage-select');
  const passageDisplay = document.getElementById('sentences');
  const difficultySlider = document.getElementById('difficulty-slider');
  const userAnswerDisplay = document.getElementById('user-answer');
  const feedbackDisplay = document.getElementById('feedback');

  let currentFileName = '';  // Track the current file selected
  let currentPassageSentences = [];  // Track the current passage sentences
  let userAnswer = '';  // Track the user's answer

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

  async function loadPassage(fileName) {
    try {
      const response = await fetch(`texts/${fileName}`);
      const text = await response.text();
      currentFileName = fileName;
      currentPassageParagraphs = text.split('\n\n');
      // split paragraphs by periods and question marks
      currentPassageSentences = currentPassageParagraphs.map(paragraph => paragraph.split(/(?<=[.?!])\s/));
      generateQuestion();
    } catch (error) {
      console.error('Error loading passage:', error);
    }
  }

  function generateQuestion() {
    const lengthToShuffle = difficultySlider.value / 1;
    const paragraph = currentPassageSentences[Math.floor(Math.random() * currentPassageSentences.length)];
    const startIndex = Math.floor(Math.random() * (paragraph.length - lengthToShuffle));
    const selectedSentences = paragraph.slice(startIndex, startIndex + lengthToShuffle);
    const shuffledSentences = shuffle(selectedSentences);
    // answer indices in format 'BCA' 'CAB' etc.
    const answer = shuffledSentences.map((sentence, _index) => 'ABCDEFGHIJKL'[selectedSentences.indexOf(sentence)]).join('');

    // display question
    passageDisplay.innerHTML = '';
    passageDisplay.dataset.answer = answer;
    userAnswerDisplay.style.color = 'black';
    for (let i = 0; i < shuffledSentences.length; i++) {
      const sentence = shuffledSentences[i];
      const sentenceElement = document.createElement('p');
      sentenceElement.textContent = `(${'ABCDEFGHIJKL'[i]}) ` + sentence;
      sentenceElement.addEventListener('click', () => {
        // add answer only if it is not already in the answer
        if (!userAnswer.includes('ABCDEFGHIJKL'[i])) {
          userAnswer += 'ABCDEFGHIJKL'[i]
        } else {
          userAnswer = userAnswer.replace('ABCDEFGHIJKL'[i], '');
        };
        userAnswerDisplay.textContent = userAnswer.split('').map((char) => `(${char})`).join(' - ');
      });
      passageDisplay.appendChild(sentenceElement);
    }
  }

  function shuffle(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  }

  // Event listener for passage selection
  passageSelect.addEventListener('change', (event) => {
    const selectedFile = event.target.value;
    if (selectedFile) {
      loadPassage(selectedFile);
    }
  });

  // Event listener for difficulty slider
  difficultySlider.addEventListener('input', () => {
    generateQuestion();
  });

  // Event listener for buttons
  document.getElementById('submit').addEventListener('click', () => {
    const answer = passageDisplay.dataset.answer;
    if (userAnswer === answer) {
      feedbackDisplay.textContent = 'Correct!';
      feedbackDisplay.style.color = 'green';
      setTimeout(() => {
        userAnswer = '';
        userAnswerDisplay.textContent = '';
        feedbackDisplay.textContent = '';
        generateQuestion();
      },500);
    } else {
      feedbackDisplay.textContent = 'Try again!';
      feedbackDisplay.style.color = 'red';
    }
  });

  document.getElementById('clear').addEventListener('click', () => {
    userAnswer = '';
    userAnswerDisplay.textContent = '';
    userAnswerDisplay.style.color = 'black';
    feedbackDisplay.textContent = '';
  });

  document.getElementById('gg').addEventListener('click', () => {
    userAnswer = passageDisplay.dataset.answer;
    userAnswerDisplay.style.color = 'red';
    userAnswerDisplay.textContent = userAnswer.split('').map((char) => `(${char})`).join(' - ');
  });

  // Initial load of passage list
  loadPassages();
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