// API基础URL
const API_BASE_URL = '/api';

// 从API获取单词列表
async function fetchWords() {
    try {
        const response = await fetch(`${API_BASE_URL}/words`);
        if (!response.ok) {
            throw new Error('获取单词列表失败');
        }
        wordsList = await response.json();
        renderWordList();
    } catch (error) {
        console.error('获取单词列表错误:', error);
        showNotification('获取单词列表失败', 'error');
    }
}
// 从localStorage获取单词列表，如果没有则使用默认列表
let wordsList = JSON.parse(localStorage.getItem('wordsList')) || [
    { word: "apple", translation: "苹果" },
    { word: "banana", translation: "香蕉" },
    { word: "orange", translation: "橙子" },
    { word: "grape", translation: "葡萄" },
    { word: "watermelon", translation: "西瓜" },
    { word: "strawberry", translation: "草莓" },
    { word: "pineapple", translation: "菠萝" },
    { word: "peach", translation: "桃子" },
    { word: "cherry", translation: "樱桃" },
    { word: "lemon", translation: "柠檬" },
    { word: "computer", translation: "电脑" },
    { word: "keyboard", translation: "键盘" },
    { word: "mouse", translation: "鼠标" },
    { word: "monitor", translation: "显示器" },
    { word: "window", translation: "窗户" },
    { word: "door", translation: "门" },
    { word: "table", translation: "桌子" },
    { word: "chair", translation: "椅子" },
    { word: "book", translation: "书" },
    { word: "pen", translation: "笔" }
];

// DOM元素
const addWordForm = document.getElementById('add-word-form');
const wordInput = document.getElementById('word');
const translationInput = document.getElementById('translation');
const wordListTable = document.getElementById('word-list').querySelector('tbody');
const searchInput = document.getElementById('search-input');
const excelFileInput = document.getElementById('excel-file');
const importBtn = document.getElementById('import-btn');
const exportBtn = document.getElementById('export-btn');
const downloadTemplateBtn = document.getElementById('download-template');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-word-form');
const editIndexInput = document.getElementById('edit-index');
const editWordInput = document.getElementById('edit-word');
const editTranslationInput = document.getElementById('edit-translation');
const closeModalBtn = document.querySelector('.close-btn');

// 初始化页面
function init() {
    fetchWords();
    setupEventListeners();
}

// 渲染单词列表
function renderWordList(filteredList = null) {
    const list = filteredList || wordsList;
    wordListTable.innerHTML = '';
    
    if (list.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="3" style="text-align: center;">没有单词数据</td>';
        wordListTable.appendChild(emptyRow);
        return;
    }
    
    list.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.word}</td>
            <td>${item.translation}</td>
            <td>
                <button class="action-btn edit-btn" data-index="${index}">编辑</button>
                <button class="action-btn delete-btn" data-index="${index}">删除</button>
            </td>
        `;
        wordListTable.appendChild(row);
    });
    
    // 添加编辑和删除按钮的事件监听
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEdit);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

// 设置事件监听
function setupEventListeners() {
    // 添加单词表单提交
    addWordForm.addEventListener('submit', handleAddWord);
    
    // 搜索功能
    searchInput.addEventListener('input', handleSearch);
    
    // Excel导入
    importBtn.addEventListener('click', handleImport);
    
    // Excel导出
    exportBtn.addEventListener('click', handleExport);
    
    // 下载模板
    downloadTemplateBtn.addEventListener('click', downloadTemplate);
    
    // 编辑表单提交
    editForm.addEventListener('submit', handleEditSubmit);
    
    // 关闭模态框
    closeModalBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.classList.add('hidden');
        }
    });
}

// 处理添加单词
async function handleAddWord(e) {
    e.preventDefault();
    
    const word = wordInput.value.trim();
    const translation = translationInput.value.trim();
    
    if (!word || !translation) {
        alert('请填写单词和翻译');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/words`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word, translation })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '添加单词失败');
        }
        
        // 获取新添加的单词数据
        const newWord = await response.json();
        
        // 添加到列表
        wordsList.push(newWord);
        
        // 重新渲染列表
        renderWordList();
        
        // 清空表单
        addWordForm.reset();
        wordInput.focus();
        
        // 显示成功消息
        showNotification('单词添加成功');
        
    } catch (error) {
        console.error('添加单词错误:', error);
        alert(error.message);
    }
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        renderWordList();
        return;
    }
    
    const filteredList = wordsList.filter(item => 
        item.word.toLowerCase().includes(searchTerm) || 
        item.translation.toLowerCase().includes(searchTerm)
    );
    
    renderWordList(filteredList);
}

