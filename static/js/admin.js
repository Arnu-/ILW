/**
 * 单词记忆游戏 - 管理员端脚本
 */

// 全局变量
let currentAdminUser = null;
let currentPage = 1;
let pageSize = 10;
let totalWords = 0;
let currentGroup = null;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化事件监听
    initAdminEventListeners();
    
    // 检查管理员登录状态
    checkAdminLoginStatus();
});

/**
 * 初始化管理员端事件监听
 */
function initAdminEventListeners() {
    // 登录按钮
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    
    // 登出按钮
    document.getElementById('admin-logout-btn').addEventListener('click', handleAdminLogout);
    
    // 导航链接
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活动状态
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active');
            });
            
            // 添加当前活动状态
            this.classList.add('active');
            
            // 隐藏所有部分
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // 显示目标部分
            const targetId = this.dataset.target;
            document.getElementById(targetId).classList.remove('hidden');
            
            // 加载对应部分的数据
            loadSectionData(targetId);
        });
    });
    
    // 添加单词按钮
    document.getElementById('add-word-btn').addEventListener('click', function() {
        showAddWordModal();
    });
    
    // 添加单词组按钮
    document.getElementById('add-group-btn').addEventListener('click', function() {
        showAddGroupModal();
    });
    
    // 初始化均衡单词组按钮
    document.getElementById('initialize-groups-btn').addEventListener('click', function() {
        initializeBalancedGroups();
    });
    
    // 导入按钮
    document.getElementById('import-btn').addEventListener('click', function() {
        importWords();
    });
    
    // 单词搜索
    document.getElementById('word-search').addEventListener('input', function() {
        filterWords();
    });
    
    // 难度筛选
    document.getElementById('difficulty-filter').addEventListener('change', function() {
        filterWords();
    });
    
    // 关闭模态框
    document.querySelector('.close-modal').addEventListener('click', function() {
        closeModal();
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('modal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

/**
 * 检查用户是否是管理员
 * @param {number} userId 用户ID
 * @param {string} password 管理员密码
 * @returns {Promise<boolean>} 是否是管理员
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
    .then(data => {
        return data.is_admin;
    });
}

/**
 * 检查管理员登录状态
 */
function checkAdminLoginStatus() {
    const savedUser = localStorage.getItem('wordGameAdminUser');
    if (savedUser) {
        currentAdminUser = JSON.parse(savedUser);
        
        // 直接显示管理员界面，不再验证权限
        // 因为现在需要密码验证，所以在每次API请求时都会验证权限
        document.getElementById('admin-current-user').textContent = currentAdminUser.username;
        showAdminMainScreen();
        loadSectionData('word-management');
    } else {
        showAdminLoginScreen();
    }
}

/**
 * 管理员登录API调用
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} 登录结果
 */
function adminLogin(username, password) {
    return fetch('/api/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => response.json());
}

/**
 * 处理管理员登录
 */
function handleAdminLogin() {
    const username = document.getElementById('admin-username').value.trim();
    const password = document.getElementById('admin-password').value.trim();
    
    if (!username) {
        alert('请输入用户名');
        return;
    }
    
    if (!password) {
        alert('请输入密码');
        return;
    }
    
    // 调用API登录
    adminLogin(username, password)
    .then(result => {
        if (result.success) {
            currentAdminUser = result.user;
            localStorage.setItem('wordGameAdminUser', JSON.stringify(currentAdminUser));
            document.getElementById('admin-current-user').textContent = currentAdminUser.username;
            document.getElementById('admin-password').value = ''; // 清空密码框
            showAdminMainScreen();
            loadSectionData('word-management');
        } else {
            alert('登录失败: ' + result.error);
        }
    })
    .catch(error => {
        console.error('登录错误:', error);
        alert('登录出错，请重试');
    });
}

/**
 * 处理管理员登出
 */
function handleAdminLogout() {
    currentAdminUser = null;
    localStorage.removeItem('wordGameAdminUser');
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    showAdminLoginScreen();
}

/**
 * 显示管理员登录界面
 */
function showAdminLoginScreen() {
    document.getElementById('admin-login-screen').classList.remove('hidden');
    document.getElementById('admin-main-screen').classList.add('hidden');
}

/**
 * 显示管理员主界面
 */
function showAdminMainScreen() {
    document.getElementById('admin-login-screen').classList.add('hidden');
    document.getElementById('admin-main-screen').classList.remove('hidden');
}

/**
 * 加载部分数据
 * @param {string} sectionId 部分ID
 */
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'word-management':
            loadWords();
            break;
        case 'group-management':
            loadGroups();
            break;
        case 'system-stats':
            loadSystemStats();
            break;
    }
}

/**
 * 加载单词数据
 */
function loadWords() {
    fetch('/api/words')
    .then(response => response.json())
    .then(data => {
        totalWords = data.words.length;
        displayWords(data.words);
    })
    .catch(error => {
        console.error('加载单词错误:', error);
        alert('加载单词失败，请重试');
    });
}

/**
 * 显示单词数据
 * @param {Array} words 单词数据
 */
function displayWords(words) {
    const tableBody = document.querySelector('#words-table tbody');
    tableBody.innerHTML = '';
    
    // 筛选单词
    const searchText = document.getElementById('word-search').value.toLowerCase();
    const difficultyFilter = document.getElementById('difficulty-filter').value;
    
    const filteredWords = words.filter(word => {
        const matchesSearch = searchText === '' || 
            word.word.toLowerCase().includes(searchText) || 
            word.translation.toLowerCase().includes(searchText);
        
        const matchesDifficulty = difficultyFilter === '' || 
            word.difficulty.toString() === difficultyFilter;
        
        return matchesSearch && matchesDifficulty;
    });
    
    // 分页
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pagedWords = filteredWords.slice(startIndex, endIndex);
    
    // 显示单词
    pagedWords.forEach(word => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${word.id}</td>
            <td>${word.word}</td>
            <td>${word.translation}</td>
            <td>${getDifficultyName(word.difficulty)}</td>
            <td class="actions">
                <button class="edit-btn" data-id="${word.id}">编辑</button>
                <button class="delete-btn" data-id="${word.id}">删除</button>
            </td>
        `;
        
        // 添加编辑按钮事件
        row.querySelector('.edit-btn').addEventListener('click', function() {
            const wordId = this.dataset.id;
            showEditWordModal(words.find(w => w.id == wordId));
        });
        
        // 添加删除按钮事件
        row.querySelector('.delete-btn').addEventListener('click', function() {
            const wordId = this.dataset.id;
            if (confirm('确定要删除这个单词吗？')) {
                deleteWord(wordId);
            }
        });
        
        tableBody.appendChild(row);
    });
    
    // 更新分页
    updatePagination(filteredWords.length);
}

/**
 * 更新分页
 * @param {number} totalItems 总项目数
 */
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const pagination = document.getElementById('words-pagination');
    pagination.innerHTML = '';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '上一页';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadWords();
        }
    });
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.classList.toggle('active', i === currentPage);
        pageBtn.addEventListener('click', function() {
            currentPage = i;
            loadWords();
        });
        pagination.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '下一页';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadWords();
        }
    });
    pagination.appendChild(nextBtn);
}

/**
 * 筛选单词
 */
function filterWords() {
    currentPage = 1;
    loadWords();
}

/**
 * 显示添加单词模态框
 */
function showAddWordModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '添加单词';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label for="word-input">单词</label>
            <input type="text" id="word-input" required>
        </div>
        <div class="form-group">
            <label for="translation-input">翻译</label>
            <input type="text" id="translation-input" required>
        </div>
        <div class="form-group">
            <label for="difficulty-input">难度</label>
            <select id="difficulty-input">
                <option value="1">简单</option>
                <option value="2">中等</option>
                <option value="3">困难</option>
                <option value="4">专家</option>
            </select>
        </div>
        <div class="form-actions">
            <button id="cancel-word-btn">取消</button>
            <button id="save-word-btn">保存</button>
        </div>
    `;
    
    // 添加事件监听
    document.getElementById('cancel-word-btn').addEventListener('click', closeModal);
    document.getElementById('save-word-btn').addEventListener('click', saveWord);
    
    // 显示模态框
    document.getElementById('modal').classList.remove('hidden');
}

/**
 * 显示编辑单词模态框
 * @param {Object} word 单词对象
 */
function showEditWordModal(word) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '编辑单词';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label for="word-input">单词</label>
            <input type="text" id="word-input" value="${word.word}" required>
        </div>
        <div class="form-group">
            <label for="translation-input">翻译</label>
            <input type="text" id="translation-input" value="${word.translation}" required>
        </div>
        <div class="form-group">
            <label for="difficulty-input">难度</label>
            <select id="difficulty-input">
                <option value="1" ${word.difficulty === 1 ? 'selected' : ''}>简单</option>
                <option value="2" ${word.difficulty === 2 ? 'selected' : ''}>中等</option>
                <option value="3" ${word.difficulty === 3 ? 'selected' : ''}>困难</option>
                <option value="4" ${word.difficulty === 4 ? 'selected' : ''}>专家</option>
            </select>
        </div>
        <div class="form-actions">
            <button id="cancel-word-btn">取消</button>
            <button id="update-word-btn" data-id="${word.id}">更新</button>
        </div>
    `;
    
    // 添加事件监听
    document.getElementById('cancel-word-btn').addEventListener('click', closeModal);
    document.getElementById('update-word-btn').addEventListener('click', function() {
        updateWord(this.dataset.id);
    });
    
    // 显示模态框
    document.getElementById('modal').classList.remove('hidden');
}

/**
 * 保存单词
 */
function saveWord() {
    const word = document.getElementById('word-input').value.trim();
    const translation = document.getElementById('translation-input').value.trim();
    const difficulty = parseInt(document.getElementById('difficulty-input').value);
    
    if (!word || !translation) {
        alert('单词和翻译不能为空');
        return;
    }
    
    fetch('/api/words', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word,
            translation,
            difficulty
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal();
            loadWords();
        }
    })
    .catch(error => {
        console.error('添加单词错误:', error);
        alert('添加单词失败，请重试');
    });
}

/**
 * 更新单词
 * @param {number} wordId 单词ID
 */
function updateWord(wordId) {
    const word = document.getElementById('word-input').value.trim();
    const translation = document.getElementById('translation-input').value.trim();
    const difficulty = parseInt(document.getElementById('difficulty-input').value);
    
    if (!word || !translation) {
        alert('单词和翻译不能为空');
        return;
    }
    
    fetch(`/api/words/${wordId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word,
            translation,
            difficulty
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal();
            loadWords();
        }
    })
    .catch(error => {
        console.error('更新单词错误:', error);
        alert('更新单词失败，请重试');
    });
}

