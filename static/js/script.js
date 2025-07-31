/**
 * 单词记忆游戏 - 用户端主脚本
 */

// 全局变量
let currentUser = null;
let currentGroup = null;
let currentStage = null;
let currentWords = [];
let currentWordIndex = 0;
let learningResults = [];
let startTime = 0;
let timerInterval = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化事件监听
    initEventListeners();
    
    // 检查登录状态
    checkLoginStatus();
});

/**
 * 初始化事件监听
 */
function initEventListeners() {
    // 登录按钮
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    
    // 登出按钮
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // 返回按钮
    document.getElementById('back-to-groups').addEventListener('click', function() {
        showSection('group-selection');
    });
    
    document.getElementById('back-to-stages').addEventListener('click', function() {
        showSection('stage-selection');
    });
    
    // 导航按钮
    document.getElementById('nav-groups').addEventListener('click', function() {
        showSection('group-selection');
    });
    
    document.getElementById('nav-challenge').addEventListener('click', function() {
        showFinalChallenge();
    });
    
    document.getElementById('nav-leaderboard').addEventListener('click', function() {
        showLeaderboard();
    });
    
    // 开始学习按钮
    document.querySelectorAll('.start-stage-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stage = parseInt(this.dataset.stage);
            startLearning(currentGroup.id, stage);
        });
    });
    
    // 认知阶段按钮
    document.getElementById('known-btn').addEventListener('click', function() {
        handleRecognitionResult(true);
    });
    
    document.getElementById('unknown-btn').addEventListener('click', function() {
        handleRecognitionResult(false);
    });
    
    // 英文抄写阶段按钮
    document.getElementById('typing-submit-btn').addEventListener('click', function() {
        handleTypingResult();
    });
    
    document.getElementById('typing-skip-btn').addEventListener('click', function() {
        handleTypingResult(true);
    });
    
    // 中文默写阶段按钮
    document.getElementById('recall-submit-btn').addEventListener('click', function() {
        handleRecallResult();
    });
    
    document.getElementById('recall-skip-btn').addEventListener('click', function() {
        handleRecallResult(true);
    });
    
    // 发音按钮
    document.getElementById('play-audio-btn').addEventListener('click', function() {
        playWordAudio(currentWords[currentWordIndex].word);
    });
    
    document.getElementById('typing-play-audio-btn').addEventListener('click', function() {
        playWordAudio(currentWords[currentWordIndex].word);
    });
    
    // 结果界面按钮
    document.getElementById('retry-btn').addEventListener('click', function() {
        startLearning(currentGroup.id, currentStage);
    });
    
    document.getElementById('next-stage-btn').addEventListener('click', function() {
        startLearning(currentGroup.id, currentStage + 1);
    });
    
    document.getElementById('next-group-btn').addEventListener('click', function() {
        loadGroups();
        showSection('group-selection');
    });
    
    // 最终挑战按钮
    document.getElementById('start-challenge-btn').addEventListener('click', function() {
        startFinalChallenge();
    });
    
    // 徽章关闭按钮
    document.getElementById('badge-close-btn').addEventListener('click', function() {
        document.getElementById('badge-popup').classList.add('hidden');
    });
    
    // 排行榜筛选
    document.getElementById('leaderboard-level').addEventListener('change', function() {
        loadLeaderboard(this.value);
    });
    
    // 输入框回车提交
    document.getElementById('typing-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleTypingResult();
        }
    });
    
    document.getElementById('recall-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleRecallResult();
        }
    });
    
    // 初始化虚拟键盘
    initVirtualKeyboard('typing-keyboard', 'typing-input');
    initVirtualKeyboard('recall-keyboard', 'recall-input');
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const savedUser = localStorage.getItem('wordGameUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('current-user').textContent = currentUser.username;
        showMainScreen();
        loadGroups();
    } else {
        showLoginScreen();
    }
}