// 处理编辑
function handleEdit(e) {
    const index = e.target.dataset.index;
    const wordData = wordsList[index];
    
    // 填充编辑表单
    editIndexInput.value = index;
    editWordInput.value = wordData.word;
    editTranslationInput.value = wordData.translation;
    
    // 显示模态框
    editModal.classList.remove('hidden');
}

// 处理编辑提交
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const index = parseInt(editIndexInput.value);
    const wordData = wordsList[index];
    const wordId = wordData.id;
    const word = editWordInput.value.trim();
    const translation = editTranslationInput.value.trim();
    
    if (!word || !translation) {
        alert('请填写单词和翻译');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ word, translation })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '更新单词失败');
        }
        
        // 获取更新后的单词数据
        const updatedWord = await response.json();
        
        // 更新列表中的单词
        wordsList[index] = updatedWord;
        
        // 重新渲染列表
        renderWordList();
        
        // 关闭模态框
        editModal.classList.add('hidden');
        
        // 显示成功消息
        showNotification('单词更新成功');
        
    } catch (error) {
        console.error('更新单词错误:', error);
        alert(error.message);
    }
}

// 处理删除
async function handleDelete(e) {
    const index = e.target.dataset.index;
    const wordData = wordsList[index];
    const wordId = wordData.id;
    const wordToDelete = wordData.word;
    
    if (confirm(`确定要删除单词 "${wordToDelete}" 吗？`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/words/${wordId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除单词失败');
            }
            
            // 从列表中移除单词
            wordsList.splice(index, 1);
            
            // 重新渲染列表
            renderWordList();
            
            // 显示成功消息
            showNotification('单词删除成功');
            
        } catch (error) {
            console.error('删除单词错误:', error);
            alert(error.message);
        }
    }
}

// 处理文件导入
async function handleImport() {
    if (!excelFileInput.files.length) {
        alert('请选择文件');
        return;
    }
    
    const file = excelFileInput.files[0];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // 检查文件类型
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
        alert('请选择有效的Excel文件(.xlsx, .xls)或CSV文件(.csv)');
        return;
    }
    
    try {
        // 创建FormData对象
        const formData = new FormData();
        formData.append('file', file);
        
        // 发送请求到API
        const response = await fetch(`${API_BASE_URL}/words/import`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '导入单词失败');
        }
        
        // 获取导入结果
        const result = await response.json();
        
        // 重新获取单词列表
        await fetchWords();
        
        // 显示成功消息
        showNotification(`成功导入 ${result.success_count} 个单词`);
        
        // 显示重复单词信息
        if (result.duplicate_count > 0) {
            alert(`以下 ${result.duplicate_count} 个单词已存在，未导入：\n${result.duplicate_words.join(', ')}`);
        }
        
        // 清空文件输入
        excelFileInput.value = '';
        
    } catch (error) {
        console.error('Excel导入错误:', error);
        alert(error.message || 'Excel文件导入失败');
    }
}

// 处理文件导出
function handleExport() {
    if (wordsList.length === 0) {
        alert('没有单词数据可导出');
        return;
    }
    
    // 创建导出格式选择对话框
    const format = confirm('选择导出格式:\n确定 - Excel格式\n取消 - CSV格式');
    
    if (format) {
        // 导出Excel文件
        window.location.href = `${API_BASE_URL}/words/export?format=excel`;
    } else {
        // 导出CSV文件
        window.location.href = `${API_BASE_URL}/words/export?format=csv`;
    }
}

// 下载模板
function downloadTemplate(e) {
    e.preventDefault();
    
    // 创建模板格式选择对话框
    const format = confirm('选择模板格式:\n确定 - Excel格式\n取消 - CSV格式');
    
    if (format) {
        // 下载Excel模板
        window.location.href = `${API_BASE_URL}/words/template?format=excel`;
    } else {
        // 下载CSV模板
        window.location.href = `${API_BASE_URL}/words/template?format=csv`;
    }
}

// 显示通知消息
function showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 添加样式
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#2ecc71';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    // 3秒后移除通知
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', init);