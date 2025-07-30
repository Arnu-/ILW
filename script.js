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
    gameMode: 'english', // 默认模式：显示英文，输入英文 ('english' 或 'chinese')
    cardSpacing: 20, // 卡片之间的最小间距
    soundEnabled: true // 是否启用单词发音
};

// 游戏状态
let gameState = {
    score: 0,
    activeCards: [],
    gameStarted: false,
    remainingCards: 0,
    startTime: null,
    timeSpent: 0,
    timerInterval: null,
    keyboardVisible: false,
    hintWord: null,
    currentHintIndex: 0,
    userInput: '',
    overlapDetectionInterval: null
};

// DOM 元素
const loginContainer = document.getElementById('login-container');
const gameContainer = document.getElementById('game-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-btn');
const currentUserElement = document.getElementById('current-user');
const switchUserButton = document.getElementById('switch-user-btn');
const showLeaderboardButton = document.getElementById('show-leaderboard-btn');
const levelTopThreeElement = document.getElementById('level-top-three');
const userRankInfoElement = document.getElementById('user-rank-info');
const wordInput = document.getElementById('word-input');
const cardsContainer = document.getElementById('cards-container');
const scoreElement = document.getElementById('score');
const remainingElement = document.getElementById('remaining');
const timerElement = document.getElementById('timer');
const gameTimerElement = document.getElementById('game-timer');
const messageElement = document.getElementById('message');
const soundButton = document.getElementById('sound-btn');
const startButton = document.getElementById('start-btn');
const levelCompleteElement = document.getElementById('level-complete');
const finalScoreElement = document.getElementById('final-score');
const finalTimeElement = document.getElementById('final-time');
const nextLevelButton = document.getElementById('next-level-btn');
const viewLeaderboardButton = document.getElementById('view-leaderboard-btn');
const leaderboardElement = document.getElementById('leaderboard');
const leaderboardBody = document.getElementById('leaderboard-body');
const closeLeaderboardButton = document.getElementById('close-leaderboard-btn');
const helpButton = document.getElementById('help-btn');
const keyboardContainer = document.getElementById('keyboard-container');
const hintWordElement = document.getElementById('hint-word');

// DOM 元素 - 游戏模式选择
const modeSelectionContainer = document.getElementById('mode-selection');
const englishModeButton = document.getElementById('english-mode-btn');
const chineseModeButton = document.getElementById('chinese-mode-btn');
const changeModeButton = document.getElementById('change-mode-btn');

// 格式化时间为 MM:SS 格式
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 开始计时器
function startTimer() {
    // 清除之前的计时器
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // 设置开始时间
    gameState.startTime = Date.now();
    gameState.timeSpent = 0;
    
    // 更新UI - 同时更新两个计时器显示
    timerElement.textContent = formatTime(gameState.timeSpent);
    gameTimerElement.textContent = formatTime(gameState.timeSpent);
    
    // 启动计时器
    gameState.timerInterval = setInterval(() => {
        gameState.timeSpent = Math.floor((Date.now() - gameState.startTime) / 1000);
        // 同时更新两个计时器显示
        timerElement.textContent = formatTime(gameState.timeSpent);
        gameTimerElement.textContent = formatTime(gameState.timeSpent);
    }, 1000);
}

// 停止计时器
function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

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
    gameState.timeSpent = 0;
    gameState.keyboardVisible = false;
    gameState.hintWord = null;
    gameState.currentHintIndex = 0;
    gameState.userInput = '';
    
    // 停止计时器
    stopTimer();
    
    // 停止重叠检测
    stopOverlapDetection();
    
    // 更新UI
    scoreElement.textContent = gameState.score;
    timerElement.textContent = formatTime(gameState.timeSpent);
    gameTimerElement.textContent = formatTime(gameState.timeSpent);
    cardsContainer.innerHTML = '';
    messageElement.textContent = '';
    messageElement.className = 'message';
    
    // 隐藏通关界面、排行榜和键盘映射
    levelCompleteElement.classList.add('hidden');
    leaderboardElement.classList.add('hidden');
    keyboardContainer.classList.add('hidden');
    
    // 清除键盘高亮
    clearKeyHighlight();
    
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
    
    // 启动计时器
    startTimer();
    
    // 根据当前关卡生成卡片数量
    const cardsCount = config.cardsPerLevel + (config.currentLevel - 1) * 2;
    gameState.remainingCards = cardsCount;
    remainingElement.textContent = gameState.remainingCards;
    
    // 随机选择单词并创建卡片
    const shuffledWords = [...wordsList].sort(() => 0.5 - Math.random());
    const levelWords = shuffledWords.slice(0, cardsCount);
    
    // 创建卡片
    levelWords.forEach((wordData, index) => {
        // 延迟创建卡片，避免同时创建导致的位置计算问题
        setTimeout(() => {
            createCard(wordData, index);
        }, index * 100); // 每张卡片间隔100毫秒创建
    });
    
    // 所有卡片创建完成后，启动重叠检测
    setTimeout(() => {
        startOverlapDetection();
    }, cardsCount * 100 + 500); // 等待所有卡片创建完成后再启动
}

