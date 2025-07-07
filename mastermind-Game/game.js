// Game state
let currentPage = 'intro';
let secretCode = [];
let currentRow = 0;
let currentGuess = [null, null, null, null];
let gameWon = false;
let gameLost = false;
let attempts = 0;
let allowDuplicates = false;
let hardMode = false;
let usedColors = [];

// Color mappings
const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-400',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-400'
};

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    showPage('intro');
});

function setupEventListeners() {
    // Navigation buttons
    document.getElementById('start-game-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hardMode = document.getElementById('hard-mode-toggle').checked;
        startNewGame();
        showPage('game');
    });
    
    document.getElementById('rules-btn').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Store hard mode state when switching to rules
    const checkbox = document.getElementById('hard-mode-toggle');
    if (checkbox) {
        hardMode = checkbox.checked;
    }

    showPage('rules');
    });

    
    document.getElementById('back-to-intro').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showPage('intro');
    });
    
    document.getElementById('start-from-rules').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startNewGame();
        showPage('game');
    });

    
    document.getElementById('back-to-menu').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showPage('intro');
    });
    
    document.getElementById('reset-game').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startNewGame();
    });
    
    document.getElementById('start-new-game').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startNewGame();
    });
    
    // Toggle switch
    document.getElementById('duplicate-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        allowDuplicates = !allowDuplicates;
        this.classList.toggle('active');
    });
    
    // Drag and drop setup
    setupDragAndDrop();
    
    // Check guess button
    document.getElementById('check-guess').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        submitGuess();
    });
    
    // Modal buttons
    document.getElementById('play-again').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideModal();
        startNewGame();
    });
    
    document.getElementById('close-modal').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideModal();
    });
}

function setupDragAndDrop() {
    // Make color buttons draggable
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('dragstart', handleDragStart);
        btn.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.color);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function showPage(page) {
    // Hide all pages
    document.getElementById('intro-page').classList.add('hidden');
    document.getElementById('rules-page').classList.add('hidden');
    document.getElementById('game-page').classList.add('hidden');
    
    // Show selected page
    document.getElementById(page + '-page').classList.remove('hidden');
    currentPage = page;
}

function startNewGame() {
    // Reset secret display to question marks
    const secretCircles = document.querySelectorAll('.secret-circle');
    secretCircles.forEach(circle => {
        circle.className = 'secret-circle w-8 h-8 sm:w-10 sm:h-10 bg-slate-500 rounded-full flex items-center justify-center text-white font-bold text-lg';
        circle.textContent = '?';
    });
    
    // Generate random secret code
    secretCode = [];
    usedColors = [];
    
    for (let i = 0; i < 4; i++) {
        let color;
        if (allowDuplicates) {
            color = colors[Math.floor(Math.random() * colors.length)];
        } else {
            do {
                color = colors[Math.floor(Math.random() * colors.length)];
            } while (usedColors.includes(color));
            usedColors.push(color);
        }
        secretCode.push(color);
    }
    
    // Reset game state
    currentRow = 9;
    currentGuess = [null, null, null, null];
    gameWon = false;
    gameLost = false;
    attempts = 0;
    
    // Create game board
    createGameBoard();
    updateUI();
}

function createGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    // Create 10 rows
    for (let row = 0; row < 10; row++) {
        const rowElement = document.createElement('div');
        rowElement.className = 'flex items-center justify-between p-1';
        rowElement.id = `row-${row}`;
        
        // User guess circles (left side)
        const guessSection = document.createElement('div');
        guessSection.className = 'flex gap-1';
        
        for (let pos = 0; pos < 4; pos++) {
            const circle = document.createElement('div');
            circle.className = 'guess-circle rounded-full bg-gray-600 border-2 border-gray-500';
            circle.id = `guess-${row}-${pos}`;
            
            // Add drop zone functionality
            circle.addEventListener('dragover', handleDragOver);
            circle.addEventListener('drop', (e) => handleDrop(e, row, pos));
            circle.addEventListener('dragleave', handleDragLeave);
            circle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                clearPosition(row, pos);
            });
            
            guessSection.appendChild(circle);
        }
        
        // Feedback circles (right side)
        const feedbackSection = document.createElement('div');
        feedbackSection.className = 'flex gap-1';
        
        for (let pos = 0; pos < 4; pos++) {
            const circle = document.createElement('div');
            circle.className = 'feedback-circle bg-gray-700 rounded-full';
            circle.id = `feedback-${row}-${pos}`;
            feedbackSection.appendChild(circle);
        }
        
        rowElement.appendChild(guessSection);
        rowElement.appendChild(feedbackSection);
        gameBoard.appendChild(rowElement);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.target.classList.add('drop-zone', 'drag-over');
}

