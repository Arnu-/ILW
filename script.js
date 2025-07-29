// API基础URL
const API_BASE_URL = '/api';

// 游戏数据
let wordsList = [];

// 用户数据
let currentUser = {
    id: null,
    username: null
};

// 从API获取单词列表
async function fetchWords() {
    try {
        const response = await fetch(`${API_BASE_URL}/words`);
        if (!response.ok) {
            throw new Error('获取单词列表失败');
        }
        wordsList = await response.json();
        // 更新剩余卡片数显示
        remainingElement.textContent = gameState.remainingCards;
    } catch (error) {
        console.error('获取单词列表错误:', error);
        // 使用默认单词列表
        wordsList = [
            { word: "apple", translation: "苹果" },
            { word: "banana", translation: "香蕉" },
            { word: "orange", translation: "橙子" },
            { word: "grape", translation: "葡萄" },
            { word: "watermelon", translation: "西瓜" },
            { word: "strawberry", translation: "草莓" },
            { word: "pineapple", translation: "菠萝" },
            { word: "peach", translation: "桃子" },
            { word: "cherry", translation: "樱桃" },
            { word: "lemon", translation: "柠檬" }
        ];
    }
}

// 游戏配置
const config = {
    cardsPerLevel: 5,
    cardSpeed: 3000, // 卡片浮动动画速度（毫秒）
    currentLevel: 1,
    maxLevels: 4,
    gameMode: 'english' // 默认模式：显示英文，输入英文 ('english' 或 'chinese')
};

// 游戏状态
let gameState = {
    score: 0,
    activeCards: [],
    gameStarted: false,
    remainingCards: 0
};

// DOM 元素
const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-btn');
const currentUserElement = document.getElementById('current-user');
const switchUserButton = document.getElementById('switch-user-btn');
const wordInput = document.getElementById('word-input');
const cardsContainer = document.getElementById('cards-container');
const scoreElement = document.getElementById('score');
const remainingElement = document.getElementById('remaining');
const messageElement = document.getElementById('message');
const startButton = document.getElementById('start-btn');
const levelCompleteElement = document.getElementById('level-complete');
const finalScoreElement = document.getElementById('final-score');
const nextLevelButton = document.getElementById('next-level-btn');
const viewLeaderboardButton = document.getElementById('view-leaderboard-btn');
const leaderboardElement = document.getElementById('leaderboard');
const leaderboardBody = document.getElementById('leaderboard-body');
const closeLeaderboardButton = document.getElementById('close-leaderboard-btn');

// DOM 元素 - 游戏模式选择
const modeSelectionContainer = document.getElementById('mode-selection');
const englishModeButton = document.getElementById('english-mode-btn');
const chineseModeButton = document.getElementById('chinese-mode-btn');
const changeModeButton = document.getElementById('change-mode-btn');

// 初始化游戏
function initGame() {
    // 检查是否已登录
    if (!currentUser.id) {
        loginContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        modeSelectionContainer.classList.add('hidden');
        return;
    }
    
    // 显示游戏模式选择界面
    loginContainer.classList.add('hidden');
    gameContainer.classList.add('hidden');
    modeSelectionContainer.classList.remove('hidden');
    
    // 重置游戏状态
    gameState.score = 0;
    gameState.activeCards = [];
    gameState.gameStarted = false;
    
    // 更新UI
    scoreElement.textContent = gameState.score;
    cardsContainer.innerHTML = '';
    messageElement.textContent = '';
    messageElement.className = 'message';
    
    // 隐藏通关界面和排行榜
    levelCompleteElement.classList.add('hidden');
    leaderboardElement.classList.add('hidden');
    
    // 启用输入框和开始按钮
    wordInput.disabled = false;
    startButton.disabled = false;
}

// 选择游戏模式后显示游戏界面
function showGameInterface() {
    modeSelectionContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    
    // 根据游戏模式更新输入框提示
    if (config.gameMode === 'english') {
        wordInput.placeholder = "在此输入英文单词...";
    } else {
        wordInput.placeholder = "看到中文，在此输入对应的英文...";
    }
}