// 获取单词难度级别
function getWordDifficulty(word) {
    const length = word.length;
    
    if (length < 5) {
        return 1; // 一级难度：5个以下字母
    } else if (length >= 5 && length < 8) {
        return 2; // 二级难度：5-8个字母
    } else if (length >= 8 && length < 15) {
        return 3; // 三级难度：8-15个字母
    } else {
        return 4; // 四级难度：15个以上字母
    }
}

// 根据难度获取单词得分
function getScoreByDifficulty(difficulty) {
    switch (difficulty) {
        case 1: return 5;  // 一级难度得5分
        case 2: return 10; // 二级难度得10分
        case 3: return 15; // 三级难度得15分
        case 4: return 20; // 四级难度得20分
        default: return 10;
    }
}

// 创建卡片
function createCard(wordData, index) {
    const card = document.createElement('div');
    
    // 计算单词难度
    const difficulty = getWordDifficulty(wordData.word);
    
    // 设置卡片类名，包括难度级别
    card.className = `card difficulty-${difficulty}`;
    
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
        word: wordData.word.toLowerCase(),
        difficulty: difficulty, // 添加难度属性
        left: left,
        top: top,
        width: 150, // 卡片默认宽度
        height: 100 // 卡片默认高度
    });
    
    // 检测并调整卡片位置，避免重叠
    setTimeout(() => {
        adjustCardPosition(gameState.activeCards.length - 1);
    }, 10);
}

// 检测卡片重叠并调整位置
function adjustCardPosition(cardIndex) {
    const currentCard = gameState.activeCards[cardIndex];
    if (!currentCard) return;
    
    const cardElement = currentCard.element;
    
    // 获取卡片实际尺寸
    const rect = cardElement.getBoundingClientRect();
    currentCard.width = rect.width;
    currentCard.height = rect.height;
    
    let overlapping = false;
    let attempts = 0;
    const maxAttempts = 20; // 最大尝试次数
    
    do {
        overlapping = false;
        
        // 检查与其他卡片的重叠
        for (let i = 0; i < gameState.activeCards.length; i++) {
            if (i === cardIndex) continue; // 跳过自身
            
            const otherCard = gameState.activeCards[i];
            
            // 检测重叠
            if (isOverlapping(currentCard, otherCard)) {
                overlapping = true;
                
                // 计算新位置
                const newPosition = calculateNewPosition(currentCard, otherCard);
                
                // 应用新位置
                currentCard.left = newPosition.left;
                currentCard.top = newPosition.top;
                
                // 更新DOM元素位置
                cardElement.style.left = `${currentCard.left}px`;
                cardElement.style.top = `${currentCard.top}px`;
                
                // 添加平滑过渡效果
                cardElement.style.transition = 'left 0.5s ease, top 0.5s ease';
                
                break; // 一次只处理一个重叠
            }
        }
        
        attempts++;
    } while (overlapping && attempts < maxAttempts);
    
    // 移除过渡效果，避免影响浮动动画
    setTimeout(() => {
        cardElement.style.transition = '';
    }, 500);
}

// 检测两个卡片是否重叠
function isOverlapping(card1, card2) {
    // 扩大一点检测范围，留出间距
    const padding = 10;
    
    return !(
        card1.left + card1.width + padding < card2.left || // card1在card2左侧
        card1.left > card2.left + card2.width + padding || // card1在card2右侧
        card1.top + card1.height + padding < card2.top || // card1在card2上方
        card1.top > card2.top + card2.height + padding    // card1在card2下方
    );
}