/**
 * 删除单词
 * @param {number} wordId 单词ID
 */
function deleteWord(wordId) {
    fetch(`/api/words/${wordId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            loadWords();
        }
    })
    .catch(error => {
        console.error('删除单词错误:', error);
        alert('删除单词失败，请重试');
    });
}

/**
 * 加载单词组数据
 */
function loadGroups() {
    fetch('/api/word-groups')
    .then(response => response.json())
    .then(data => {
        displayGroups(data.groups);
    })
    .catch(error => {
        console.error('加载单词组错误:', error);
        alert('加载单词组失败，请重试');
    });
}

/**
 * 显示单词组数据
 * @param {Array} groups 单词组数据
 */
function displayGroups(groups) {
    const tableBody = document.querySelector('#groups-table tbody');
    tableBody.innerHTML = '';
    
    groups.forEach(group => {
        const row = document.createElement('tr');
        
        // 获取组内单词数量
        fetch(`/api/word-groups/${group.id}/words`)
        .then(response => response.json())
        .then(data => {
            const wordCount = data.words ? data.words.length : 0;
            
            row.innerHTML = `
                <td>${group.id}</td>
                <td>${group.name}</td>
                <td>${group.description || ''}</td>
                <td>${group.sequence}</td>
                <td>${wordCount}</td>
                <td class="actions">
                    <button class="view-btn" data-id="${group.id}">查看</button>
                    <button class="edit-btn" data-id="${group.id}">编辑</button>
                    <button class="delete-btn" data-id="${group.id}">删除</button>
                </td>
            `;
            
            // 添加查看按钮事件
            row.querySelector('.view-btn').addEventListener('click', function() {
                const groupId = this.dataset.id;
                viewGroupDetails(groupId);
            });
            
            // 添加编辑按钮事件
            row.querySelector('.edit-btn').addEventListener('click', function() {
                const groupId = this.dataset.id;
                showEditGroupModal(groups.find(g => g.id == groupId));
            });
            
            // 添加删除按钮事件
            row.querySelector('.delete-btn').addEventListener('click', function() {
                const groupId = this.dataset.id;
                if (confirm('确定要删除这个单词组吗？')) {
                    deleteGroup(groupId);
                }
            });
        })
        .catch(error => {
            console.error('获取组内单词数量错误:', error);
        });
        
        tableBody.appendChild(row);
    });
}

/**
 * 查看单词组详情
 * @param {number} groupId 单词组ID
 */
function viewGroupDetails(groupId) {
    // 获取单词组信息
    fetch(`/api/word-groups/${groupId}`)
    .then(response => response.json())
    .then(data => {
        currentGroup = data.group;
        document.getElementById('group-detail-name').textContent = currentGroup.name;
        
        // 获取组内单词
        return fetch(`/api/word-groups/${groupId}/words`);
    })
    .then(response => response.json())
    .then(data => {
        // 显示组内单词
        const tableBody = document.querySelector('#group-words-table tbody');
        tableBody.innerHTML = '';
        
        if (data.words && data.words.length > 0) {
            data.words.forEach(word => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${word.id}</td>
                    <td>${word.word}</td>
                    <td>${word.translation}</td>
                    <td>${getDifficultyName(word.difficulty)}</td>
                    <td class="actions">
                        <button class="delete-btn" data-id="${word.id}">移除</button>
                    </td>
                `;
                
                // 添加移除按钮事件
                row.querySelector('.delete-btn').addEventListener('click', function() {
                    const wordId = this.dataset.id;
                    if (confirm('确定要从组中移除这个单词吗？')) {
                        removeWordFromGroup(currentGroup.id, wordId);
                    }
                });
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">暂无单词</td></tr>';
        }
        
        // 添加单词到组按钮事件
        document.getElementById('add-word-to-group-btn').addEventListener('click', function() {
            showAddWordToGroupModal(currentGroup.id);
        });
        
        // 显示单词组详情
        document.getElementById('group-details').classList.remove('hidden');
    })
    .catch(error => {
        console.error('加载单词组详情错误:', error);
        alert('加载单词组详情失败，请重试');
    });
}