/**
 * 处理登录
 */
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    // 检查是否为管理员登录
    if (username.toLowerCase() === 'admin') {
        // 弹出密码输入框
        const password = prompt('请输入管理员密码：');
        if (!password) {
            return; // 用户取消了密码输入
        }
        
        // 调用管理员登录API
        adminLogin(username, password)
        .then(result => {
            if (result.success) {
                // 管理员登录成功，跳转到管理页面
                window.location.href = '/admin';
            } else {
                alert('管理员密码错误，请重试');
            }
        })
        .catch(error => {
            console.error('管理员登录错误:', error);
            alert('管理员登录出错，请重试');
        });
    } else {
        // 普通用户登录
        login(username)
        .then(result => {
            currentUser = result.user;
            localStorage.setItem('wordGameUser', JSON.stringify(currentUser));
            document.getElementById('current-user').textContent = currentUser.username;
            showMainScreen();
            loadGroups();
        })
        .catch(error => {
            console.error('登录错误:', error);
            alert('登录出错，请重试');
        });
    }
}

/**
 * 处理登出
 */
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('wordGameUser');
    document.getElementById('username').value = '';
    showLoginScreen();
}

/**
 * 显示登录界面
 */
function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('hidden');
}

/**
 * 显示主界面
 */
function showMainScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
}

/**
 * 显示指定部分
 * @param {string} sectionId 部分ID
 */
function showSection(sectionId) {
    // 隐藏所有部分
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // 显示指定部分
    document.getElementById(sectionId).classList.remove('hidden');
    
    // 更新导航状态
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.classList.remove('active');
    });
    
    if (sectionId === 'group-selection') {
        document.getElementById('nav-groups').classList.add('active');
    } else if (sectionId === 'final-challenge-section') {
        document.getElementById('nav-challenge').classList.add('active');
    } else if (sectionId === 'leaderboard-section') {
        document.getElementById('nav-leaderboard').classList.add('active');
    }
}

/**
 * 加载单词组
 */