// 用户登录
async function loginUser() {
    const username = usernameInput.value.trim();
    
    if (!username) {
        showMessage('请输入用户名', 'incorrect');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '登录失败');
        }
        
        const userData = await response.json();
        
        // 保存用户信息
        currentUser.id = userData.id;
        currentUser.username = userData.username;
        
        // 保存到本地存储
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // 更新UI
        currentUserElement.textContent = currentUser.username;
        
        // 初始化游戏 - 显示游戏模式选择界面
        initGame();
        
    } catch (error) {
        console.error('登录错误:', error);
        showMessage(error.message, 'incorrect');
    }
}

// 开始游戏
function startGame() {
    if (gameState.gameStarted) return;
    
    gameState.gameStarted = true;
    wordInput.focus();
    startButton.disabled = true;
    
    // 根据当前关卡生成卡片数量
    const cardsCount = config.cardsPerLevel + (config.currentLevel - 1) * 2;
    gameState.remainingCards = cardsCount;
    remainingElement.textContent = gameState.remainingCards;
    
    // 随机选择单词并创建卡片
    const shuffledWords = [...wordsList].sort(() => 0.5 - Math.random());
    const levelWords = shuffledWords.slice(0, cardsCount);
    
    // 创建卡片
    levelWords.forEach((wordData, index) => {
        createCard(wordData, index);
    });
}

// 创建卡片
function createCard(wordData, index) {
    const card = document.createElement('div');
    card.className = 'card';
    
    // 根据游戏模式决定卡片显示内容
    if (config.gameMode === 'english') {
        // 英文模式：显示英文单词和中文翻译
        card.innerHTML = `
            <div class="word">${wordData.word}</div>
            <div class="translation">${wordData.translation}</div>
        `;
    } else {
        // 中文模式：显示中文翻译，隐藏英文单词
        card.innerHTML = `
            <div class="word">${wordData.translation}</div>
            <div class="translation" style="display:none;">${wordData.word}</div>
        `;
    }
    
    // 随机位置
    const left = Math.random() * (cardsContainer.offsetWidth - 150);
    const top = Math.random() * (cardsContainer.offsetHeight - 100);
    
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    
    // 随机动画延迟，使卡片浮动不同步
    card.style.animationDelay = `${Math.random() * 2}s`;
    
    cardsContainer.appendChild(card);
    
    // 将卡片添加到活动卡片列表
    gameState.activeCards.push({
        element: card,
        word: wordData.word.toLowerCase()
    });
}

// 检查输入
function checkInput() {
    const inputValue = wordInput.value.toLowerCase().trim();
    
    if (!inputValue) return;
    
    // 查找匹配的卡片
    const matchIndex = gameState.activeCards.findIndex(card => card.word === inputValue);
    
    if (matchIndex !== -1) {
        // 找到匹配的卡片
        const matchedCard = gameState.activeCards[matchIndex];
        
        // 显示正确消息
        if (config.gameMode === 'english') {
            showMessage(`正确！"${inputValue}" 已击毁`, 'correct');
        } else {
            // 在中文模式下，显示中文和英文
            const chineseText = matchedCard.element.querySelector('.word').textContent;
            showMessage(`正确！"${chineseText}" 的英文 "${inputValue}" 已击毁`, 'correct');
        }
        
        // 增加分数
        gameState.score += 10;
        scoreElement.textContent = gameState.score;
        
        // 销毁卡片动画
        matchedCard.element.classList.add('destroyed');
        
        // 从活动卡片中移除
        gameState.activeCards.splice(matchIndex, 1);
        
        // 更新剩余卡片数
        gameState.remainingCards--;
        remainingElement.textContent = gameState.remainingCards;
        
        // 检查是否通关
        if (gameState.remainingCards === 0) {
            setTimeout(levelComplete, 1000);
        }
    } else {
        // 没有找到匹配的卡片
        showMessage(`错误！"${inputValue}" 不在卡片中`, 'incorrect');
        
        // 扣分
        gameState.score = Math.max(0, gameState.score - 5);
        scoreElement.textContent = gameState.score;
    }
    
    // 清空输入框
    wordInput.value = '';
}

// 显示消息
function showMessage(text, type) {
    messageElement.textContent = text;
    messageElement.className = `message ${type}`;
    
    // 2秒后清除消息
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 2000);
}

