// Game state
let currentPage = 'intro';
let secretCode = [];
let currentRow = 0;
let currentGuess = [null, null, null, null];
let gameWon = false;
let attempts = 0;
let allowDuplicates = false;
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
        startNewGame();
        showPage('game');
    });
    
    document.getElementById('rules-btn').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
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
    currentRow = 9; // Start from bottom (row 9)
    currentGuess = [null, null, null, null];
    gameWon = false;
    attempts = 0;
    
    // Create game board
    createGameBoard();
    updateUI();
}

function createGameBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    
    // Create 10 rows (0-9, displayed top to bottom but played bottom to top)
    for (let row = 0; row < 10; row++) {
        const rowElement = document.createElement('div');
        rowElement.className = 'flex items-center justify-between p-1';
        rowElement.id = `row-${row}`;
        
        // User guess circles (left side) - 4 larger circles
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
        
        // Feedback circles (right side) - 4 smaller circles in a row
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
    
    if (row !== currentRow || gameWon) return;
    
    const color = e.dataTransfer.getData('text/plain');
    
    // Check if duplicates are allowed
    if (!allowDuplicates && currentGuess.includes(color)) {
        return; // Don't allow duplicate colors
    }
    
    currentGuess[pos] = color;
    updateCurrentRow();
    updateCheckButton();
}

function clearPosition(row, pos) {
    if (row !== currentRow || gameWon) return;
    
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
    checkBtn.disabled = hasEmptyPosition || gameWon;
}

function submitGuess() {
    if (gameWon || currentGuess.some(c => c === null)) return;
    
    attempts++;
    const feedback = getFeedback(currentGuess, secretCode);
    
    // Update feedback display
    for (let pos = 0; pos < 4; pos++) {
        const feedbackCircle = document.getElementById(`feedback-${currentRow}-${pos}`);
        switch (feedback[pos]) {
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
    
    // Check if won
    if (feedback.every(f => f === 'correct')) {
        gameWon = true;
        showWinModal();
    } else if (attempts >= 10) {
        // Game over
        alert('Game Over! The secret code was: ' + secretCode.join(', '));
        startNewGame();
    } else {
        // Move to next row (going up)
        currentRow--;
        currentGuess = [null, null, null, null];
        highlightCurrentRow();
    }
    
    updateUI();
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
            row.style.backgroundColor = '';
        }
    }
    
    // Highlight current row
    if (currentRow >= 0) {
        const currentRowElement = document.getElementById(`row-${currentRow}`);
        if (currentRowElement) {
            currentRowElement.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }
        updateCurrentRow();
    }
}

function updateUI() {
    updateCheckButton();
    highlightCurrentRow();
}

function showWinModal() {
    const stars = getStars(attempts);
    const score = getScore(attempts);
    
    // Update stars display
    const starsDisplay = document.getElementById('stars-display');
    starsDisplay.innerHTML = '';
    
    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.className = i < stars ? 'star' : 'star empty';
        star.textContent = '★';
        starsDisplay.appendChild(star);
    }
    
    document.getElementById('attempts-used').textContent = attempts;
    document.getElementById('score-display').textContent = score;
    document.getElementById('win-modal').classList.add('show');
}

function hideModal() {
    document.getElementById('win-modal').classList.remove('show');
}

function getStars(attempts) {
    if (attempts <= 2) return 5;
    if (attempts <= 4) return 4;
    if (attempts <= 6) return 3;
    if (attempts <= 8) return 2;
    return 1;
}

function getScore(attempts) {
    // Correct scoring formula: 110 - (attempts × 10)
    // 1 attempt = 100 points, 2 attempts = 90 points, etc.
    // Minimum score is 10 points for 10 attempts
    return Math.max(10, 110 - (attempts * 10));
}