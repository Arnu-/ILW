/**
 * 单词记忆游戏 - 学习功能相关脚本
 */

// 学习相关全局变量
let learningWords = [];
let currentLearningIndex = 0;
let learningStage = 0;
let learningGroupId = null;
let learningStartTime = 0;
let learningWordResults = []; // 修改变量名，避免与script.js中的变量冲突
let learningTimerInterval = null;

/**
 * 初始化学习模块
 */
function initLearningModule() {
    // 绑定学习相关事件
    bindLearningEvents();
}

/**
 * 绑定学习相关事件
 */
function bindLearningEvents() {
    // 认知阶段按钮
    document.getElementById('known-btn').addEventListener('click', function() {
        markWordAsKnown();
    });
    
    document.getElementById('unknown-btn').addEventListener('click', function() {
        markWordAsUnknown();
    });
    
    // 英文抄写阶段按钮
    document.getElementById('typing-submit-btn').addEventListener('click', function() {
        checkTypingAnswer();
    });
    
    document.getElementById('typing-skip-btn').addEventListener('click', function() {
        skipTypingAnswer();
    });
    
    // 中文默写阶段按钮
    document.getElementById('recall-submit-btn').addEventListener('click', function() {
        checkRecallAnswer();
    });
    
    document.getElementById('recall-skip-btn').addEventListener('click', function() {
        skipRecallAnswer();
    });
    
    // 发音按钮
    document.getElementById('play-audio-btn').addEventListener('click', function() {
        playCurrentWordAudio();
    });
    
    document.getElementById('typing-play-audio-btn').addEventListener('click', function() {
        playCurrentWordAudio();
    });
    
    // 输入框回车提交
    document.getElementById('typing-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkTypingAnswer();
        }
    });
    
    document.getElementById('recall-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkRecallAnswer();
        }
    });
}

/**
 * 开始学习
 * @param {number} groupId 单词组ID
 * @param {number} stage 学习阶段
 */
function startLearningSession(groupId, stage) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    learningStage = stage;
    learningGroupId = groupId;
    
    // 获取学习单词
    fetch(`/api/learning/words/${currentUser.id}/${groupId}/${stage}`)
    .then(response => response.json())
    .then(data => {
        learningWords = data.words;
        currentLearningIndex = 0;
        learningWordResults = []; // 修改变量名，避免与script.js中的变量冲突
        
        // 设置学习模式
        setLearningMode(stage);
        
        // 显示第一个单词
        showLearningWord();
        
        // 开始计时
        startLearningTimer();
        
        // 显示学习界面
        showSection('learning-section');
    })
    .catch(error => {
        console.error('加载学习单词错误:', error);
        alert('加载学习单词失败，请重试');
    });
}

/**
 * 设置学习模式
 * @param {number} stage 学习阶段
 */
function setLearningMode(stage) {
    // 隐藏所有学习模式
    document.querySelectorAll('.learning-mode').forEach(mode => {
        mode.classList.add('hidden');
    });
    
    // 显示对应学习模式
    if (stage === 1) {
        document.getElementById('recognition-mode').classList.remove('hidden');
        document.getElementById('learning-title').textContent = '认知阶段';
    } else if (stage === 2) {
        document.getElementById('typing-mode').classList.remove('hidden');
        document.getElementById('learning-title').textContent = '英文抄写阶段';
    } else if (stage === 3) {
        document.getElementById('recall-mode').classList.remove('hidden');
        document.getElementById('learning-title').textContent = '中文默写阶段';
    }
}

/**
 * 显示当前学习单词
 */
function showLearningWord() {
    if (currentLearningIndex >= learningWords.length) {
        // 学习完成
        finishLearningSession();
        return;
    }
    
    const word = learningWords[currentLearningIndex];
    
    // 更新进度
    document.getElementById('current-word-index').textContent = currentLearningIndex + 1;
    document.getElementById('total-words').textContent = learningWords.length;
    
    // 根据学习阶段显示单词
    if (learningStage === 1) {
        // 认知阶段
        document.getElementById('recognition-word').textContent = word.word;
        document.getElementById('recognition-translation').textContent = word.translation;
    } else if (learningStage === 2) {
        // 英文抄写阶段
        document.getElementById('typing-word').textContent = word.word;
        document.getElementById('typing-input').value = '';
        document.getElementById('typing-input').focus();
    } else if (learningStage === 3) {
        // 中文默写阶段
        document.getElementById('recall-translation').textContent = word.translation;
        document.getElementById('recall-input').value = '';
        document.getElementById('recall-input').focus();
    }
}

/**
 * 标记单词为已记住
 */