function loadGroups() {
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/progress`)
    .then(response => response.json())
    .then(data => {
        displayGroups(data.groups);
    })
    .catch(error => {
        console.error('加载单词组错误:', error);
        alert('加载单词组失败，请重试');
    });
    
    // 检查最终挑战状态
    checkFinalChallengeStatus();
}

/**
 * 显示单词组
 * @param {Array} groups 单词组数据
 */
function displayGroups(groups) {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';
    
    groups.forEach(group => {
        const card = document.createElement('div');
        card.className = `group-card ${group.unlocked ? '' : 'locked'}`;
        card.dataset.id = group.id;
        
        // 计算进度
        let completedStages = 0;
        for (const stageId in group.stages) {
            if (group.stages[stageId].completed) {
                completedStages++;
            }
        }
        const progress = Math.round((completedStages / 3) * 100);
        
        card.innerHTML = `
            <div class="group-name">${group.name}</div>
            <div class="group-description">${group.description || ''}</div>
            <div class="group-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}% 完成</div>
            </div>
        `;
        
        // 添加点击事件
        if (group.unlocked) {
            card.addEventListener('click', function() {
                selectGroup(group);
            });
        }
        
        container.appendChild(card);
    });
}

/**
 * 选择单词组
 * @param {Object} group 单词组
 */
function selectGroup(group) {
    currentGroup = group;
    document.getElementById('current-group-name').textContent = group.name;
    
    // 更新阶段状态
    for (let stage = 1; stage <= 3; stage++) {
        const stageStatus = document.getElementById(`stage-${stage}-status`);
        const stageBtn = document.querySelector(`.start-stage-btn[data-stage="${stage}"]`);
        
        if (group.stages[stage]) {
            if (group.stages[stage].completed) {
                stageStatus.textContent = '已完成';
                stageStatus.className = 'status-value completed';
                stageBtn.disabled = false;
            } else if (group.stages[stage].last_practice) {
                // 只有当有上次练习记录时才显示为"进行中"
                stageStatus.textContent = '进行中';
                stageStatus.className = 'status-value in-progress';
                stageBtn.disabled = false;
            } else {
                // 没有练习记录但存在阶段记录，显示为"未开始"
                stageStatus.textContent = '未开始';
                stageStatus.className = 'status-value';
                stageBtn.disabled = false;
            }
        } else {
            // 第一阶段总是可用的
            if (stage === 1) {
                stageStatus.textContent = '未开始';
                stageStatus.className = 'status-value';
                stageBtn.disabled = false;
            } else {
                // 检查前一阶段是否完成
                const prevStage = group.stages[stage - 1];
                if (prevStage && prevStage.completed) {
                    stageStatus.textContent = '未开始';
                    stageStatus.className = 'status-value';
                    stageBtn.disabled = false;
                } else {
                    stageStatus.textContent = '未解锁';
                    stageStatus.className = 'status-value locked';
                    stageBtn.disabled = true;
                }
            }
        }
    }
    
    showSection('stage-selection');
}

/**
 * 开始学习
 * @param {number} groupId 单词组ID
 * @param {number} stage 学习阶段
 */
function startLearning(groupId, stage) {
    if (!currentUser) return;
    
    currentStage = stage;
    
    // 获取学习单词
    fetch(`/api/learning/words/${currentUser.id}/${groupId}/${stage}`)
    .then(response => response.json())
    .then(data => {
        currentWords = data.words;
        currentWordIndex = 0;
        learningResults = [];
        
        // 设置学习模式
        setLearningMode(stage);
        
        // 显示第一个单词
        showCurrentWord();
        
        // 开始计时
        startTimer();
        
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
 * 显示当前单词
 */
function showCurrentWord() {
    if (currentWordIndex >= currentWords.length) {
        // 学习完成
        finishLearning();
        return;
    }
    
    const word = currentWords[currentWordIndex];
    
    // 更新进度
    document.getElementById('current-word-index').textContent = currentWordIndex + 1;
    document.getElementById('total-words').textContent = currentWords.length;
    
    // 根据学习阶段显示单词
    if (currentStage === 1) {
        // 认知阶段
        document.getElementById('recognition-word').textContent = word.word;
        document.getElementById('recognition-translation').textContent = word.translation;
    } else if (currentStage === 2) {
        // 英文抄写阶段
        document.getElementById('typing-word').textContent = word.word;
        document.getElementById('typing-input').value = '';
        document.getElementById('typing-input').focus();
    } else if (currentStage === 3) {
        // 中文默写阶段
        document.getElementById('recall-translation').textContent = word.translation;
        document.getElementById('recall-input').value = '';
        document.getElementById('recall-input').focus();
    }
}

/**
 * 处理认知阶段结果
 * @param {boolean} known 是否已记住
 */
function handleRecognitionResult(known) {
    const word = currentWords[currentWordIndex];
    
    // 记录结果
    learningResults.push({
        word_id: word.id,
        correct: known
    });
    
    // 下一个单词
    currentWordIndex++;
    showCurrentWord();
}

/**
 * 处理英文抄写阶段结果
 * @param {boolean} skip 是否跳过
 */
function handleTypingResult(skip = false) {
    const word = currentWords[currentWordIndex];
    let correct = false;
    
    if (!skip) {
        const input = document.getElementById('typing-input').value.trim();
        correct = input.toLowerCase() === word.word.toLowerCase();
    }
    
    // 记录结果
    learningResults.push({
        word_id: word.id,
        correct: correct
    });
    
    // 下一个单词
    currentWordIndex++;
    showCurrentWord();
}

/**
 * 处理中文默写阶段结果
 * @param {boolean} skip 是否跳过
 */
function handleRecallResult(skip = false) {
    const word = currentWords[currentWordIndex];
    let correct = false;
    
    if (!skip) {
        const input = document.getElementById('recall-input').value.trim();
        correct = input.toLowerCase() === word.word.toLowerCase();
    }
    
    // 记录结果
    learningResults.push({
        word_id: word.id,
        correct: correct
    });
    
    // 下一个单词
    currentWordIndex++;
    showCurrentWord();
}

/**
 * 完成学习
 */
function finishLearning() {
    // 停止计时
    stopTimer();
    
    // 计算用时
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    // 提交学习结果
    fetch('/api/learning/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            user_id: currentUser.id,
            group_id: currentGroup.id,
            stage: currentStage,
            results: learningResults,
            time_spent: timeSpent
        })
    })
    .then(response => response.json())
    .then(data => {
        // 显示结果
        displayLearningResult(data, timeSpent);
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
function displayLearningResult(data, timeSpent) {
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
    
    for (let i = 0; i < currentWords.length; i++) {
        const word = currentWords[i];
        const result = learningResults[i];
        
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
        if (currentStage < 3) {
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
 * 开始计时
 */
function startTimer() {
    startTime = Date.now();
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
}

/**
 * 更新计时器
 */
function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').textContent = formatTime(elapsed);
}

/**
 * 停止计时
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
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

/**
 * 播放单词发音
 * @param {string} word 单词
 */
function playWordAudio(word) {
    fetch(`/api/words/audio?word=${encodeURIComponent(word)}`)
    .then(response => response.json())
    .then(data => {
        const audio = new Audio(data.audio_url);
        audio.play();
    })
    .catch(error => {
        console.error('获取单词发音错误:', error);
    });
}

/**
 * 初始化虚拟键盘
 * @param {string} keyboardId 键盘容器ID
 * @param {string} inputId 输入框ID
 */
function initVirtualKeyboard(keyboardId, inputId) {
    const keyboard = document.getElementById(keyboardId);
    const input = document.getElementById(inputId);
    
    // 键盘布局
    const layout = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm']
    ];
    
    // 创建键盘
    keyboard.innerHTML = '';
    
    layout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(key => {
            const keyDiv = document.createElement('div');
            keyDiv.className = 'key';
            keyDiv.textContent = key;
            
            keyDiv.addEventListener('click', function() {
                input.value += key;
                input.focus();
            });
            
            rowDiv.appendChild(keyDiv);
        });
        
        keyboard.appendChild(rowDiv);
    });
    
    // 添加空格键
    const spaceRow = document.createElement('div');
    spaceRow.className = 'keyboard-row';
    
    const spaceKey = document.createElement('div');
    spaceKey.className = 'key special';
    spaceKey.textContent = 'Space';
    
    spaceKey.addEventListener('click', function() {
        input.value += ' ';
        input.focus();
    });
    
    spaceRow.appendChild(spaceKey);
    
    // 添加退格键
    const backspaceKey = document.createElement('div');
    backspaceKey.className = 'key special';
    backspaceKey.textContent = '←';
    
    backspaceKey.addEventListener('click', function() {
        input.value = input.value.slice(0, -1);
        input.focus();
    });
    
    spaceRow.appendChild(backspaceKey);
    
    keyboard.appendChild(spaceRow);
}

/**
 * 检查最终挑战状态
 */
function checkFinalChallengeStatus() {
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
 * 显示最终挑战
 */
function showFinalChallenge() {
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/final-challenge-status`)
    .then(response => response.json())
    .then(data => {
        if (data.unlocked) {
            // 获取挑战单词数量
            fetch(`/api/users/${currentUser.id}/final-challenge-words`)
            .then(response => response.json())
            .then(wordsData => {
                document.getElementById('challenge-total-words').textContent = wordsData.words.length;
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
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/final-challenge-words`)
    .then(response => response.json())
    .then(data => {
        currentWords = data.words;
        currentWordIndex = 0;
        learningResults = [];
        currentStage = 3;  // 使用中文默写模式
        currentGroup = { id: 'final-challenge', name: '最终挑战' };
        
        // 设置学习模式
        setLearningMode(currentStage);
        
        // 显示第一个单词
        showCurrentWord();
        
        // 开始计时
        startTimer();
        
        showSection('learning-section');
    })
    .catch(error => {
        console.error('加载最终挑战单词错误:', error);
        alert('加载最终挑战单词失败，请重试');
    });
}

/**
 * 显示排行榜
 */
function showLeaderboard() {
    // 加载关卡选项
    loadLeaderboardLevels();
    
    // 加载排行榜数据
    loadLeaderboard();
    
    showSection('leaderboard-section');
}

/**
 * 加载排行榜关卡选项
 */
function loadLeaderboardLevels() {
    if (!currentUser) return;
    
    fetch(`/api/users/${currentUser.id}/progress`)
    .then(response => response.json())
    .then(data => {
        const levelSelect = document.getElementById('leaderboard-level');
        
        // 清空选项
        while (levelSelect.options.length > 1) {
            levelSelect.remove(1);
        }
        
        // 添加单词组选项
        data.groups.forEach(group => {
            for (let stage = 1; stage <= 3; stage++) {
                const option = document.createElement('option');
                option.value = `group_${group.id}_stage_${stage}`;
                option.textContent = `${group.name} - ${getStageName(stage)}`;
                levelSelect.appendChild(option);
            }
        });
        
        // 添加最终挑战选项
        const finalOption = document.createElement('option');
        finalOption.value = 'final-challenge';
        finalOption.textContent = '最终挑战';
        levelSelect.appendChild(finalOption);
    })
    .catch(error => {
        console.error('加载排行榜关卡选项错误:', error);
    });
}

/**
 * 加载排行榜数据
 * @param {string} level 关卡标识
 */
function loadLeaderboard(level = '') {
    if (!currentUser) return;
    
    fetch(`/api/learning/leaderboard?level=${encodeURIComponent(level)}`)
    .then(response => response.json())
    .then(data => {
        displayLeaderboard(data.scores);
        
        // 获取用户排名
        fetch(`/api/learning/rank/${currentUser.id}?level=${encodeURIComponent(level)}`)
        .then(response => response.json())
        .then(rankData => {
            document.getElementById('user-rank').textContent = rankData.rank || '-';
        })
        .catch(() => {
            document.getElementById('user-rank').textContent = '-';
        });
    })
    .catch(error => {
        console.error('加载排行榜数据错误:', error);
        alert('加载排行榜数据失败，请重试');
    });
}

/**
 * 显示排行榜
 * @param {Array} scores 分数数据
 */
function displayLeaderboard(scores) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (scores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">暂无数据</td>';
        tbody.appendChild(row);
        return;
    }
    
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        // 高亮当前用户
        if (currentUser && score.user_id === currentUser.id) {
            row.className = 'current-user';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.username}</td>
            <td>${Math.round(score.score)}%</td>
            <td>${formatTime(score.time_spent)}</td>
            <td>${new Date(score.created_at).toLocaleString()}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 获取学习阶段名称
 * @param {number} stage 学习阶段
 * @returns {string} 阶段名称
 */
function getStageName(stage) {
    const stageNames = {
        1: '认知阶段',
        2: '英文抄写阶段',
        3: '中文默写阶段'
    };
    
    return stageNames[stage] || `阶段${stage}`;
}

/**
 * 获取难度名称
 * @param {number} difficulty 难度级别
 * @returns {string} 难度名称
 */
function getDifficultyName(difficulty) {
    const difficultyNames = {
        1: '简单',
        2: '中等',
        3: '困难',
        4: '专家'
    };
    
    return difficultyNames[difficulty] || `难度${difficulty}`;
}

/**
 * 登录API
 * @param {string} username 用户名
 * @returns {Promise} Promise对象
 */
function login(username) {
    return fetch('/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
    })
    .then(response => response.json());
}

/**
 * 检查是否为管理员
 * @param {number} userId 用户ID
 * @param {string} password 管理员密码
 * @returns {Promise<boolean>} 是否为管理员
 */
function checkIsAdmin(userId, password) {
    return fetch(`/api/admin/check/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => data.is_admin);
}

/**
 * 管理员登录API
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} Promise对象
 */
function adminLogin(username, password) {
    return fetch('/api/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json());
}
