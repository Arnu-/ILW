/**
 * 单词记忆游戏 - 最终挑战相关脚本
 */

// 挑战相关全局变量
let challengeWords = [];
let currentChallengeIndex = 0;
let challengeResults = [];
let challengeStartTime = 0;
let challengeTimerInterval = null;

/**
 * 初始化挑战模块
 */
function initChallengeModule() {
    // 绑定挑战相关事件
    bindChallengeEvents();
}

/**
 * 绑定挑战相关事件
 */
function bindChallengeEvents() {
    // 开始挑战按钮
    const startChallengeBtn = document.getElementById('start-challenge-btn');
    if (startChallengeBtn) {
        startChallengeBtn.addEventListener('click', function() {
            startFinalChallenge();
        });
    }
    
    // 提交答案按钮
    const challengeSubmitBtn = document.getElementById('challenge-submit-btn');
    if (challengeSubmitBtn) {
        challengeSubmitBtn.addEventListener('click', function() {
            checkChallengeAnswer();
        });
    }
    
    // 跳过按钮
    const challengeSkipBtn = document.getElementById('challenge-skip-btn');
    if (challengeSkipBtn) {
        challengeSkipBtn.addEventListener('click', function() {
            skipChallengeAnswer();
        });
    }
    
    // 输入框回车提交
    const challengeInput = document.getElementById('challenge-input');
    if (challengeInput) {
        challengeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkChallengeAnswer();
            }
        });
    }
    
    // 徽章关闭按钮
    const badgeCloseBtn = document.getElementById('badge-close-btn');
    if (badgeCloseBtn) {
        badgeCloseBtn.addEventListener('click', function() {
            const badgePopup = document.getElementById('badge-popup');
            if (badgePopup) {
                badgePopup.classList.add('hidden');
            }
        });
    }
}

/**
 * 检查最终挑战状态
 */
function checkFinalChallengeStatus() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/final-challenge-status`)
    .then(response => response.json())
    .then(data => {
        const challengeBtn = document.getElementById('nav-challenge');
        
        if (data.unlocked) {
            challengeBtn.classList.remove('disabled');
            challengeBtn.title = '最终挑战已解锁';
        } else {
            challengeBtn.classList.add('disabled');
            challengeBtn.title = '完成所有单词组后解锁最终挑战';
        }
    })
    .catch(error => {
        console.error('检查最终挑战状态错误:', error);
    });
}

/**
 * 显示最终挑战界面
 */
function showFinalChallenge() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/final-challenge-status`)
    .then(response => response.json())
    .then(data => {
        if (data.unlocked) {
            // 获取挑战单词数量
            fetch(`/api/users/${currentUser.id}/final-challenge-words`)
            .then(response => response.json())
            .then(wordsData => {
                document.getElementById('challenge-total-words').textContent = wordsData.total_words || 0;
                showSection('final-challenge-section');
            });
        } else {
            alert('完成所有单词组后解锁最终挑战');
            showSection('group-selection');
        }
    })
    .catch(error => {
        console.error('检查最终挑战状态错误:', error);
        alert('检查最终挑战状态失败，请重试');
    });
}

/**
 * 开始最终挑战
 */
function startFinalChallenge() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/final-challenge-words`)
    .then(response => response.json())
    .then(data => {
        challengeWords = data.words;
        currentChallengeIndex = 0;
        challengeResults = [];
        
        // 显示第一个单词
        showChallengeWord();
        
        // 开始计时
        startChallengeTimer();
        
        showSection('challenge-learning-section');
    })
    .catch(error => {
        console.error('加载最终挑战单词错误:', error);
        alert('加载最终挑战单词失败，请重试');
    });
}

/**
 * 显示当前挑战单词
 */
function showChallengeWord() {
    if (currentChallengeIndex >= challengeWords.length) {
        // 挑战完成
        finishChallenge();
        return;
    }
    
    const word = challengeWords[currentChallengeIndex];
    
    // 更新进度
    document.getElementById('challenge-current-index').textContent = currentChallengeIndex + 1;
    document.getElementById('challenge-total').textContent = challengeWords.length;
    
    // 显示单词
    document.getElementById('challenge-translation').textContent = word.translation;
    document.getElementById('challenge-input').value = '';
    document.getElementById('challenge-input').focus();
}

/**
 * 检查挑战答案
 */
function checkChallengeAnswer() {
    const word = challengeWords[currentChallengeIndex];
    const input = document.getElementById('challenge-input').value.trim();
    
    // 检查答案
    const correct = input.toLowerCase() === word.word.toLowerCase();
    
    // 记录结果
    challengeResults.push({
        word_id: word.id,
        correct: correct
    });
    
    // 下一个单词
    currentChallengeIndex++;
    showChallengeWord();
}

/**
 * 跳过挑战答案
 */
function skipChallengeAnswer() {
    const word = challengeWords[currentChallengeIndex];
    
    // 记录结果
    challengeResults.push({
        word_id: word.id,
        correct: false
    });
    
    // 下一个单词
    currentChallengeIndex++;
    showChallengeWord();
}

/**
 * 开始挑战计时
 */
function startChallengeTimer() {
    challengeStartTime = Date.now();
    
    if (challengeTimerInterval) {
        clearInterval(challengeTimerInterval);
    }
    
    challengeTimerInterval = setInterval(updateChallengeTimer, 1000);
    updateChallengeTimer();
}

/**
 * 更新挑战计时器
 */
function updateChallengeTimer() {
    const elapsed = Math.floor((Date.now() - challengeStartTime) / 1000);
    document.getElementById('challenge-timer').textContent = formatTime(elapsed);
}

/**
 * 停止挑战计时
 */
function stopChallengeTimer() {
    if (challengeTimerInterval) {
        clearInterval(challengeTimerInterval);
        challengeTimerInterval = null;
    }
}

/**
 * 完成挑战
 */
function finishChallenge() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // 停止计时
    stopChallengeTimer();
    
    // 计算用时
    const timeSpent = Math.floor((Date.now() - challengeStartTime) / 1000);
    
    // 提交挑战结果
    fetch('/api/learning/submit-challenge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            results: challengeResults,
            time_spent: timeSpent
        })
    })
    .then(response => response.json())
    .then(data => {
        // 显示结果
        displayChallengeResults(data, timeSpent);
        
        // 检查是否获得徽章
        if (data.badge) {
            showBadgePopup(data.badge);
        }
    })
    .catch(error => {
        console.error('提交挑战结果错误:', error);
        alert('提交挑战结果失败，请重试');
    });
}

/**
 * 显示挑战结果
 * @param {Object} data 结果数据
 * @param {number} timeSpent 用时(秒)
 */
function displayChallengeResults(data, timeSpent) {
    // 显示正确率
    document.getElementById('challenge-result-accuracy').textContent = `${Math.round(data.accuracy)}%`;
    
    // 显示用时
    document.getElementById('challenge-result-time').textContent = formatTime(timeSpent);
    
    // 显示状态
    const resultStatus = document.getElementById('challenge-result-status');
    if (data.completed) {
        resultStatus.textContent = '通过';
        resultStatus.className = 'result-value passed';
    } else {
        resultStatus.textContent = '未通过';
        resultStatus.className = 'result-value failed';
    }
    
    // 显示单词详情
    const wordsList = document.getElementById('challenge-result-words-list');
    wordsList.innerHTML = '';
    
    for (let i = 0; i < challengeWords.length; i++) {
        const word = challengeWords[i];
        const result = challengeResults[i];
        
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
    
    showSection('challenge-result-section');
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
    initChallengeModule();
});