// 计算新位置，避免重叠
function calculateNewPosition(card, otherCard) {
    // 计算当前卡片中心点
    const cardCenterX = card.left + card.width / 2;
    const cardCenterY = card.top + card.height / 2;
    
    // 计算其他卡片中心点
    const otherCenterX = otherCard.left + otherCard.width / 2;
    const otherCenterY = otherCard.top + otherCard.height / 2;
    
    // 计算两个中心点之间的向量
    const vectorX = cardCenterX - otherCenterX;
    const vectorY = cardCenterY - otherCenterY;
    
    // 向量长度
    const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
    
    // 如果长度为0（完全重叠），随机选择一个方向
    const normalizedX = length === 0 ? Math.random() - 0.5 : vectorX / length;
    const normalizedY = length === 0 ? Math.random() - 0.5 : vectorY / length;
    
    // 计算需要移动的距离
    const minDistance = (card.width + otherCard.width) / 2 + 20; // 额外间距
    const moveDistance = length === 0 ? minDistance : minDistance - length;
    
    // 如果已经足够远，不需要移动
    if (moveDistance <= 0) {
        return { left: card.left, top: card.top };
    }
    
    // 计算新位置
    let newLeft = card.left + normalizedX * moveDistance;
    let newTop = card.top + normalizedY * moveDistance;
    
    // 确保卡片不会移出容器
    const containerWidth = cardsContainer.offsetWidth;
    const containerHeight = cardsContainer.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - card.width));
    newTop = Math.max(0, Math.min(newTop, containerHeight - card.height));
    
    return { left: newLeft, top: newTop };
}

// 播放单词发音
async function playWordSound(word) {
    // 如果声音被禁用，则不播放
    if (!config.soundEnabled) return;
    
    try {
        // 创建音频元素
        const audio = new Audio(`${API_BASE_URL}/word-audio?word=${encodeURIComponent(word)}`);
        
        // 播放音频
        await audio.play();
    } catch (error) {
        console.error('播放单词发音失败:', error);
        // 如果播放失败，显示提示
        showMessage(`无法播放"${word}"的发音`, 'incorrect');
    }
}

// 切换声音开关
function toggleSound() {
    config.soundEnabled = !config.soundEnabled;
    soundButton.textContent = `发音: ${config.soundEnabled ? '开' : '关'}`;
    
    // 保存设置到本地存储
    localStorage.setItem('soundEnabled', config.soundEnabled);
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
        
        // 根据单词难度增加分数
        const difficulty = matchedCard.difficulty;
        const points = getScoreByDifficulty(difficulty);
        gameState.score += points;
        scoreElement.textContent = gameState.score;
        
        // 播放单词发音
        playWordSound(inputValue);
        
        // 显示正确消息，包含难度和得分信息
        const difficultyNames = ["", "初级", "中级", "高级", "专家"];
        if (config.gameMode === 'english') {
            showMessage(`正确！"${inputValue}" (${difficultyNames[difficulty]}难度) +${points}分`, 'correct');
        } else {
            // 在中文模式下，显示中文和英文
            const chineseText = matchedCard.element.querySelector('.word').textContent;
            showMessage(`正确！"${chineseText}" 的英文 "${inputValue}" (${difficultyNames[difficulty]}难度) +${points}分`, 'correct');
        }
        
        // 获取卡片位置和尺寸（在隐藏前）
        const cardElement = matchedCard.element;
        const rect = cardElement.getBoundingClientRect();
        
        // 创建碎片效果
        createCardShatterEffect(cardElement, rect);
        
        // 立即隐藏卡片
        cardElement.classList.add('destroyed');
        
        // 从活动卡片中移除
        gameState.activeCards.splice(matchIndex, 1);
        
        // 更新剩余卡片数
        gameState.remainingCards--;
        remainingElement.textContent = gameState.remainingCards;
        
        // 重置键盘提示状态
        gameState.currentHintIndex = 0;
        gameState.userInput = '';
        
        // 如果键盘映射区域可见，更新提示
        if (gameState.keyboardVisible && gameState.activeCards.length > 0) {
            setTimeout(updateKeyboardHint, 500);
        }
        
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
    // 停止计时器
    stopTimer();
    
    // 停止重叠检测
    stopOverlapDetection();
    
    // 显示通关界面
    levelCompleteElement.classList.remove('hidden');
    finalScoreElement.textContent = gameState.score;
    finalTimeElement.textContent = formatTime(gameState.timeSpent);
    
    // 禁用输入
    wordInput.disabled = true;
    
    // 隐藏键盘映射区域
    keyboardContainer.classList.add('hidden');
    gameState.keyboardVisible = false;
    
    // 保存分数并获取排行榜数据
    saveScore().then(() => {
        // 获取当前关卡前三名
        getLevelTopThree();
        
        // 获取用户在当前关卡的排名
        getUserRankInLevel();
    });
}

