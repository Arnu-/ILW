/**
 * 单词记忆游戏 - 用户认证相关脚本
 */

/**
 * 检查用户登录状态
 * @returns {Object|null} 当前登录用户或null
 */
function getCurrentUser() {
    const savedUser = localStorage.getItem('wordGameUser');
    return savedUser ? JSON.parse(savedUser) : null;
}

/**
 * 保存用户登录状态
 * @param {Object} user 用户对象
 */
function saveUserLogin(user) {
    localStorage.setItem('wordGameUser', JSON.stringify(user));
}

/**
 * 清除用户登录状态
 */
function clearUserLogin() {
    localStorage.removeItem('wordGameUser');
}

/**
 * 切换用户
 */
function switchUser() {
    clearUserLogin();
    window.location.reload();
}

/**
 * 检查管理员登录状态
 * @returns {Object|null} 当前登录管理员或null
 */
function getCurrentAdmin() {
    const savedAdmin = localStorage.getItem('wordGameAdminUser');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
}

/**
 * 保存管理员登录状态
 * @param {Object} admin 管理员对象
 */
function saveAdminLogin(admin) {
    localStorage.setItem('wordGameAdminUser', JSON.stringify(admin));
}

/**
 * 清除管理员登录状态
 */
function clearAdminLogin() {
    localStorage.removeItem('wordGameAdminUser');
}

/**
 * 验证用户是否为管理员
 * @param {number} userId 用户ID
 * @param {string} password 管理员密码
 * @returns {Promise<boolean>} 是否为管理员
 */
function validateAdmin(userId, password) {
    return fetch(`/api/admin/check/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => data.is_admin)
    .catch(() => false);
}

/**
 * 登录API
 * @param {string} username 用户名
 * @returns {Promise} Promise对象
 */
function loginApi(username) {
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
 * 管理员登录API
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {Promise} Promise对象
 */
function adminLoginApi(username, password) {
    return fetch('/api/admin/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json());
}
