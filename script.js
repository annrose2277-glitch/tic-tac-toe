/**
 * TicTacToe Module
 * Encapsulates game state, logic, and UI interactions to prevent global scope pollution.
 */
const TicTacToe = (() => {
  // --- Private Constants ---
  const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  // --- Private State ---
  let state = {
    playerNames: { "X": "Player X", "O": "Player O" },
    currentPlayer: "X",
    gameActive: false,
    gameState: ["", "", "", "", "", "", "", "", ""],
    scores: JSON.parse(localStorage.getItem("tttScores")) || { X: 0, O: 0, draws: 0 },
    gameMode: "2p",
    difficulty: "easy",
    botSymbol: "O",
    gameHistory: JSON.parse(localStorage.getItem("tttHistory")) || []
  };

  // --- DOM Elements Cache ---
  const els = {
    cells: document.querySelectorAll(".cell"),
    statusText: document.getElementById("status"),
    resetBtn: document.getElementById("resetBtn"),
    startBtn: document.getElementById("startBtn"),
    changeNamesBtn: document.getElementById("changeNamesBtn"),
    setupContainer: document.getElementById("setup-container"),
    gameContainer: document.getElementById("game-container"),
    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficulty"),
    scoreX: document.getElementById("scoreX"),
    scoreO: document.getElementById("scoreO"),
    scoreDraw: document.getElementById("scoreDraw"),
    resetScoresBtn: document.getElementById("resetScores"),
    historyList: document.getElementById("historyList"),
    winLine: document.getElementById("winLine"),
    board: document.getElementById("board"),
    p1Input: document.getElementById("p1Input"),
    p2Input: document.getElementById("p2Input")
  };

  // --- Private Methods ---

  const launchConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      if (typeof confetti === "function") {
        confetti({
          particleCount: 60,
          spread: 100,
          origin: { y: 0.6 }
        });
      }
    }, 250);
  };

  const updateStatus = () => {
    if (!state.gameActive) return;
    els.statusText.innerText = `${state.playerNames[state.currentPlayer]}'s turn (${state.currentPlayer})`;
  };

  const updateLeaderboard = () => {
    els.scoreX.innerText = state.scores.X || 0;
    els.scoreO.innerText = state.scores.O || 0;
    els.scoreDraw.innerText = state.scores.draws || 0;
    localStorage.setItem("tttScores", JSON.stringify(state.scores));
  };

  const saveGameHistory = (result) => {
    state.gameHistory.push(result);
    localStorage.setItem("tttHistory", JSON.stringify(state.gameHistory));
    displayGameHistory();
  };

  const displayGameHistory = () => {
    if (!els.historyList) return;
    els.historyList.innerHTML = "";
    state.gameHistory.forEach((result, index) => {
      const li = document.createElement("li");
      li.innerText = `Game ${index + 1}: ${result}`;
      els.historyList.appendChild(li);
    });
  };

  const playMove = (index, player) => {
    state.gameState[index] = player;
    const cell = Array.from(els.cells).find(c => Number(c.getAttribute("data-index")) === index);
    if (cell) {
      cell.textContent = player;
      cell.style.color = player === "X" ? "#3498db" : "#e67e22";
    }
  };

  const checkWinner = (board) => {
    for (let cond of winningConditions) {
      const [a, b, c] = cond;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) {
        return board[a];
      }
    }
    return null;
  };

  const animateWinLine = (cond, winner) => {
    if (!els.winLine || !els.board) return;

    const cellEls = Array.from(els.cells);
    const startCell = cellEls[cond[0]];
    const endCell = cellEls[cond[2]];

    const boardRect = els.board.getBoundingClientRect();
    const sRect = startCell.getBoundingClientRect();
    const eRect = endCell.getBoundingClientRect();

    const x1 = sRect.left - boardRect.left + sRect.width / 2;
    const y1 = sRect.top - boardRect.top + sRect.height / 2;
    const x2 = eRect.left - boardRect.left + eRect.width / 2;
    const y2 = eRect.top - boardRect.top + eRect.height / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    els.winLine.style.width = `${length}px`;
    els.winLine.style.left = `${x1}px`;
    const h = els.winLine.offsetHeight || 6;
    els.winLine.style.top = `${y1 - h / 2}px`;
    els.winLine.style.transform = `rotate(${angle}deg)`;
    els.winLine.style.background = winner === "X" ? "#3498db" : "#e67e22";
    els.winLine.style.opacity = "1";
  };

  const getBestMove = (board, player, alpha = -Infinity, beta = Infinity) => {
    const opponent = player === "X" ? "O" : "X";
    const winner = checkWinner(board);
    
    if (winner === state.botSymbol) return { index: -1, score: 10 };
    if (winner === (state.botSymbol === "X" ? "O" : "X")) return { index: -1, score: -10 };
    if (!board.includes("")) return { index: -1, score: 0 };

    let bestMove;

    if (player === state.botSymbol) {
      let bestScore = -Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
          board[i] = player;
          let result = getBestMove(board, opponent, alpha, beta);
          board[i] = "";
          
          if (result.score > bestScore) {
            bestScore = result.score;
            bestMove = { index: i, score: bestScore };
          }
          alpha = Math.max(alpha, bestScore);
          if (beta <= alpha) break;
        }
      }
      return bestMove || { index: -1, score: bestScore };
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
          board[i] = player;
          let result = getBestMove(board, opponent, alpha, beta);
          board[i] = "";
          
          if (result.score < bestScore) {
            bestScore = result.score;
            bestMove = { index: i, score: bestScore };
          }
          beta = Math.min(beta, bestScore);
          if (beta <= alpha) break;
        }
      }
      return bestMove || { index: -1, score: bestScore };
    }
  };

  const aiMove = () => {
    if (!state.gameActive) return;
    const emptyIndices = state.gameState.map((val, idx) => val === "" ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return;

    let moveIndex;
    if (state.difficulty === "easy") {
      moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else if (state.difficulty === "medium") {
      if (Math.random() < 0.25) {
        moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
      } else {
        moveIndex = getBestMove(state.gameState.slice(), state.botSymbol).index;
      }
    } else {
      moveIndex = getBestMove(state.gameState.slice(), state.botSymbol).index;
    }

    playMove(moveIndex, state.botSymbol);
    if (!checkResult()) {
      state.currentPlayer = state.currentPlayer === "X" ? "O" : "X";
      updateStatus();
    }
  };

  const checkResult = () => {
    for (let cond of winningConditions) {
      const [a, b, c] = cond;
      if (state.gameState[a] && state.gameState[a] === state.gameState[b] && state.gameState[b] === state.gameState[c]) {
        const winner = state.gameState[a];
        els.statusText.innerText = `${state.playerNames[winner]} wins!`;
        state.scores[winner] = (state.scores[winner] || 0) + 1;
        
        saveGameHistory(`${state.playerNames[winner]} won`);
        state.gameActive = false;
        updateLeaderboard();
        animateWinLine(cond, winner);
        launchConfetti();
        return true;
      }
    }

    if (!state.gameState.includes("")) {
      els.statusText.innerText = "It's a draw!";
      state.scores.draws = (state.scores.draws || 0) + 1;
      saveGameHistory("Draw");
      state.gameActive = false;
      updateLeaderboard();
      
      if (els.winLine) {
        els.winLine.style.width = "0";
        els.winLine.style.opacity = "0";
      }
      return true;
    }
    return false;
  };

  const startGame = () => {
    state.gameActive = true;
    state.currentPlayer = "X";
    state.gameState = ["", "", "", "", "", "", "", "", ""];
    updateStatus();
    els.cells.forEach(cell => {
      cell.innerText = "";
      cell.style.color = "#333";
    });
    updateLeaderboard();

    if (els.winLine) {
      els.winLine.style.width = "0";
      els.winLine.style.opacity = "0";
      els.winLine.style.transform = "rotate(0deg)";
    }
  };

  const handleCellClick = (e) => {
    const clickedCell = e.target;
    const cellIndex = Number(clickedCell.getAttribute("data-index"));
    
    if (isNaN(cellIndex) || !state.gameActive || state.gameState[cellIndex] !== "") return;

    playMove(cellIndex, state.currentPlayer);

    if (checkResult()) return;

    state.currentPlayer = state.currentPlayer === "X" ? "O" : "X";
    updateStatus();

    if (state.gameMode === "bot" && state.currentPlayer === state.botSymbol && state.gameActive) {
      setTimeout(() => aiMove(), 300);
    }
  };

  const resetGame = () => {
    startGame();
  };

  const bindEvents = () => {
    els.modeSelect.addEventListener("change", () => {
      state.gameMode = els.modeSelect.value;
      els.difficultySelect.disabled = state.gameMode !== "bot";
    });

    els.startBtn.addEventListener("click", () => {
      state.playerNames["X"] = els.p1Input.value.trim() || "Player X";
      state.playerNames["O"] = els.p2Input.value.trim() || "Player O";
      state.gameMode = els.modeSelect.value;
      state.difficulty = els.difficultySelect.value;

      els.setupContainer.style.display = "none";
      els.gameContainer.style.display = "block";
      startGame();
    });

    els.cells.forEach(cell => cell.addEventListener("click", handleCellClick));
    els.resetBtn.addEventListener("click", resetGame);

    els.changeNamesBtn.addEventListener("click", () => {
      els.gameContainer.style.display = "none";
      els.setupContainer.style.display = "block";
      els.p1Input.value = "";
      els.p2Input.value = "";
      resetGame();
      state.gameActive = false;
    });

    els.resetScoresBtn.addEventListener("click", () => {
      state.scores = { X: 0, O: 0, draws: 0 };
      localStorage.removeItem("tttScores");
      updateLeaderboard();
    });
  };

  // --- Public Interface ---
  return {
    init: () => {
      bindEvents();
      updateLeaderboard();
      displayGameHistory();
      // Ensure difficulty is synced on load
      els.difficultySelect.disabled = els.modeSelect.value !== "bot";
    }
  };
})();

// Initialize the game
TicTacToe.init();