// UI相关功能函数 - 从原始script.js中提取

// 全局变量
let currentEditingPlan = null;
let currentEditingProject = null;
let currentEditingTask = null;
let currentViewingPlan = null;
let currentViewingProject = null;
let currentPlanImageData = null;
let currentProjectImageData = null;

// 生成ID函数
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 更新仪表盘
function updateDashboard() {
    document.getElementById('totalPlans').textContent = plans.length;
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('activeProjects').textContent = projects.filter(p => p.status === 'active').length;
    document.getElementById('completedProjects').textContent = projects.filter(p => p.status === 'completed').length;

    renderRecentPlans();
    renderRecentProjects();
}

// 渲染最近计划
function renderRecentPlans() {
    const recentPlans = plans.slice(-3).reverse();
    const container = document.getElementById('recentPlansGrid');

    if (recentPlans.length === 0) {
        container.innerHTML = '<p class="no-data">暂无计划</p>';
        return;
    }

    const categoryNames = {
        career: '职业发展',
        skill: '技能提升',
        life: '生活规划',
        creative: '创意项目'
    };

    const statusNames = {
        draft: '草稿',
        active: '执行中',
        completed: '已完成',
        archived: '已归档'
    };

    container.innerHTML = recentPlans.map(plan => `
        <div class="plan-card status-${plan.status}" onclick="viewPlanDetail('${plan.id}')">
            <div class="plan-cover">
                ${plan.image ? `<img src="${plan.image}" alt="${plan.name}">` : '<i class="fas fa-lightbulb"></i>'}
            </div>
            <div class="plan-content">
                <h4>${plan.name}</h4>
                <p>${plan.description || '暂无描述'}</p>
                <div class="plan-meta">
                    <span class="category">${categoryNames[plan.category]}</span>
                    <span class="status">${statusNames[plan.status]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染最近项目
function renderRecentProjects() {
    const recentProjects = projects.slice(-3).reverse();
    const container = document.getElementById('recentProjectsGrid');

    if (recentProjects.length === 0) {
        container.innerHTML = '<p class="no-data">暂无项目</p>';
        return;
    }

    const categoryNames = {
        work: '工作',
        personal: '个人',
        study: '学习',
        creative: '创意'
    };

    const statusNames = {
        planning: '计划中',
        active: '进行中',
        completed: '已完成',
        paused: '已暂停'
    };

    const priorityNames = {
        low: '低',
        medium: '中',
        high: '高'
    };

    container.innerHTML = recentProjects.map(project => `
        <div class="project-card status-${project.status}" onclick="viewProjectDetail('${project.id}')">
            <div class="project-cover">
                ${project.image ? `<img src="${project.image}" alt="${project.name}">` : '<i class="fas fa-project-diagram"></i>'}
            </div>
            <div class="project-content">
                <h4>${project.name}</h4>
                <p>${project.description || '暂无描述'}</p>
                <div class="project-meta">
                    <span class="category">${categoryNames[project.category]}</span>
                    <span class="priority priority-${project.priority}">${priorityNames[project.priority]}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染所有计划
function renderPlans() {
    const container = document.getElementById('allPlansGrid');

    if (plans.length === 0) {
        container.innerHTML = '<p class="no-data">暂无计划</p>';
        return;
    }

    const categoryNames = {
        career: '职业发展',
        skill: '技能提升',
        life: '生活规划',
        creative: '创意项目'
    };

    const statusNames = {
        draft: '草稿',
        active: '执行中',
        completed: '已完成',
        archived: '已归档'
    };

    container.innerHTML = plans.map(plan => {
        // 计算相关项目数量
        const relatedProjects = projects.filter(p => p.planId === plan.id);
        const activeProjects = relatedProjects.filter(p => p.status === 'active').length;

        // 计算进度
        const completedProjects = relatedProjects.filter(p => p.status === 'completed').length;
        const progress = relatedProjects.length > 0 ? Math.round((completedProjects / relatedProjects.length) * 100) : 0;

        // 格式化日期
        const formatDate = (dateString) => {
            if (!dateString) return '未设定';
            return new Date(dateString).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        return `
            <div class="plan-card status-${plan.status}" style="--card-color: ${plan.color || '#6366f1'}" onclick="viewPlanDetail('${plan.id}')">
                <div class="plan-content">
                    <div class="plan-header">
                        <h4>${plan.name}</h4>
                        <div class="plan-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <span class="progress-text">${progress}%</span>
                        </div>
                    </div>

                    <p class="plan-description">${plan.description || '暂无描述'}</p>

                    <div class="plan-details">
                        <div class="detail-row">
                            <i class="fas fa-folder"></i>
                            <span>${categoryNames[plan.category]}</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-project-diagram"></i>
                            <span>${relatedProjects.length} 个项目 (${activeProjects} 进行中)</span>
                        </div>
                        <div class="detail-row">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}</span>
                        </div>
                    </div>

                    <div class="plan-footer">
                        <div class="plan-meta">
                            <span class="status status-${plan.status}">${statusNames[plan.status]}</span>
                            <span class="created-date">创建于 ${formatDate(plan.createdAt)}</span>
                        </div>
                        <div class="plan-actions">
                            <button class="plan-action-btn" onclick="event.stopPropagation(); editPlan('${plan.id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="plan-action-btn" onclick="event.stopPropagation(); deletePlan('${plan.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染所有项目
function renderProjects() {
    const container = document.getElementById('allProjectsGrid');

    if (projects.length === 0) {
        container.innerHTML = '<p class="no-data">暂无项目</p>';
        return;
    }

    const categoryNames = {
        work: '工作',
        personal: '个人',
        study: '学习',
        creative: '创意'
    };

    const statusNames = {
        planning: '计划中',
        active: '进行中',
        completed: '已完成',
        paused: '已暂停'
    };

    const priorityNames = {
        low: '低',
        medium: '中',
        high: '高'
    };

    container.innerHTML = projects.map(project => {
        // 获取关联的计划名称
        const relatedPlan = project.planId ? plans.find(p => p.id === project.planId) : null;

        // 计算任务统计
        const projectTasks = tasks.filter(t => t.projectId === project.id);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const totalTasks = projectTasks.length;
        const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 计算截止日期剩余天数
        const getDaysRemaining = (deadline) => {
            if (!deadline) return null;
            const today = new Date();
            const deadlineDate = new Date(deadline);
            const diffTime = deadlineDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        };

        const daysRemaining = getDaysRemaining(project.deadline);
        const formatDate = (dateString) => {
            if (!dateString) return '未设定';
            return new Date(dateString).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        // 根据剩余天数设置状态样式
        let deadlineClass = '';
        let deadlineText = formatDate(project.deadline);
        if (daysRemaining !== null) {
            if (daysRemaining < 0) {
                deadlineClass = 'overdue';
                deadlineText = `已逾期 ${Math.abs(daysRemaining)} 天`;
            } else if (daysRemaining <= 3) {
                deadlineClass = 'urgent';
                deadlineText = `剩余 ${daysRemaining} 天`;
            } else if (daysRemaining <= 7) {
                deadlineClass = 'warning';
                deadlineText = `剩余 ${daysRemaining} 天`;
            } else {
                deadlineText = `剩余 ${daysRemaining} 天`;
            }
        }

        return `
            <div class="project-card status-${project.status}" style="--card-color: ${project.color || '#3b82f6'}" onclick="viewProjectDetail('${project.id}')">
                <div class="project-content">
                    <div class="project-header">
                        <h4>${project.name}</h4>
                        <div class="task-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${taskProgress}%"></div>
                            </div>
                            <span class="progress-text">${completedTasks}/${totalTasks}</span>
                        </div>
                    </div>

                    <p class="project-description">${project.description || '暂无描述'}</p>

                    <div class="project-details">
                        <div class="detail-row">
                            <i class="fas fa-briefcase"></i>
                            <span>${categoryNames[project.category]}</span>
                        </div>
                        ${relatedPlan ? `
                        <div class="detail-row">
                            <i class="fas fa-lightbulb"></i>
                            <span>${relatedPlan.name}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <i class="fas fa-tasks"></i>
                            <span>${totalTasks} 个任务 (${completedTasks} 完成)</span>
                        </div>
                        <div class="detail-row ${deadlineClass}">
                            <i class="fas fa-clock"></i>
                            <span>${deadlineText}</span>
                        </div>
                    </div>

                    <div class="project-footer">
                        <div class="project-meta">
                            <span class="status status-${project.status}">${statusNames[project.status]}</span>
                            <span class="priority priority-${project.priority}">${priorityNames[project.priority]}</span>
                        </div>
                        <div class="project-actions">
                            <button class="project-action-btn" onclick="event.stopPropagation(); editProject('${project.id}')" title="编辑">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="project-action-btn" onclick="event.stopPropagation(); deleteProject('${project.id}')" title="删除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染记录
function renderRecords() {
    const container = document.getElementById('recordList');

    if (records.length === 0) {
        container.innerHTML = '<p class="no-data">暂无记录</p>';
        return;
    }

    container.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-info">
                <h4>${record.name}</h4>
                <div class="record-meta">
                    <span class="record-size">${(record.size / 1024).toFixed(1)} KB</span>
                    <span class="record-date">${new Date(record.uploadDate).toLocaleDateString('zh-CN')}</span>
                </div>
            </div>
            <div class="record-actions">
                <button class="record-action-btn" onclick="viewRecord('${record.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="record-action-btn" onclick="downloadRecord('${record.id}')" title="下载">
                    <i class="fas fa-download"></i>
                </button>
                <button class="record-action-btn" onclick="deleteRecord('${record.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 更新项目计划选项
function updateProjectPlanOptions() {
    const select = document.getElementById('projectPlan');
    if (!select) return;

    const currentValue = select.value;
    const validPlans = plans.filter(plan => plan.id); // 过滤掉无效的计划

    select.innerHTML = '<option value="">不关联计划</option>' +
        validPlans.map(plan => `<option value="${plan.id}">${plan.name}</option>`).join('');

    // 如果之前选择的计划仍然有效，保持选中状态
    if (currentValue && validPlans.some(plan => plan.id === currentValue)) {
        select.value = currentValue;
    } else {
        select.value = '';
    }
}

// 模态框功能
function showAddPlanModal() {
    currentEditingPlan = null;
    currentPlanImageData = null;
    document.getElementById('planModalTitle').textContent = '新建计划';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').classList.add('show');
}

function closePlanModal() {
    currentEditingPlan = null;
    currentPlanImageData = null;
    document.getElementById('planModal').classList.remove('show');
    document.getElementById('planForm').reset();

    // 重置图片预览
    const preview = document.getElementById('planImagePreview');
    preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
    preview.classList.remove('has-image');
    document.getElementById('planImage').value = '';
}

function showAddProjectModal() {
    currentEditingProject = null;
    currentProjectImageData = null;
    document.getElementById('modalTitle').textContent = '新建项目';
    document.getElementById('projectForm').reset();
    updateProjectPlanOptions();
    document.getElementById('projectModal').classList.add('show');
}

function closeProjectModal() {
    currentEditingProject = null;
    currentProjectImageData = null;
    document.getElementById('projectModal').classList.remove('show');
    document.getElementById('projectForm').reset();

    // 重置图片预览
    const preview = document.getElementById('projectImagePreview');
    preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
    preview.classList.remove('has-image');
    document.getElementById('projectImage').value = '';
}

function closeTaskModal() {
    currentEditingTask = null;
    document.getElementById('taskModal').classList.remove('show');
    document.getElementById('taskForm').reset();
}

function showAddTaskModal() {
    currentEditingTask = null;
    document.getElementById('taskModalTitle').textContent = '新建任务';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').classList.add('show');
}

// 查看记录
function viewRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    if (record.type === 'application/pdf') {
        window.open(record.path, '_blank');
    } else {
        window.open(record.path, '_blank');
    }
}

// 下载记录
function downloadRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const link = document.createElement('a');
    link.href = record.path;
    link.download = record.name;
    link.click();
}

// 删除记录 (服务器版本)
async function deleteRecord(recordId) {
    if (confirm('确定要删除这个记录吗？')) {
        try {
            const success = await dataManager.deleteRecord(recordId);
            if (success) {
                await loadFromLocalStorage();
                showNotification('记录删除成功！', 'success');
            } else {
                showNotification('删除失败，请重试', 'error');
            }
        } catch (error) {
            console.error('记录删除错误:', error);
            showNotification('删除失败，请检查网络连接', 'error');
        }
    }
}

// 页面导航
function switchPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // 显示目标页面
    document.getElementById(pageName + 'Page').classList.remove('hidden');

    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
}

// 筛选功能
function filterPlans() {
    const searchTerm = document.getElementById('planSearch').value.toLowerCase();
    const statusFilter = document.getElementById('planStatusFilter').value;

    const filteredPlans = plans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm) ||
                             (plan.description && plan.description.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const container = document.getElementById('allPlansGrid');
    if (filteredPlans.length === 0) {
        container.innerHTML = '<p class="no-data">没有找到匹配的计划</p>';
        return;
    }

    // 使用渲染函数显示筛选结果
    const originalPlans = plans;
    plans = filteredPlans;
    renderPlans();
    plans = originalPlans;
}

function filterProjects() {
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                             (project.description && project.description.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
        return matchesSearch && matchesStatus && matchesCategory;
    });

    const container = document.getElementById('allProjectsGrid');
    if (filteredProjects.length === 0) {
        container.innerHTML = '<p class="no-data">没有找到匹配的项目</p>';
        return;
    }

    // 使用渲染函数显示筛选结果
    const originalProjects = projects;
    projects = filteredProjects;
    renderProjects();
    projects = originalProjects;
}

// 图片上传处理（带压缩）
function handlePlanImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件！', 'error');
        return;
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
        showNotification('图片文件太大，请选择小于10MB的图片', 'error');
        return;
    }

    compressImage(file, function(compressedDataUrl) {
        currentPlanImageData = compressedDataUrl;
        const preview = document.getElementById('planImagePreview');
        preview.innerHTML = `<img src="${currentPlanImageData}" alt="计划封面图片">`;
        preview.classList.add('has-image');
        showNotification('图片上传成功！', 'success');
    });
}

function handleProjectImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件！', 'error');
        return;
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) { // 10MB限制
        showNotification('图片文件太大，请选择小于10MB的图片', 'error');
        return;
    }

    compressImage(file, function(compressedDataUrl) {
        currentProjectImageData = compressedDataUrl;
        const preview = document.getElementById('projectImagePreview');
        preview.innerHTML = `<img src="${currentProjectImageData}" alt="项目封面图片">`;
        preview.classList.add('has-image');
        showNotification('图片上传成功！', 'success');
    });
}

// 图片压缩函数
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 计算压缩尺寸
            let width = img.width;
            let height = img.height;
            const maxSize = 1920; // 最大尺寸

            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;

            // 绘制压缩后的图片
            ctx.drawImage(img, 0, 0, width, height);

            // 转换为JPEG，质量0.7
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

            // 检查压缩后的大小
            const compressedSize = Math.round(compressedDataUrl.length * 0.75 / 1024); // KB
            console.log(`图片压缩完成: ${Math.round(file.size / 1024)}KB -> ${compressedSize}KB`);

            callback(compressedDataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 文件上传处理
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const record = {
        name: file.name,
        size: file.size,
        type: file.type,
        path: URL.createObjectURL(file)
    };

    try {
        const success = await dataManager.addRecord(record);
        if (success) {
            await loadFromLocalStorage();
            showNotification('文件上传成功！', 'success');
        } else {
            showNotification('上传失败，请重试', 'error');
        }
    } catch (error) {
        console.error('文件上传错误:', error);
        showNotification('上传失败，请检查网络连接', 'error');
    }

    // 清空文件输入
    e.target.value = '';
}

// 备份文件上传处理
async function handleBackupFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 确认是否覆盖现有数据
    if (plans.length > 0 || projects.length > 0) {
        const confirmed = confirm('恢复数据将覆盖当前的计划和项目，确定要继续吗？');
        if (!confirmed) {
            e.target.value = '';
            return;
        }
    }

    try {
        const success = await dataManager.importData(file);
        if (success) {
            await loadFromLocalStorage();
            showNotification('数据恢复成功！', 'success');
        } else {
            showNotification('数据恢复失败，请检查文件格式', 'error');
        }
    } catch (error) {
        console.error('数据恢复错误:', error);
        showNotification('数据恢复失败，请检查网络连接', 'error');
    }

    // 清空文件输入
    e.target.value = '';
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 注意：表单提交事件监听器由server_index.html处理
    // 这里只绑定其他事件监听器
    document.getElementById('recordFileInput').addEventListener('change', handleFileUpload);
    document.getElementById('backupFileInput').addEventListener('change', handleBackupFileUpload);
    document.getElementById('planImage').addEventListener('change', handlePlanImageUpload);
    document.getElementById('projectImage').addEventListener('change', handleProjectImageUpload);

    // 导航按钮事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPage(this.dataset.page);
        });
    });

    // 筛选功能事件
    document.getElementById('planSearch').addEventListener('input', filterPlans);
    document.getElementById('planStatusFilter').addEventListener('change', filterPlans);
    document.getElementById('projectSearch').addEventListener('input', filterProjects);
    document.getElementById('statusFilter').addEventListener('change', filterProjects);
    document.getElementById('categoryFilter').addEventListener('change', filterProjects);

    // 头部按钮事件
    document.getElementById('addPlanBtn').addEventListener('click', showAddPlanModal);
    document.getElementById('addProjectBtn').addEventListener('click', showAddProjectModal);

    // 模态框点击外部关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
});

console.log('🎨 UI功能模块已加载');