// 获取当前关卡前三名
async function getLevelTopThree() {
    if (!currentUser.id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/scores/level/${config.currentLevel}/top?limit=3`);
        
        if (!response.ok) {
            throw new Error('获取排行榜失败');
        }
        
        const scores = await response.json();
        
        // 清空前三名容器
        levelTopThreeElement.innerHTML = '';
        
        if (scores.length === 0) {
            levelTopThreeElement.innerHTML = '<div class="no-data">暂无数据</div>';
            return;
        }
        
        // 添加前三名数据
        scores.forEach((score, index) => {
            const scoreItem = document.createElement('div');
            scoreItem.className = 'top-score-item';
            
            // 格式化耗时
            const formattedTime = formatTime(score.time_spent || 0);
            
            scoreItem.innerHTML = `
                <span class="top-score-rank">${index + 1}</span>
                <span class="top-score-username">${score.username}</span>
                <span class="top-score-score">${score.score}分 (${formattedTime})</span>
            `;
            
            levelTopThreeElement.appendChild(scoreItem);
        });
        
    } catch (error) {
        console.error('获取排行榜错误:', error);
        levelTopThreeElement.innerHTML = '<div class="error">获取数据失败</div>';
    }
}

// 获取用户在当前关卡的排名
async function getUserRankInLevel() {
    if (!currentUser.id) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/scores/level/${config.currentLevel}/user/${currentUser.id}/rank`);
        
        if (!response.ok) {
            throw new Error('获取用户排名失败');
        }
        
        const rankData = await response.json();
        
        // 格式化耗时
        const formattedTime = formatTime(rankData.time_spent || 0);
        
        // 显示用户排名信息
        userRankInfoElement.innerHTML = `
            <div class="user-rank-info">
                排名: <span class="user-rank-position">${rankData.rank}</span> / 
                <span class="user-rank-total">${rankData.total}</span>
                (得分: <span class="user-rank-score">${rankData.score}</span>, 
                耗时: <span class="user-rank-time">${formattedTime}</span>)
            </div>
        `;
        
    } catch (error) {
        console.error('获取用户排名错误:', error);
        userRankInfoElement.innerHTML = '<div class="error">获取排名失败</div>';
    }
}