/**
 * 显示添加单词组模态框
 */
function showAddGroupModal() {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '添加单词组';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label for="group-name-input">名称</label>
            <input type="text" id="group-name-input" required>
        </div>
        <div class="form-group">
            <label for="group-description-input">描述</label>
            <textarea id="group-description-input"></textarea>
        </div>
        <div class="form-actions">
            <button id="cancel-group-btn">取消</button>
            <button id="save-group-btn">保存</button>
        </div>
    `;
    
    // 添加事件监听
    document.getElementById('cancel-group-btn').addEventListener('click', closeModal);
    document.getElementById('save-group-btn').addEventListener('click', saveGroup);
    
    // 显示模态框
    document.getElementById('modal').classList.remove('hidden');
}

/**
 * 显示编辑单词组模态框
 * @param {Object} group 单词组对象
 */
function showEditGroupModal(group) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '编辑单词组';
    
    modalBody.innerHTML = `
        <div class="form-group">
            <label for="group-name-input">名称</label>
            <input type="text" id="group-name-input" value="${group.name}" required>
        </div>
        <div class="form-group">
            <label for="group-description-input">描述</label>
            <textarea id="group-description-input">${group.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label for="group-sequence-input">序号</label>
            <input type="number" id="group-sequence-input" value="${group.sequence}" min="1" required>
        </div>
        <div class="form-actions">
            <button id="cancel-group-btn">取消</button>
            <button id="update-group-btn" data-id="${group.id}">更新</button>
        </div>
    `;
    
    // 添加事件监听
    document.getElementById('cancel-group-btn').addEventListener('click', closeModal);
    document.getElementById('update-group-btn').addEventListener('click', function() {
        updateGroup(this.dataset.id);
    });
    
    // 显示模态框
    document.getElementById('modal').classList.remove('hidden');
}

/**
 * 显示添加单词到组模态框
 * @param {number} groupId 单词组ID
 */
function showAddWordToGroupModal(groupId) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = '添加单词到组';
    
    // 获取所有单词
    fetch('/api/words')
    .then(response => response.json())
    .then(data => {
        // 获取组内单词ID
        return fetch(`/api/word-groups/${groupId}/words`)
        .then(response => response.json())
        .then(groupData => {
            const groupWordIds = groupData.words ? groupData.words.map(w => w.id) : [];
            
            // 过滤出未在组内的单词
            const availableWords = data.words.filter(w => !groupWordIds.includes(w.id));
            
            modalBody.innerHTML = `
                <div class="form-group">
                    <label for="word-select">选择单词</label>
                    <select id="word-select" size="10" style="width: 100%;">
                        ${availableWords.map(w => `<option value="${w.id}">${w.word} - ${w.translation}</option>`).join('')}
                    </select>
                </div>
                <div class="form-actions">
                    <button id="cancel-add-word-btn">取消</button>
                    <button id="add-word-to-group-btn" data-group-id="${groupId}">添加</button>
                </div>
            `;
            
            // 添加事件监听
            document.getElementById('cancel-add-word-btn').addEventListener('click', closeModal);
            document.getElementById('add-word-to-group-btn').addEventListener('click', function() {
                const wordSelect = document.getElementById('word-select');
                const selectedWordId = wordSelect.value;
                
                if (!selectedWordId) {
                    alert('请选择单词');
                    return;
                }
                
                addWordToGroup(this.dataset.groupId, selectedWordId);
            });
            
            // 显示模态框
            document.getElementById('modal').classList.remove('hidden');
        });
    })
    .catch(error => {
        console.error('加载单词错误:', error);
        alert('加载单词失败，请重试');
    });
}

/**
 * 保存单词组
 */
function saveGroup() {
    const name = document.getElementById('group-name-input').value.trim();
    const description = document.getElementById('group-description-input').value.trim();
    
    if (!name) {
        alert('名称不能为空');
        return;
    }
    
    fetch('/api/word-groups', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal();
            loadGroups();
        }
    })
    .catch(error => {
        console.error('添加单词组错误:', error);
        alert('添加单词组失败，请重试');
    });
}

/**
 * 更新单词组
 * @param {number} groupId 单词组ID
 */
function updateGroup(groupId) {
    const name = document.getElementById('group-name-input').value.trim();
    const description = document.getElementById('group-description-input').value.trim();
    const sequence = parseInt(document.getElementById('group-sequence-input').value);
    
    if (!name) {
        alert('名称不能为空');
        return;
    }
    
    fetch(`/api/word-groups/${groupId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            description,
            sequence
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal();
            loadGroups();
        }
    })
    .catch(error => {
        console.error('更新单词组错误:', error);
        alert('更新单词组失败，请重试');
    });
}