// 通关
function levelComplete() {
    // 显示通关界面
    levelCompleteElement.classList.remove('hidden');
    finalScoreElement.textContent = gameState.score;
    
    // 禁用输入
    wordInput.disabled = true;
    
    // 保存分数
    saveScore();
}

// 保存分数
async function saveScore() {
    if (!currentUser.id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                score: gameState.score,
                level: config.currentLevel
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '保存分数失败');
        }
        
    } catch (error) {
        console.error('保存分数错误:', error);
        showMessage('保存分数失败', 'incorrect');
    }
}

// 进入下一关
function nextLevel() {
    if (config.currentLevel < config.maxLevels) {
        config.currentLevel++;
        initGame();
    } else {
        // 游戏全部通关
        levelCompleteElement.querySelector('h2').textContent = '恭喜！你已完成所有关卡！';
        nextLevelButton.textContent = '重新开始';
        config.currentLevel = 1;
    }
}

// 显示排行榜
async function showLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/scores/top?limit=10`);
        
        if (!response.ok) {
            throw new Error('获取排行榜失败');
        }
        
        const scores = await response.json();
        
        // 清空排行榜
        leaderboardBody.innerHTML = '';
        
        // 添加排行榜数据
        scores.forEach((score, index) => {
            const row = document.createElement('tr');
            
            // 格式化日期
            const date = new Date(score.created_at);
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.username}</td>
                <td>${score.score}</td>
                <td>${score.level}</td>
                <td>${formattedDate}</td>
            `;
            
            leaderboardBody.appendChild(row);
        });
        
        // 显示排行榜
        gameContainer.classList.add('hidden');
        leaderboardElement.classList.remove('hidden');
        
    } catch (error) {
        console.error('获取排行榜错误:', error);
        showMessage('获取排行榜失败', 'incorrect');
    }
}

// 切换用户
function switchUser() {
    // 清除当前用户信息
    currentUser = {
        id: null,
        username: null
    };
    
    // 清除本地存储
    localStorage.removeItem('currentUser');
    
    // 更新UI
    currentUserElement.textContent = '未登录';
    
    // 显示登录界面
    loginContainer.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    modeSelectionContainer.classList.add('hidden');
    leaderboardElement.classList.add('hidden');
    
    // 重置游戏状态
    gameState.score = 0;
    gameState.activeCards = [];
    gameState.gameStarted = false;
    scoreElement.textContent = gameState.score;
    
    // 清空输入框
    usernameInput.value = '';
    usernameInput.focus();
}

// 事件监听
loginButton.addEventListener('click', loginUser);
startButton.addEventListener('click', startGame);
nextLevelButton.addEventListener('click', nextLevel);
viewLeaderboardButton.addEventListener('click', showLeaderboard);
closeLeaderboardButton.addEventListener('click', () => {
    leaderboardElement.classList.add('hidden');
    gameContainer.classList.remove('hidden');
});
switchUserButton.addEventListener('click', switchUser);

// 游戏模式选择事件
englishModeButton.addEventListener('click', () => {
    config.gameMode = 'english';
    showGameInterface();
});

chineseModeButton.addEventListener('click', () => {
    config.gameMode = 'chinese';
    showGameInterface();
});

// 更换游戏模式按钮
changeModeButton.addEventListener('click', () => {
    // 如果游戏已经开始，提示用户
    if (gameState.gameStarted) {
        showMessage('请先完成当前游戏或刷新页面以更换模式', 'incorrect');
        return;
    }
    
    // 返回模式选择界面
    gameContainer.classList.add('hidden');
    modeSelectionContainer.classList.remove('hidden');
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginUser();
    }
});

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && gameState.gameStarted) {
        checkInput();
    }
});

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 先获取单词列表
    await fetchWords();
    
    // 检查本地存储中是否有用户信息
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            currentUserElement.textContent = currentUser.username;
            initGame(); // 这将显示游戏模式选择界面
        } catch (e) {
            console.error('解析保存的用户信息失败:', e);
            localStorage.removeItem('currentUser');
            initGame(); // 这将显示登录界面
        }
    } else {
        // 没有保存的用户信息，显示登录界面
        initGame();
    }
});