function handleDragLeave(e) {
    e.target.classList.remove('drop-zone', 'drag-over');
}

function handleDrop(e, row, pos) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('drop-zone', 'drag-over');
    
    if (row !== currentRow || gameWon || gameLost) return;
    
    const color = e.dataTransfer.getData('text/plain');
    
    // Check if duplicates are allowed
    if (!allowDuplicates && currentGuess.includes(color)) {
        return;
    }
    
    currentGuess[pos] = color;
    updateCurrentRow();
    updateCheckButton();
}

function clearPosition(row, pos) {
    if (row !== currentRow || gameWon || gameLost) return;
    
    currentGuess[pos] = null;
    updateCurrentRow();
    updateCheckButton();
}

function updateCurrentRow() {
    for (let pos = 0; pos < 4; pos++) {
        const circle = document.getElementById(`guess-${currentRow}-${pos}`);
        if (currentGuess[pos]) {
            circle.className = `guess-circle rounded-full cursor-pointer ${colorClasses[currentGuess[pos]]} border-2 border-white`;
        } else {
            circle.className = 'guess-circle rounded-full bg-gray-600 border-2 border-gray-500 drop-zone cursor-pointer';
        }
    }
}

function updateCheckButton() {
    const checkBtn = document.getElementById('check-guess');
    const hasEmptyPosition = currentGuess.some(c => c === null);
    checkBtn.disabled = hasEmptyPosition || gameWon || gameLost;
}

function submitGuess() {
    if (gameWon || gameLost || currentGuess.some(c => c === null)) return;
    
    attempts++;
    const feedback = getFeedback(currentGuess, secretCode);
    
    // Update feedback display
    updateFeedbackDisplay(currentRow, feedback);
    
    // Check if won
    if (feedback.every(f => f === 'correct')) {
        gameWon = true;
        setTimeout(() => showWinModal(true), 500);
    } else if (attempts >= 10) {
        // Game over
        gameLost = true;
        revealSecret();
        setTimeout(() => showWinModal(false), 1500);
    } else {
        // Move to next row
        currentRow--;
        currentGuess = [null, null, null, null];
        highlightCurrentRow();
    }
    
    updateUI();
}

function revealSecret() {
    // Animate secret code reveal
    const secretCircles = document.querySelectorAll('.secret-circle');
    
    secretCircles.forEach((circle, index) => {
        setTimeout(() => {
            circle.classList.add('secret-reveal');
            
            setTimeout(() => {
                circle.className = `secret-circle w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${colorClasses[secretCode[index]]} border-2 border-white shadow-lg`;
                circle.textContent = '';
            }, 200);
        }, index * 200);
    });
}