/**
 * 删除单词组
 * @param {number} groupId 单词组ID
 */
function deleteGroup(groupId) {
    fetch(`/api/word-groups/${groupId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            loadGroups();
            document.getElementById('group-details').classList.add('hidden');
        }
    })
    .catch(error => {
        console.error('删除单词组错误:', error);
        alert('删除单词组失败，请重试');
    });
}

/**
 * 添加单词到组
 * @param {number} groupId 单词组ID
 * @param {number} wordId 单词ID
 */
function addWordToGroup(groupId, wordId) {
    fetch(`/api/word-groups/${groupId}/words`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            word_id: wordId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            closeModal();
            viewGroupDetails(groupId);
        }
    })
    .catch(error => {
        console.error('添加单词到组错误:', error);
        alert('添加单词到组失败，请重试');
    });
}

/**
 * 从组中移除单词
 * @param {number} groupId 单词组ID
 * @param {number} wordId 单词ID
 */
function removeWordFromGroup(groupId, wordId) {
    fetch(`/api/word-groups/${groupId}/words/${wordId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            viewGroupDetails(groupId);
        }
    })
    .catch(error => {
        console.error('从组中移除单词错误:', error);
        alert('从组中移除单词失败，请重试');
    });
}

/**
 * 初始化均衡单词组
 */
