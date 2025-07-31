/**
 * 单词记忆游戏 - 排行榜相关脚本
 */

// 排行榜相关全局变量
let currentLeaderboardLevel = '';

/**
 * 初始化排行榜模块
 */
function initLeaderboardModule() {
    // 绑定排行榜相关事件
    bindLeaderboardEvents();
}

/**
 * 绑定排行榜相关事件
 */
function bindLeaderboardEvents() {
    // 排行榜筛选
    document.getElementById('leaderboard-level').addEventListener('change', function() {
        currentLeaderboardLevel = this.value;
        loadLeaderboardData(currentLeaderboardLevel);
    });
}

/**
 * 显示排行榜
 */
function showLeaderboard() {
    // 加载关卡选项
    loadLeaderboardLevels();
    
    // 加载排行榜数据
    loadLeaderboardData();
    
    showSection('leaderboard-section');
}

/**
 * 加载排行榜关卡选项
 */
function loadLeaderboardLevels() {
    const currentUser = getCurrentUser();
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
function loadLeaderboardData(level = '') {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // 显示加载中
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">加载中...</td></tr>';
    
    fetch(`/api/learning/leaderboard?level=${encodeURIComponent(level)}`)
    .then(response => response.json())
    .then(data => {
        displayLeaderboardData(data.scores);
        
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
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">加载失败，请重试</td></tr>';
    });
}

/**
 * 显示排行榜数据
 * @param {Array} scores 分数数据
 */
function displayLeaderboardData(scores) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">暂无数据</td>';
        tbody.appendChild(row);
        return;
    }
    
    scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        // 高亮当前用户
        const currentUser = getCurrentUser();
        if (currentUser && score.user_id === currentUser.id) {
            row.className = 'current-user';
        }
        
        // 根据排名添加样式
        if (index === 0) {
            row.classList.add('rank-first');
        } else if (index === 1) {
            row.classList.add('rank-second');
        } else if (index === 2) {
            row.classList.add('rank-third');
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${score.username}</td>
            <td>${Math.round(score.score)}%</td>
            <td>${formatTime(score.time_spent)}</td>
            <td>${formatDate(score.created_at)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * 获取用户排名
 * @param {string} level 关卡标识
 */
function getUserRank(level = '') {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    fetch(`/api/learning/rank/${currentUser.id}?level=${encodeURIComponent(level)}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-rank').textContent = data.rank || '-';
    })
    .catch(() => {
        document.getElementById('user-rank').textContent = '-';
    });
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
 * 格式化日期
 * @param {string} dateString 日期字符串
 * @returns {string} 格式化后的日期
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
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

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initLeaderboardModule();
});