// 保存分数
async function saveScore() {
    if (!currentUser.id) return Promise.resolve();
    
    try {
        const response = await fetch(`${API_BASE_URL}/scores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: currentUser.id,
                score: gameState.score,
                level: config.currentLevel,
                time_spent: gameState.timeSpent
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '保存分数失败');
        }
        
        return Promise.resolve();
        
    } catch (error) {
        console.error('保存分数错误:', error);
        showMessage('保存分数失败', 'incorrect');
        return Promise.reject(error);
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
            
            // 格式化耗时
            const formattedTime = formatTime(score.time_spent || 0);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${score.username}</td>
                <td>${score.score}</td>
                <td>${formattedTime}</td>
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
    
    // 重置关卡信息
    config.currentLevel = 1;
    
    // 清空输入框
    usernameInput.value = '';
    usernameInput.focus();
}

// 显示/隐藏键盘映射
function toggleKeyboard() {
    if (!gameState.gameStarted) {
        showMessage('请先开始游戏', 'incorrect');
        return;
    }
    
    gameState.keyboardVisible = !gameState.keyboardVisible;
    
    if (gameState.keyboardVisible) {
        keyboardContainer.classList.remove('hidden');
        updateKeyboardHint();
        
        // 确保键盘映射区域可见
        setTimeout(() => {
            // 平滑滚动到键盘映射区域
            keyboardContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    } else {
        keyboardContainer.classList.add('hidden');
        // 清除高亮
        clearKeyHighlight();
    }
}

// 更新键盘提示
function updateKeyboardHint() {
    if (!gameState.gameStarted || gameState.activeCards.length === 0) {
        hintWordElement.textContent = '无可用提示';
        return;
    }
    
    // 随机选择一个活动卡片
    const randomIndex = Math.floor(Math.random() * gameState.activeCards.length);
    const randomCard = gameState.activeCards[randomIndex];
    
    // 保存提示单词
    gameState.hintWord = randomCard.word;
    gameState.currentHintIndex = 0;
    gameState.userInput = '';
    
    // 显示提示单词
    if (config.gameMode === 'english') {
        hintWordElement.textContent = randomCard.word;
    } else {
        // 在中文模式下，显示中文和英文
        const chineseText = randomCard.element.querySelector('.word').textContent;
        hintWordElement.textContent = `${chineseText} (${randomCard.word})`;
    }
    
    // 高亮键盘上的第一个字母
    highlightNextKey();
}

// 高亮下一个需要输入的字母
function highlightNextKey() {
    // 先清除所有高亮
    clearKeyHighlight();
    
    // 如果已经完成了单词的输入，不再高亮
    if (!gameState.hintWord || gameState.currentHintIndex >= gameState.hintWord.length) {
        return;
    }
    
    // 获取当前需要输入的字母
    const nextLetter = gameState.hintWord.toLowerCase()[gameState.currentHintIndex];
    
    // 高亮对应的键
    const keyElement = document.querySelector(`.key[data-key="${nextLetter}"]`);
    if (keyElement) {
        keyElement.classList.add('highlight');
    }
}

// 创建卡片碎裂效果
function createCardShatterEffect(cardElement, rect) {
    // 计算中心点
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // 创建多个碎片
    const fragmentsCount = 12; // 增加碎片数量
    
    for (let i = 0; i < fragmentsCount; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'card-fragment';
        
        // 设置碎片样式
        fragment.style.position = 'fixed';
        fragment.style.width = `${rect.width * 0.3}px`;
        fragment.style.height = `${rect.height * 0.3}px`;
        fragment.style.backgroundColor = getComputedStyle(cardElement).backgroundColor;
        fragment.style.borderRadius = '5px';
        fragment.style.left = `${centerX - rect.width * 0.15}px`;
        fragment.style.top = `${centerY - rect.height * 0.15}px`;
        fragment.style.zIndex = '5';
        
        // 随机旋转角度
        const rotation = Math.random() * 360;
        fragment.style.transform = `rotate(${rotation}deg)`;
        
        // 添加到文档
        document.body.appendChild(fragment);
        
        // 设置动画
        const angle = (i / fragmentsCount) * 2 * Math.PI;
        const distance = 100 + Math.random() * 50;
        const destinationX = centerX + Math.cos(angle) * distance;
        const destinationY = centerY + Math.sin(angle) * distance;
        
        // 使用动画
        fragment.animate([
            { 
                transform: `translate(0, 0) rotate(${rotation}deg)`,
                opacity: 0.8
            },
            { 
                transform: `translate(${destinationX - centerX}px, ${destinationY - centerY}px) rotate(${rotation + 360}deg)`,
                opacity: 0
            }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        }).onfinish = () => {
            // 动画结束后移除碎片
            document.body.removeChild(fragment);
        };
    }
}

// 清除键盘高亮
function clearKeyHighlight() {
    const highlightedKeys = document.querySelectorAll('.key.highlight, .key.error');
    highlightedKeys.forEach(key => {
        key.classList.remove('highlight');
        key.classList.remove('error');
    });
}

// 处理用户输入的字母
function handleKeyInput(key) {
    if (!gameState.hintWord || !gameState.keyboardVisible) return;
    
    const lowerKey = key.toLowerCase();
    const keyElement = document.querySelector(`.key[data-key="${lowerKey}"]`);
    
    if (!keyElement) return;
    
    // 获取当前应该输入的字母
    const expectedLetter = gameState.hintWord.toLowerCase()[gameState.currentHintIndex];
    
    // 检查输入是否正确
    if (lowerKey === expectedLetter) {
        // 正确输入
        keyElement.classList.add('pressed');
        setTimeout(() => {
            keyElement.classList.remove('pressed');
        }, 200);
        
        // 更新用户输入
        gameState.userInput += lowerKey;
        gameState.currentHintIndex++;
        
            // 检查是否完成了单词输入
            if (gameState.currentHintIndex >= gameState.hintWord.length) {
                // 单词输入完成，检查是否匹配
                if (gameState.userInput.toLowerCase() === gameState.hintWord.toLowerCase()) {
                    // 输入正确，自动提交
                    wordInput.value = gameState.hintWord;
                    
                    // 播放单词发音
                    playWordSound(gameState.hintWord);
                    
                    checkInput();
                    
                    // 重置状态
                    gameState.userInput = '';
                    gameState.currentHintIndex = 0;
                    
                    // 如果还有卡片，更新提示
                    if (gameState.activeCards.length > 0) {
                        setTimeout(updateKeyboardHint, 1000);
                    }
                }
        } else {
            // 继续高亮下一个字母
            highlightNextKey();
        }
    } else {
        // 错误输入
        keyElement.classList.add('error');
        keyElement.classList.add('pressed');
        
        setTimeout(() => {
            keyElement.classList.remove('pressed');
            keyElement.classList.remove('error');
            // 恢复当前需要输入的字母的高亮
            highlightNextKey();
        }, 500);
    }
}

// 模拟键盘按键动画
function simulateKeyPress(key) {
    if (gameState.keyboardVisible) {
        // 如果键盘可见，处理输入
        handleKeyInput(key);
    } else {
        // 否则只显示按键动画
        const keyElement = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`);
        if (keyElement) {
            keyElement.classList.add('pressed');
            setTimeout(() => {
                keyElement.classList.remove('pressed');
            }, 200);
        }
    }
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
showLeaderboardButton.addEventListener('click', showLeaderboard);
helpButton.addEventListener('click', toggleKeyboard);
soundButton.addEventListener('click', toggleSound);

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
    } else if (gameState.gameStarted) {
        // 模拟键盘按键动画
        simulateKeyPress(e.key);
    }
});