function initializeBalancedGroups() {
    if (confirm('确定要初始化均衡单词组吗？这将重新分配所有单词到不同组。')) {
        fetch('/api/admin/initialize-balanced-groups', {
            method: 'POST'
        })
        .then(response => {
            console.log('初始化均衡单词组响应状态:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('初始化均衡单词组响应数据:', data);
            if (data.error) {
                alert(data.error);
            } else {
                alert(`成功创建了 ${data.groups_count} 个均衡单词组`);
                loadGroups();
            }
        })
        .catch(error => {
            console.error('初始化均衡单词组错误:', error);
            alert('初始化均衡单词组失败，请重试');
        });
    }
}

/**
 * 导入单词
 */
function importWords() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('请选择文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/api/words/import', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(`成功导入了 ${data.imported_count} 个单词`);
            loadWords();
        }
    })
    .catch(error => {
        console.error('导入单词错误:', error);
        alert('导入单词失败，请重试');
    });
}

/**
 * 加载系统统计数据
 */
function loadSystemStats() {
    // 获取系统统计
    fetch('/api/admin/stats')
    .then(response => response.json())
    .then(data => {
        document.getElementById('total-words-count').textContent = data.total_words || 0;
        document.getElementById('total-groups-count').textContent = data.total_groups || 0;
        document.getElementById('total-users-count').textContent = data.total_users || 0;
        document.getElementById('total-learning-records').textContent = data.total_learning_records || 0;
        document.getElementById('avg-accuracy').textContent = `${Math.round(data.avg_accuracy || 0)}%`;
        
        // 显示难度分布
        const difficultyData = data.difficulty_distribution || {};
        const chartLabels = Object.keys(difficultyData).map(getDifficultyName);
        const chartValues = Object.values(difficultyData);
        
        // 这里可以使用图表库如Chart.js来显示图表
        // 简单起见，这里只显示文本
        const difficultyList = document.getElementById('difficulty-distribution-list');
        difficultyList.innerHTML = '';
        
        Object.entries(difficultyData).forEach(([difficulty, count]) => {
            const item = document.createElement('div');
            item.innerHTML = `${getDifficultyName(difficulty)}: ${count} 个单词`;
            difficultyList.appendChild(item);
        });
    })
    .catch(error => {
        console.error('加载系统统计错误:', error);
    });
}

/**
 * 关闭模态框
 */
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

/**
 * 获取难度名称
 * @param {number} difficulty 难度级别
 * @returns {string} 难度名称
 */
function getDifficultyName(difficulty) {
    switch (parseInt(difficulty)) {
        case 1: return '简单';
        case 2: return '中等';
        case 3: return '困难';
        case 4: return '专家';
        default: return `未知(${difficulty})`;
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAdminEventListeners,
        checkAdminLoginStatus,
        handleAdminLogin,
        handleAdminLogout,
        loadWords,
        loadGroups,
        loadSystemStats
    };
}
