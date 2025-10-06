// 服务器版本的数据管理 - project_manager项目管理系统
// 数据从服务器加载和保存，不依赖浏览器localStorage

class ServerDataManager {
    constructor() {
        this.plans = [];
        this.projects = [];
        this.tasks = [];
        this.records = [];
        this.serverUrl = ''; // 自动检测服务器URL
        this.init();
    }

    init() {
        // 检测服务器URL
        this.serverUrl = window.location.origin;
        console.log('服务器URL:', this.serverUrl);
    }

    // 从服务器加载所有数据
    async loadFromServer() {
        try {
            const response = await fetch(`${this.serverUrl}/api/data`);
            if (response.ok) {
                const data = await response.json();

                // 验证数据格式
                if (!data || typeof data !== 'object') {
                    throw new Error('服务器返回数据格式错误');
                }

                this.plans = Array.isArray(data.plans) ? data.plans : [];
                this.projects = Array.isArray(data.projects) ? data.projects : [];
                this.tasks = Array.isArray(data.tasks) ? data.tasks : [];
                this.records = Array.isArray(data.records) ? data.records : [];

                console.log('✅ 数据从服务器加载成功');
                console.log(`📊 加载统计: 计划${this.plans.length}, 项目${this.projects.length}, 任务${this.tasks.length}, 记录${this.records.length}`);
                return true;
            } else {
                console.error('❌ 从服务器加载数据失败:', response.status, response.statusText);
                // 网络错误时尝试使用localStorage作为备份
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ 网络错误:', error.message);
            // 网络错误时尝试使用localStorage作为备份
            return this.loadFromLocalStorage();
        }
    }

    // 保存数据到服务器
    async saveToServer() {
        try {
            // 数据验证
            const dataToSave = {
                plans: this.plans || [],
                projects: this.projects || [],
                tasks: this.tasks || [],
                records: this.records || []
            };

            // 检查数据大小
            const dataSize = JSON.stringify(dataToSave).length;
            if (dataSize > 10 * 1024 * 1024) { // 10MB限制
                throw new Error('数据太大，请减少数据量');
            }

            const response = await fetch(`${this.serverUrl}/api/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    console.log('✅ 数据保存到服务器成功:', result.message);
                    return true;
                } else {
                    console.error('❌ 服务器保存失败:', result.message);
                    return false;
                }
            } else {
                console.error('❌ 保存到服务器失败:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.error('❌ 保存到服务器错误:', error.message);
            // 网络错误时保存到localStorage作为备份
            return this.saveToLocalStorage();
        }
    }

    // localStorage备份功能
    loadFromLocalStorage() {
        try {
            const storedData = localStorage.getItem('projectManagerData');
            if (storedData) {
                const data = JSON.parse(storedData);
                this.plans = data.plans || [];
                this.projects = data.projects || [];
                this.tasks = data.tasks || [];
                this.records = data.records || [];
                console.log('⚠️ 使用localStorage备份数据');
                return true;
            }
        } catch (e) {
            console.error('localStorage加载失败:', e);
        }
        return false;
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('projectManagerData', JSON.stringify({
                plans: this.plans,
                projects: this.projects,
                tasks: this.tasks,
                records: this.records
            }));
            console.log('💾 数据已备份到localStorage');
            return true;
        } catch (e) {
            console.error('localStorage保存失败:', e);
            return false;
        }
    }

    // 数据操作方法
    addPlan(plan) {
        plan.id = this.generateId();
        plan.createdAt = new Date().toISOString();
        this.plans.push(plan);
        return this.saveToServer();
    }

    updatePlan(planId, planData) {
        const index = this.plans.findIndex(p => p.id === planId);
        if (index !== -1) {
            this.plans[index] = { ...this.plans[index], ...planData };
            return this.saveToServer();
        }
        return false;
    }

    deletePlan(planId) {
        const planIndex = this.plans.findIndex(p => p.id === planId);
        if (planIndex !== -1) {
            this.plans.splice(planIndex, 1);
            // 清除项目中的计划关联，并更新项目状态
            this.projects.forEach(project => {
                if (project.planId === planId) {
                    project.planId = '';
                    // 如果项目状态是计划中，改为进行中
                    if (project.status === 'planning') {
                        project.status = 'active';
                    }
                }
            });
            return this.saveToServer();
        }
        return false;
    }

    addProject(project) {
        project.id = this.generateId();
        project.createdAt = new Date().toISOString();
        this.projects.push(project);
        return this.saveToServer();
    }

    updateProject(projectId, projectData) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...projectData };
            return this.saveToServer();
        }
        return false;
    }

    deleteProject(projectId) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            // 删除项目的所有任务
            this.tasks = this.tasks.filter(t => t.projectId !== projectId);
            this.projects.splice(index, 1);
            return this.saveToServer();
        }
        return false;
    }

    addTask(task) {
        task.id = this.generateId();
        task.createdAt = new Date().toISOString();
        this.tasks.push(task);
        return this.saveToServer();
    }

    updateTask(taskId, taskData) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...taskData };
            return this.saveToServer();
        }
        return false;
    }

    deleteTask(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            return this.saveToServer();
        }
        return false;
    }

    addRecord(record) {
        record.id = this.generateId();
        record.uploadDate = new Date().toISOString();
        this.records.push(record);
        return this.saveToServer();
    }

    deleteRecord(recordId) {
        const index = this.records.findIndex(r => r.id === recordId);
        if (index !== -1) {
            const deletedRecord = this.records[index];
            this.records.splice(index, 1);

            // 同步全局变量
            syncGlobalVariables();

            // 立即保存到服务器
            return this.saveToServer().then(success => {
                if (success) {
                    console.log('✅ 记录删除成功:', deletedRecord.name);
                    return true;
                } else {
                    console.error('❌ 记录删除失败，正在恢复...');
                    // 如果保存失败，恢复记录
                    this.records.splice(index, 0, deletedRecord);
                    syncGlobalVariables();
                    return false;
                }
            });
        }
        return Promise.resolve(false);
    }

    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 导出数据
    exportData() {
        const data = {
            plans: this.plans,
            projects: this.projects,
            tasks: this.tasks,
            records: this.records,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        const jsonData = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `projects_export_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    // 导入数据
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.plans && data.projects && data.tasks && data.records) {
                this.plans = data.plans;
                this.projects = data.projects;
                this.tasks = data.tasks;
                this.records = data.records;

                const success = await this.saveToServer();
                if (success) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
}

// 创建全局数据管理器实例
const dataManager = new ServerDataManager();

// 为了兼容现有代码，创建全局变量
let plans = [];
let projects = [];
let tasks = [];
let records = [];

// 同步数据管理器中的数据到全局变量
function syncGlobalVariables() {
    plans = dataManager.plans;
    projects = dataManager.projects;
    tasks = dataManager.tasks;
    records = dataManager.records;
}

// 保存数据的包装函数
async function saveToLocalStorage() {
    // 同步全局变量到数据管理器
    dataManager.plans = plans;
    dataManager.projects = projects;
    dataManager.tasks = tasks;
    dataManager.records = records;

    const success = await dataManager.saveToServer();
    if (!success) {
        showNotification('数据保存失败，请检查网络连接', 'error');
    }
    return success;
}

// 加载数据的包装函数
async function loadFromLocalStorage() {
    const success = await dataManager.loadFromServer();
    if (success) {
        syncGlobalVariables();

        // 确保默认记录只在没有记录时添加
        if (records.length === 0) {
            await addDefaultRecords();
            syncGlobalVariables(); // 再次同步以包含默认记录
        }

        updateDashboard();
        renderPlans();
        renderProjects();
        renderRecords();
        showNotification('数据加载成功', 'success');
    } else {
        showNotification('数据加载失败，请检查网络连接', 'error');
    }
    return success;
}

// 添加默认的PDF记录（仅在第一次初始化时）
async function addDefaultRecords() {
    const defaultFiles = [
        {
            id: 'default_3days_record_20251005',
            name: '3天一阶段制工作记录表20251005.pdf',
            size: 107109,
            type: 'application/pdf',
            uploadDate: new Date().toISOString(),
            path: './store/3天一阶段制工作记录表20251005.pdf',
            isDefault: true
        },
        {
            id: 'default_creative_direction_20251005',
            name: '创意基础与前沿方向20251005.pdf',
            size: 2750350,
            type: 'application/pdf',
            uploadDate: new Date().toISOString(),
            path: './store/创意基础与前沿方向20251005.pdf',
            isDefault: true
        }
    ];

    let addedAny = false;

    // 只添加默认记录，如果用户已有记录则跳过
    for (const file of defaultFiles) {
        if (!records.find(r => r.name === file.name || r.id === file.id)) {
            const success = await dataManager.addRecord(file);
            if (success) {
                addedAny = true;
                console.log('✅ 添加默认记录:', file.name);
            }
        }
    }

    if (addedAny) {
        // 如果添加了新记录，同步到全局变量
        syncGlobalVariables();
        console.log('✅ 默认记录初始化完成');
    }
}

// 导出数据
function exportData() {
    dataManager.exportData();
    showNotification('数据导出成功！');
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    // 添加到页面
    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => notification.classList.add('show'), 100);

    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 显示加载提示
    showNotification('正在从服务器加载数据...', 'info');

    // 加载数据 (默认记录的添加已在loadFromLocalStorage中处理)
    loadFromLocalStorage();
});

console.log('🚀 project_manager项目管理系统已加载');
console.log('📡 数据将从服务器动态加载和保存');