function updateFeedbackDisplay(row, feedback) {
    // In hard mode, shuffle the feedback array
    let displayFeedback = [...feedback];
    if (hardMode) {
        displayFeedback = shuffleArray(displayFeedback);
    }
    
    for (let pos = 0; pos < 4; pos++) {
        const feedbackCircle = document.getElementById(`feedback-${row}-${pos}`);
        switch (displayFeedback[pos]) {
            case 'correct':
                feedbackCircle.className = 'feedback-circle bg-green-500 rounded-full';
                break;
            case 'misplaced':
                feedbackCircle.className = 'feedback-circle bg-red-500 rounded-full';
                break;
            case 'wrong':
                feedbackCircle.className = 'feedback-circle bg-white rounded-full';
                break;
        }
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getFeedback(guess, secret) {
    const feedback = [];
    const secretCopy = [...secret];
    const guessCopy = [...guess];
    
    // First pass: check for correct positions
    for (let i = 0; i < 4; i++) {
        if (guessCopy[i] === secretCopy[i]) {
            feedback[i] = 'correct';
            secretCopy[i] = null;
            guessCopy[i] = null;
        }
    }
    
    // Second pass: check for wrong positions
    for (let i = 0; i < 4; i++) {
        if (guessCopy[i] !== null) {
            const secretIndex = secretCopy.findIndex(c => c === guessCopy[i]);
            if (secretIndex !== -1) {
                feedback[i] = 'misplaced';
                secretCopy[secretIndex] = null;
            } else {
                feedback[i] = 'wrong';
            }
        }
    }
    
    return feedback;
}

function highlightCurrentRow() {
    // Remove highlight from all rows
    for (let i = 0; i < 10; i++) {
        const row = document.getElementById(`row-${i}`);
        if (row) {
            row.classList.remove('row-highlight');
        }
    }
    
    // Highlight current row
    if (currentRow >= 0) {
        const currentRowElement = document.getElementById(`row-${currentRow}`);
        if (currentRowElement) {
            currentRowElement.classList.add('row-highlight');
        }
        updateCurrentRow();
    }
}

function updateUI() {
    updateCheckButton();
    highlightCurrentRow();
}

function showWinModal(won) {
    const modal = document.getElementById('win-modal');
    const modalHeader = document.getElementById('modal-header');
    const modalTitle = document.getElementById('modal-title');
    const modalSubtitle = document.getElementById('modal-subtitle');
    const attemptsText = document.getElementById('attempts-text');
    const attemptsUsed = document.getElementById('attempts-used');
    const attemptsWord = document.getElementById('attempts-word');
    const scoreContainer = document.getElementById('score-container');
    
    if (won) {
        const stars = getStars(attempts);
        const score = getScore(attempts);
        
        modalHeader.className = 'bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-3xl p-4 sm:p-6 text-center';
        modalTitle.textContent = 'Congratulations!';
        modalSubtitle.textContent = 'You cracked the code!';
        
        attemptsText.textContent = 'Solved in';
        attemptsUsed.textContent = attempts;
        attemptsWord.textContent = attempts === 1 ? 'attempt' : 'attempts';
        
        scoreContainer.style.display = 'block';
        document.getElementById('score-display').textContent = score;
        
        // Update stars display with animation
        const starsDisplay = document.getElementById('stars-display');
        starsDisplay.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = `text-3xl star-animate star-${i + 1}`;
            star.style.opacity = '0';
            star.textContent = i < stars ? '⭐' : '☆';
            starsDisplay.appendChild(star);
        }
    } else {
        modalHeader.className = 'bg-gradient-to-r from-red-400 to-red-500 rounded-t-3xl p-4 sm:p-6 text-center';
        modalTitle.textContent = 'Game Over!';
        modalSubtitle.textContent = 'Better luck next time!';
        
        attemptsText.textContent = 'Keep practicing!';
        attemptsUsed.textContent = '';
        attemptsWord.textContent = '';
        
        scoreContainer.style.display = 'none';
        
        // Show 0 stars
        const starsDisplay = document.getElementById('stars-display');
        starsDisplay.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'text-3xl text-gray-300';
            star.textContent = '☆';
            starsDisplay.appendChild(star);
        }
    }
    
    modal.classList.add('show');
}

function hideModal() {
    document.getElementById('win-modal').classList.remove('show');
}

function getStars(attempts) {
    if (attempts <= 3) return 3;
    if (attempts <= 6) return 2;
    return 1;
}

function getScore(attempts) {
    // Scoring formula: 110 - (attempts × 10)
    return Math.max(10, 110 - (attempts * 10));
}