// 监听键盘输入，实时更新输入框内容时也模拟按键动画
wordInput.addEventListener('input', (e) => {
    if (gameState.gameStarted && e.data && e.data.length === 1) {
        simulateKeyPress(e.data);
    }
});

// 监听键盘按下事件，用于直接响应键盘输入
document.addEventListener('keydown', (e) => {
    if (gameState.gameStarted && gameState.keyboardVisible && e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
        // 如果是字母键，处理输入
        handleKeyInput(e.key);
    }
});

// 定期检测卡片重叠
function startOverlapDetection() {
    if (gameState.overlapDetectionInterval) {
        clearInterval(gameState.overlapDetectionInterval);
    }
    
    // 每2秒检测一次所有卡片的重叠情况
    gameState.overlapDetectionInterval = setInterval(() => {
        if (!gameState.gameStarted || gameState.activeCards.length <= 1) return;
        
        // 更新所有卡片的位置信息
        gameState.activeCards.forEach(card => {
            const rect = card.element.getBoundingClientRect();
            const containerRect = cardsContainer.getBoundingClientRect();
            
            // 转换为相对于容器的坐标
            card.left = rect.left - containerRect.left;
            card.top = rect.top - containerRect.top;
            card.width = rect.width;
            card.height = rect.height;
        });
        
        // 检测并调整每张卡片
        for (let i = 0; i < gameState.activeCards.length; i++) {
            adjustCardPosition(i);
        }
    }, 2000);
}

// 停止重叠检测
function stopOverlapDetection() {
    if (gameState.overlapDetectionInterval) {
        clearInterval(gameState.overlapDetectionInterval);
        gameState.overlapDetectionInterval = null;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 先获取单词列表
    await fetchWords();
    
    // 加载声音设置
    const savedSoundEnabled = localStorage.getItem('soundEnabled');
    if (savedSoundEnabled !== null) {
        config.soundEnabled = savedSoundEnabled === 'true';
        soundButton.textContent = `发音: ${config.soundEnabled ? '开' : '关'}`;
    }
    
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