function markWordAsKnown() {
    const word = learningWords[currentLearningIndex];
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: true
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 标记单词为未记住
 */
function markWordAsUnknown() {
    const word = learningWords[currentLearningIndex];
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: false
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 检查英文抄写答案
 */
function checkTypingAnswer() {
    const word = learningWords[currentLearningIndex];
    const input = document.getElementById('typing-input').value.trim();
    
    // 检查答案
    const correct = input.toLowerCase() === word.word.toLowerCase();
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: correct
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 跳过英文抄写答案
 */
function skipTypingAnswer() {
    const word = learningWords[currentLearningIndex];
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: false
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 检查中文默写答案
 */
function checkRecallAnswer() {
    const word = learningWords[currentLearningIndex];
    const input = document.getElementById('recall-input').value.trim();
    
    // 检查答案
    const correct = input.toLowerCase() === word.word.toLowerCase();
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: correct
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 跳过中文默写答案
 */
function skipRecallAnswer() {
    const word = learningWords[currentLearningIndex];
    
    // 记录结果
    learningWordResults.push({
        word_id: word.id,
        correct: false
    });
    
    // 下一个单词
    currentLearningIndex++;
    showLearningWord();
}

/**
 * 播放当前单词发音
 */
function playCurrentWordAudio() {
    const word = learningWords[currentLearningIndex];
    playWordAudio(word.word);
}

/**
 * 播放单词发音
 * @param {string} word 单词
 */
function playWordAudio(word) {
    fetch(`/api/words/audio?word=${encodeURIComponent(word)}`)
    .then(response => response.json())
    .then(data => {
        if (data.audio_url) {
            const audio = new Audio(data.audio_url);
            audio.play();
        } else {
            console.error('获取单词发音失败:', data.error);
        }
    })
    .catch(error => {
        console.error('获取单词发音错误:', error);
    });
}

/**
 * 开始学习计时
 */
function startLearningTimer() {
    learningStartTime = Date.now();
    
    if (learningTimerInterval) {
        clearInterval(learningTimerInterval);
    }
    
    learningTimerInterval = setInterval(updateLearningTimer, 1000);
    updateLearningTimer();
}

/**
 * 更新学习计时器
 */
function updateLearningTimer() {
    const elapsed = Math.floor((Date.now() - learningStartTime) / 1000);
    document.getElementById('timer').textContent = formatTime(elapsed);
}

/**
 * 停止学习计时
 */
function stopLearningTimer() {
    if (learningTimerInterval) {
        clearInterval(learningTimerInterval);
        learningTimerInterval = null;
    }
}

/**
 * 完成学习会话
 */
function finishLearningSession() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // 停止计时
    stopLearningTimer();
    
    // 计算用时
    const timeSpent = Math.floor((Date.now() - learningStartTime) / 1000);
    
    // 提交学习结果
    fetch('/api/learning/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            group_id: learningGroupId,
            stage: learningStage,
            results: learningWordResults,
            time_spent: timeSpent
        })
    })
    .then(response => response.json())
    .then(data => {
        // 显示结果
        displayLearningResults(data, timeSpent);
        
        // 检查是否获得徽章
        if (data.badge) {
            showBadgePopup(data.badge);
        }
    })
    .catch(error => {
        console.error('提交学习结果错误:', error);
        alert('提交学习结果失败，请重试');
    });
}

/**
 * 显示学习结果
 * @param {Object} data 结果数据
 * @param {number} timeSpent 用时(秒)
 */
function displayLearningResults(data, timeSpent) {
    // 显示正确率
    document.getElementById('result-accuracy').textContent = `${Math.round(data.accuracy)}%`;
    
    // 显示用时
    document.getElementById('result-time').textContent = formatTime(timeSpent);
    
    // 显示状态
    const resultStatus = document.getElementById('result-status');
    if (data.completed) {
        resultStatus.textContent = '通过';
        resultStatus.className = 'result-value passed';
    } else {
        resultStatus.textContent = '未通过';
        resultStatus.className = 'result-value failed';
    }
    
    // 显示单词详情
    const wordsList = document.getElementById('result-words-list');
    wordsList.innerHTML = '';
    
    for (let i = 0; i < learningWords.length; i++) {
        const word = learningWords[i];
        const result = learningWordResults[i];
        
        const item = document.createElement('div');
        item.className = 'result-word-item';
        
        item.innerHTML = `
            <div class="result-word-text">
                <div class="result-word-english">${word.word}</div>
                <div class="result-word-translation">${word.translation}</div>
            </div>
            <div class="result-word-status ${result.correct ? 'correct' : 'incorrect'}">
                ${result.correct ? '正确' : '错误'}
            </div>
        `;
        
        wordsList.appendChild(item);
    }
    
    // 显示操作按钮
    document.getElementById('retry-btn').classList.remove('hidden');
    
    const nextStageBtn = document.getElementById('next-stage-btn');
    const nextGroupBtn = document.getElementById('next-group-btn');
    
    nextStageBtn.classList.add('hidden');
    nextGroupBtn.classList.add('hidden');
    
    if (data.completed) {
        if (learningStage < 3) {
            // 显示进入下一阶段按钮
            nextStageBtn.classList.remove('hidden');
        } else {
            // 显示进入下一组按钮
            nextGroupBtn.classList.remove('hidden');
        }
    }
    
    showSection('result-section');
}

/**
 * 显示徽章弹窗
 * @param {Object} badge 徽章信息
 */
function showBadgePopup(badge) {
    const badgePopup = document.getElementById('badge-popup');
    const badgeTitle = document.getElementById('badge-title');
    const badgeImage = document.getElementById('badge-image');
    const badgeDescription = document.getElementById('badge-description');
    
    badgeTitle.textContent = badge.title;
    badgeImage.src = badge.image;
    badgeDescription.textContent = badge.description;
    
    badgePopup.classList.remove('hidden');
}

/**
 * 格式化时间
 * @param {number} seconds 秒数
 * @returns {string} 格式化后的时间
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initLearningModule();
});