'use strict';

const shortestConceivableWordLength = 2;
const gameWordFrequency             = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 4, 4, 4, 4, 4, 8, 8, 8, 9, 9, 10, 11];
const wordWrapper                   = document.querySelector('#word-wrapper');
const log                           = document.querySelector('#log');
const guess                         = document.querySelector('#guess');
const guessHistory                  = document.querySelector('#guess-history');
let   cheatMode                     = true;  // allow the computer to cheat by changing its word
const cheatThreshold                = 2000;  // don't cheat if there are still at least this many candidate words (improves performance, reduces runaway cheating)
let   transparentCheating           = true;  // tell the player when we cheat?
let   ghostMode                     = false; // show the word the computer is thinking of as placeholder text
const eventQueueDelay               = 350;   // wait time between the computer "doing" things (slows it down, makes it feel more fun)

// Array.random polyfills
Array.prototype.random = function(){
  return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.rotateRight = function() {
  const howFarToRotate = Math.floor(Math.random()*this.length);
  this.unshift.apply(this, this.splice(howFarToRotate, this.length))
}

// Load wordlist
fetch('wordlist.txt').then(r=>r.text()).then(t=>{
  // Set up wordlist
  const fullWordlist = t.split("\n").map(w=>w.toUpperCase());
  const longestWordLength = fullWordlist.reduce((p,v)=>p.length>v.length?p:v).length;
  let wordlist = [];
  let eventQueue = [];
  for(let i = shortestConceivableWordLength; i <= longestWordLength; i++) wordlist[i] = fullWordlist.filter(w=>w.length == i)

  // Storage for game
  let targetWord, targetWordLength, guesses;

  // Event queue
  setInterval(function(){
    const event = eventQueue.shift();
    if(!event) return; // nothing to do!
    if((typeof event) == 'string'){
      addToLog(event);
    } else {
      event();
    }
  }, eventQueueDelay);
  function queueEvent(log_or_function){
    eventQueue.push(log_or_function);
  }

  function addToLog(message){
    log.value = `${log.value}${message}\n`;
    log.scrollTop = log.scrollHeight;
  }

  function allowGuesses(){
    guess.disabled = false;
    guess.value = '';
    guess.focus();
  }

  function applyGuess(guessValue, guessIsGood){
    guesses.push(guessValue);
    let guessHistoryEntry = document.createElement('li');
    guessHistoryEntry.textContent = guessValue;
    guessHistoryEntry.className = guessIsGood ? 'good' : 'bad';
    guessHistory.append(guessHistoryEntry);
    queueEvent(drawWord);
    drawWord();
  }

  // Returns the target word as an array of letters with only the successfully guessed
  // letters present. The missing letters are substituted with the provided gap item.
  function targetWordWithGaps(gapType){
    const targetLetters = targetWord.split('');
    let result = [];
    for(let i = 0; i < targetLetters.length; i++){
      result.push(guesses.includes(targetLetters[i]) ? targetLetters[i] : gapType);
    }
    return result;

  }

  function drawWord(){
    const letterContainers = wordWrapper.querySelectorAll('.letter');
    const targetLetters = targetWord.split('');
    const targetLettersWithGaps = targetWordWithGaps('');
    for(let i = 0; i < targetLetters.length; i++){
      letterContainers[i].value = targetLettersWithGaps[i];
      letterContainers[i].placeholder = ghostMode ? targetLetters[i] : '';
    }
  }

  function drawSettings(){
    document.querySelector('#cheatMode').checked = cheatMode;
    document.querySelector('#transparentCheating').checked = transparentCheating;
    document.querySelector('#ghostMode').checked = ghostMode;
  }
  document.querySelector('#cheatMode').addEventListener('change', function(e){
    cheatMode = e.target.checked;
  });
  document.querySelector('#transparentCheating').addEventListener('change', function(e){
    transparentCheating = e.target.checked;
  });
  document.querySelector('#ghostMode').addEventListener('change', function(e){
    ghostMode = e.target.checked;
    drawWord();
  });

  function startGame(){
    targetWordLength = gameWordFrequency.random();
    targetWord = wordlist[targetWordLength].random();
    wordWrapper.innerHTML = targetWord.split('').map(l=>'<input type="text" class="letter" disabled="disabled" maxlength="1" />').join('');
    guesses = [];
    guessHistory.innerHTML = '';
    drawSettings();
    drawWord();
    allowGuesses();
    log.value = `I'm thinking of a word with ${targetWordLength} letters.\n`;
  }

  document.querySelector('#start-over').addEventListener('click', startGame);

  guess.addEventListener('keyup', function(){
    const guessValue = guess.value.toUpperCase();
    guess.disabled = true;
    addToLog(`Your guess: ${guessValue}`);
    // Sanity-check the guess
    if(!guessValue.match(/^[A-Z]$/)){
      queueEvent("That's not even a letter!");
      queueEvent(allowGuesses);
      return;
    }
    if(guesses.includes(guessValue)){
      queueEvent("You've already guessed that.");
      queueEvent(allowGuesses);
      return;
    }
    // Engage cheat mode, if enabled
    if(cheatMode){
      // Generate a list of words we could secretly switch to
      const unguessedLetter = `[^${guesses.concat(['_']).join('')}]`; // use underscore as placeholder, effectively, in case we've made NO guesses yet
      const guessesRegExp = RegExp(`^${targetWordWithGaps(unguessedLetter).join('')}$`)
      console.log(guessesRegExp);
      const wordsWeCouldHaveHad = wordlist[targetWordLength].filter(w=>w.match(guessesRegExp));
      // Rotate wordsWeCouldHaveHad a random amount so that the "first" high-scoring pick may vary
      wordsWeCouldHaveHad.rotateRight();
      if(wordsWeCouldHaveHad.length <= cheatThreshold){
        // For each word we could have switched to, determine how much the search space is reduced by such a switch,
        // and pick the one which maximises the search space as our new word
        let wordsWeCouldHaveHadScores = [];
        const regExpOfUnguessedLetters = RegExp(`[^${guesses.concat([guessValue]).join('')}]`, 'g');
        for(let i = 0; i < wordsWeCouldHaveHad.length; i++){
          const wordWeCouldHaveHad = wordsWeCouldHaveHad[i];
          const regExpForSearchSpace = RegExp(`^${wordWeCouldHaveHad.replace(regExpOfUnguessedLetters, '.')}$`);
          wordsWeCouldHaveHadScores[i] = wordlist[targetWordLength].filter(w=>w.match(regExpForSearchSpace)).length;
        }
        const currentWordScore = wordsWeCouldHaveHadScores[wordsWeCouldHaveHad.indexOf(targetWord)];
        const topScore = Math.max(...wordsWeCouldHaveHadScores);
        if(topScore > currentWordScore){
          const positionOfTopScoringWord = wordsWeCouldHaveHadScores.indexOf(topScore);
          const candidateNewWord = wordsWeCouldHaveHad[positionOfTopScoringWord];
          if(candidateNewWord != targetWord){
            if(transparentCheating) queueEvent(`I was thinking of ${targetWord}, but now I've changed my mind.`);
            targetWord = candidateNewWord;
          }
        }
      }
    }
    // Report on the guess
    const guessIsGood = targetWord.includes(guessValue);
    if(guessIsGood){
      queueEvent(`Good guess. ${guessValue} found.`);
    } else {
      queueEvent(`Unlucky. There's no ${guessValue}.`);
    }
    // Apply the guess
    applyGuess(guessValue, guessIsGood);
    // Check win conditions
    const won = ([...document.querySelectorAll('#word-wrapper .letter')].filter(l=>l.value=='').length == 0);
    if(won){
      queueEvent("You win!")
    } else {
      queueEvent(allowGuesses);
    }
  });

  // Loaded
  document.body.classList.add('loaded');
  startGame();
})
