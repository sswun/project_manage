// 全局变量
let plans = [];
let projects = [];
let tasks = [];
let records = [];
let currentEditingPlan = null;
let currentEditingProject = null;
let currentEditingTask = null;
let currentViewingPlan = null;
let currentViewingProject = null;
let currentPlanImageData = null;
let currentProjectImageData = null;

// 本地文件备份功能
class LocalFileBackup {
    constructor() {
        this.backupUrl = null;
        this.init();
    }

    init() {
        // 创建一个用于文件下载的a标签
        this.backupLink = document.createElement('a');
        this.backupLink.style.display = 'none';
        document.body.appendChild(this.backupLink);
    }

    // 保存数据到本地文件
    async saveToLocalFile(silent = false) {
        try {
            const data = {
                plans: plans,
                projects: projects,
                tasks: tasks,
                records: records,
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            };

            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });

            // 生成带时间戳的文件名
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `projects_backup_${timestamp}.json`;

            // 下载文件
            const url = URL.createObjectURL(blob);
            this.backupLink.href = url;
            this.backupLink.download = filename;
            this.backupLink.click();

            // 清理URL对象
            setTimeout(() => URL.revokeObjectURL(url), 100);

            console.log('数据已保存到本地文件:', filename);

            if (!silent) {
                showNotification(`数据已自动备份到文件: ${filename}`, 'success');
            }

            return true;
        } catch (error) {
            console.error('保存到本地文件失败:', error);
            if (!silent) {
                showNotification('自动备份失败，请手动导出数据', 'warning');
            }
            return false;
        }
    }

    // 保存到localStorage（原有功能）
    saveToLocalStorage() {
        localStorage.setItem('projectManagerData', JSON.stringify({
            plans: plans,
            projects: projects,
            tasks: tasks,
            records: records
        }));
    }

    // 从文件恢复数据
    async restoreFromFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (data.plans && data.projects && data.tasks && data.records) {
                plans = data.plans;
                projects = data.projects;
                tasks = data.tasks;
                records = data.records;

                this.saveToLocalStorage();
                updateDashboard();
                renderPlans();
                renderProjects();
                renderRecords();

                showNotification('数据恢复成功！', 'success');
                return true;
            } else {
                showNotification('文件格式不正确', 'error');
                return false;
            }
        } catch (error) {
            console.error('恢复数据失败:', error);
            showNotification('恢复数据失败，请检查文件格式', 'error');
            return false;
        }
    }
}

// 创建备份实例
const localBackup = new LocalFileBackup();

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeEventListeners();
    updateDashboard();
    renderPlans();
    renderProjects();
    renderRecords();
    addExistingRecords();
});

// 初始化事件监听器
function initializeEventListeners() {
    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPage(this.dataset.page);
        });
    });

    // 新建计划按钮
    document.getElementById('addPlanBtn').addEventListener('click', showAddPlanModal);

    // 新建项目按钮
    document.getElementById('addProjectBtn').addEventListener('click', showAddProjectModal);

    // 计划表单提交
    document.getElementById('planForm').addEventListener('submit', handlePlanSubmit);

    // 项目表单提交
    document.getElementById('projectForm').addEventListener('submit', handleProjectSubmit);

    // 任务表单提交
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // 图片上传事件
    document.getElementById('planImage').addEventListener('change', handlePlanImageUpload);
    document.getElementById('projectImage').addEventListener('change', handleProjectImageUpload);

    // 图片预览点击事件
    document.getElementById('planImagePreview').addEventListener('click', () => {
        document.getElementById('planImage').click();
    });

    document.getElementById('projectImagePreview').addEventListener('click', () => {
        document.getElementById('projectImage').click();
    });

    // 搜索和筛选
    document.getElementById('projectSearch').addEventListener('input', filterProjects);
    document.getElementById('statusFilter').addEventListener('change', filterProjects);
    document.getElementById('categoryFilter').addEventListener('change', filterProjects);

    // 计划搜索和筛选
    document.getElementById('planSearch').addEventListener('input', filterPlans);
    document.getElementById('planStatusFilter').addEventListener('change', filterPlans);

    // 文件上传
    document.getElementById('recordFileInput').addEventListener('change', handleFileUpload);

    // 备份文件恢复监听器
    document.getElementById('backupFileInput').addEventListener('change', handleBackupFileUpload);

    // 模态框点击外部关闭
    document.getElementById('projectModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeProjectModal();
        }
    });
}

// 页面切换
function switchPage(pageName) {
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    // 显示对应页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    switch(pageName) {
        case 'dashboard':
            document.getElementById('dashboardPage').classList.remove('hidden');
            updateDashboard();
            break;
        case 'plans':
            document.getElementById('plansPage').classList.remove('hidden');
            renderPlans();
            break;
        case 'projects':
            document.getElementById('projectsPage').classList.remove('hidden');
            renderProjects();
            break;
        case 'records':
            document.getElementById('recordsPage').classList.remove('hidden');
            renderRecords();
            break;
    }
}

// 更新仪表盘
function updateDashboard() {
    const totalPlans = plans.length;
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    document.getElementById('totalPlans').textContent = totalPlans;
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('activeProjects').textContent = activeProjects;
    document.getElementById('completedProjects').textContent = completedProjects;

    // 渲染最近计划
    const recentPlans = [...plans]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    const recentPlansGrid = document.getElementById('recentPlansGrid');
    if (recentPlans.length === 0) {
        recentPlansGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-lightbulb"></i>
                <h3>还没有计划</h3>
                <p>点击"新建计划"按钮创建您的第一个计划</p>
            </div>
        `;
    } else {
        recentPlansGrid.innerHTML = recentPlans.map(plan => createPlanCard(plan)).join('');
    }

    // 渲染最近项目
    const recentProjects = [...projects]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    const recentProjectsGrid = document.getElementById('recentProjectsGrid');
    if (recentProjects.length === 0) {
        recentProjectsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <h3>还没有项目</h3>
                <p>点击"新建项目"按钮创建您的第一个项目</p>
            </div>
        `;
    } else {
        recentProjectsGrid.innerHTML = recentProjects.map(project => createProjectCard(project)).join('');
    }
}

// 渲染计划列表
function renderPlans(filteredPlans = null) {
    const planGrid = document.getElementById('allPlansGrid');
    const plansToRender = filteredPlans || plans;

    if (plansToRender.length === 0) {
        planGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-lightbulb"></i>
                <h3>没有找到计划</h3>
                <p>尝试调整筛选条件或创建新计划</p>
            </div>
        `;
        return;
    }

    planGrid.innerHTML = plansToRender.map(plan => createPlanCard(plan)).join('');
}

// 筛选计划
function filterPlans() {
    const searchTerm = document.getElementById('planSearch').value.toLowerCase();
    const statusFilter = document.getElementById('planStatusFilter').value;

    let filteredPlans = plans.filter(plan => {
        const matchesSearch = plan.name.toLowerCase().includes(searchTerm) ||
                            (plan.description && plan.description.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    renderPlans(filteredPlans);
}

// 创建计划卡片
function createPlanCard(plan) {
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

    const projectCount = projects.filter(p => p.planId === plan.id).length;
    const activeProjectCount = projects.filter(p => p.planId === plan.id && p.status === 'active').length;

    return `
        <div class="plan-card status-${plan.status}" onclick="viewPlanDetail('${plan.id}')">
            <div class="plan-header">
                <div>
                    <div class="plan-title">${plan.name}</div>
                    <span class="plan-category">${categoryNames[plan.category]}</span>
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
            <div class="plan-description">${plan.description || '暂无描述'}</div>
            <div class="plan-meta">
                <span class="plan-status ${plan.status}">${statusNames[plan.status]}</span>
                <span><i class="fas fa-project-diagram"></i> ${projectCount} 个项目 (${activeProjectCount} 进行中)</span>
            </div>
            <div class="plan-meta">
                <span><i class="fas fa-calendar"></i> ${plan.startDate ? new Date(plan.startDate).toLocaleDateString('zh-CN') : '未设定'}</span>
                <span><i class="fas fa-clock"></i> ${new Date(plan.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
        </div>
    `;
}

// 显示添加计划模态框
function showAddPlanModal() {
    currentEditingPlan = null;
    document.getElementById('planModalTitle').textContent = '新建计划';
    document.getElementById('planForm').reset();
    document.getElementById('planModal').classList.add('show');
}

// 编辑计划
function editPlan(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    currentEditingPlan = plan;
    currentPlanImageData = plan.image || null;
    document.getElementById('planModalTitle').textContent = '编辑计划';

    document.getElementById('planName').value = plan.name;
    document.getElementById('planDescription').value = plan.description || '';
    document.getElementById('planCategory').value = plan.category;
    document.getElementById('planStatus').value = plan.status;
    document.getElementById('planStartDate').value = plan.startDate || '';
    document.getElementById('planEndDate').value = plan.endDate || '';

    // 显示现有图片
    const preview = document.getElementById('planImagePreview');
    if (plan.image) {
        preview.innerHTML = `<img src="${plan.image}" alt="计划封面图片">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
        preview.classList.remove('has-image');
    }

    document.getElementById('planModal').classList.add('show');
}

// 关闭计划模态框
function closePlanModal() {
    document.getElementById('planModal').classList.remove('show');
    document.getElementById('planForm').reset();
    currentEditingPlan = null;
    currentPlanImageData = null;

    // Reset image preview
    const preview = document.getElementById('planImagePreview');
    preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
    preview.classList.remove('has-image');
    document.getElementById('planImage').value = '';
}

// 处理计划图片上传
function handlePlanImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件！', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        currentPlanImageData = event.target.result;

        const preview = document.getElementById('planImagePreview');
        preview.innerHTML = `<img src="${currentPlanImageData}" alt="计划封面图片">`;
        preview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// 处理项目图片上传
function handleProjectImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件！', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        currentProjectImageData = event.target.result;

        const preview = document.getElementById('projectImagePreview');
        preview.innerHTML = `<img src="${currentProjectImageData}" alt="项目封面图片">`;
        preview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
}

// 处理计划表单提交
function handlePlanSubmit(e) {
    e.preventDefault();

    const planData = {
        name: document.getElementById('planName').value,
        description: document.getElementById('planDescription').value,
        category: document.getElementById('planCategory').value,
        status: document.getElementById('planStatus').value,
        startDate: document.getElementById('planStartDate').value,
        endDate: document.getElementById('planEndDate').value,
        image: currentPlanImageData
    };

    if (currentEditingPlan) {
        // 编辑现有计划
        const index = plans.findIndex(p => p.id === currentEditingPlan.id);
        plans[index] = { ...currentEditingPlan, ...planData };
    } else {
        // 创建新计划
        const newPlan = {
            id: generateId(),
            ...planData,
            createdAt: new Date().toISOString()
        };
        plans.push(newPlan);
    }

    saveToLocalStorage();
    closePlanModal();
    updateDashboard();
    renderPlans();
    updateProjectPlanOptions();

    showNotification(currentEditingPlan ? '计划更新成功！' : '计划创建成功！');
}

// 删除计划
function deletePlan(planId) {
    if (confirm('确定要删除这个计划吗？相关项目将不会被删除。')) {
        plans = plans.filter(p => p.id !== planId);
        // 清除项目中的计划关联
        projects.forEach(project => {
            if (project.planId === planId) {
                project.planId = '';
            }
        });
        saveToLocalStorage();
        updateDashboard();
        renderPlans();
        renderProjects();
        updateProjectPlanOptions();
        showNotification('计划删除成功！');
    }
}

// 查看计划详情
function viewPlanDetail(planId) {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    currentViewingPlan = plan;

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

    // 显示封面图片
    const coverImage = document.getElementById('planCoverImage');
    if (plan.image) {
        coverImage.innerHTML = `<img src="${plan.image}" alt="${plan.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        coverImage.innerHTML = `
            <div class="no-cover-image">
                <i class="fas fa-lightbulb" style="margin-right: 0.5rem;"></i>
                <span>暂无封面图片</span>
            </div>
        `;
    }

    const planInfo = document.querySelector('.plan-detail-info');
    planInfo.innerHTML = `
        <h3 style="color: #ffffff; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">${plan.name}</h3>
        <div class="detail-row">
            <span class="detail-label">分类</span>
            <span class="detail-value">${categoryNames[plan.category]}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value"><span class="plan-status ${plan.status}">${statusNames[plan.status]}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">描述</span>
            <span class="detail-value">${plan.description || '暂无描述'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">开始日期</span>
            <span class="detail-value">${plan.startDate ? new Date(plan.startDate).toLocaleDateString('zh-CN') : '未设定'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">结束日期</span>
            <span class="detail-value">${plan.endDate ? new Date(plan.endDate).toLocaleDateString('zh-CN') : '未设定'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">${new Date(plan.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
    `;

    // 渲染相关项目
    const relatedProjects = projects.filter(p => p.planId === planId);
    const planProjectsList = document.getElementById('planProjectsList');

    if (relatedProjects.length === 0) {
        planProjectsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-project-diagram"></i>
                <h3>还没有相关项目</h3>
                <p>创建项目时可以选择关联到这个计划</p>
            </div>
        `;
    } else {
        planProjectsList.innerHTML = relatedProjects.map(project => `
            <div class="project-list-item" onclick="viewProjectDetail('${project.id}')">
                <div>
                    <div class="project-list-item-title">${project.name}</div>
                    <div class="project-list-item-status project-status ${project.status}">${
                        project.status === 'planning' ? '计划中' :
                        project.status === 'active' ? '进行中' :
                        project.status === 'completed' ? '已完成' : '已暂停'
                    }</div>
                </div>
                <i class="fas fa-chevron-right" style="color: #64748b;"></i>
            </div>
        `).join('');
    }

    document.getElementById('planDetailModal').classList.add('show');
}

// 关闭计划详情模态框
function closePlanDetailModal() {
    document.getElementById('planDetailModal').classList.remove('show');
    currentViewingPlan = null;
}

// 更新项目表单中的计划选项
function updateProjectPlanOptions() {
    const projectPlanSelect = document.getElementById('projectPlan');
    if (!projectPlanSelect) return;

    const currentValue = projectPlanSelect.value;
    projectPlanSelect.innerHTML = '<option value="">不关联计划</option>';

    plans.forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.id;
        option.textContent = plan.name;
        if (plan.id === currentValue) {
            option.selected = true;
        }
        projectPlanSelect.appendChild(option);
    });
}

// 渲染项目列表
function renderProjects(filteredProjects = null) {
    const projectGrid = document.getElementById('allProjectsGrid');
    const projectsToRender = filteredProjects || projects;

    if (projectsToRender.length === 0) {
        projectGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-folder-open"></i>
                <h3>没有找到项目</h3>
                <p>尝试调整筛选条件或创建新项目</p>
            </div>
        `;
        return;
    }

    projectGrid.innerHTML = projectsToRender.map(project => createProjectCard(project)).join('');
}

// 创建项目卡片
function createProjectCard(project) {
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

    const priorityClass = `priority-${project.priority}`;
    const deadlineText = project.deadline ? new Date(project.deadline).toLocaleDateString('zh-CN') : '无截止日期';

    // 获取关联的计划信息
    const relatedPlan = project.planId ? plans.find(p => p.id === project.planId) : null;

    return `
        <div class="project-card status-${project.status}" onclick="viewProjectDetail('${project.id}')">
            <div class="project-header">
                <div>
                    <div class="project-title">${project.name}</div>
                    <span class="project-category">${categoryNames[project.category]}</span>
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
            <div class="project-description">${project.description || '暂无描述'}</div>
            <div class="project-meta">
                <span class="project-status ${project.status}">${statusNames[project.status]}</span>
                <span class="${priorityClass}">优先级: ${project.priority === 'high' ? '高' : project.priority === 'medium' ? '中' : '低'}</span>
            </div>
            <div class="project-meta">
                <span><i class="fas fa-lightbulb"></i> ${relatedPlan ? relatedPlan.name : '无关联计划'}</span>
                <span><i class="fas fa-calendar"></i> ${deadlineText}</span>
            </div>
            <div class="project-meta">
                <span><i class="fas fa-tasks"></i> ${tasks.filter(t => t.projectId === project.id).length} 个任务</span>
                <span><i class="fas fa-clock"></i> ${new Date(project.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
        </div>
    `;
}

// 显示添加项目模态框
function showAddProjectModal() {
    currentEditingProject = null;
    document.getElementById('modalTitle').textContent = '新建项目';
    document.getElementById('projectForm').reset();
    updateProjectPlanOptions();
    document.getElementById('projectModal').classList.add('show');
}

// 编辑项目
function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    currentEditingProject = project;
    currentProjectImageData = project.image || null;
    document.getElementById('modalTitle').textContent = '编辑项目';

    document.getElementById('projectName').value = project.name;
    document.getElementById('projectPlan').value = project.planId || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectCategory').value = project.category;
    document.getElementById('projectStatus').value = project.status;
    document.getElementById('projectPriority').value = project.priority;
    document.getElementById('projectDeadline').value = project.deadline || '';

    // 显示现有图片
    const preview = document.getElementById('projectImagePreview');
    if (project.image) {
        preview.innerHTML = `<img src="${project.image}" alt="项目封面图片">`;
        preview.classList.add('has-image');
    } else {
        preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
        preview.classList.remove('has-image');
    }

    updateProjectPlanOptions();
    document.getElementById('projectModal').classList.add('show');
}

// 关闭项目模态框
function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('show');
    document.getElementById('projectForm').reset();
    currentEditingProject = null;
    currentProjectImageData = null;

    // Reset image preview
    const preview = document.getElementById('projectImagePreview');
    preview.innerHTML = '<i class="fas fa-image"></i><span>点击上传图片</span>';
    preview.classList.remove('has-image');
    document.getElementById('projectImage').value = '';
}

// 处理项目表单提交
function handleProjectSubmit(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        planId: document.getElementById('projectPlan').value,
        description: document.getElementById('projectDescription').value,
        category: document.getElementById('projectCategory').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        deadline: document.getElementById('projectDeadline').value,
        image: currentProjectImageData
    };

    if (currentEditingProject) {
        // 编辑现有项目
        const index = projects.findIndex(p => p.id === currentEditingProject.id);
        projects[index] = { ...currentEditingProject, ...projectData };
    } else {
        // 创建新项目
        const newProject = {
            id: generateId(),
            ...projectData,
            createdAt: new Date().toISOString()
        };
        projects.push(newProject);
    }

    saveToLocalStorage();
    closeProjectModal();
    updateDashboard();
    renderProjects();

    // 显示成功消息
    showNotification(currentEditingProject ? '项目更新成功！' : '项目创建成功！');
}

// 删除项目
function deleteProject(projectId) {
    if (confirm('确定要删除这个项目吗？')) {
        projects = projects.filter(p => p.id !== projectId);
        saveToLocalStorage();
        updateDashboard();
        renderProjects();
        showNotification('项目删除成功！');
    }
}

// 筛选项目
function filterProjects() {
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;

    let filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                            (project.description && project.description.toLowerCase().includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    renderProjects(filteredProjects);
}

// 渲染记录列表
function renderRecords() {
    const recordList = document.getElementById('recordList');

    if (records.length === 0) {
        recordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>还没有工作记录</h3>
                <p>上传您的第一个工作记录文件</p>
            </div>
        `;
        return;
    }

    recordList.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-info">
                <div class="record-title">
                    <i class="fas fa-file-pdf" style="color: #dc3545; margin-right: 0.5rem;"></i>
                    ${record.name}
                </div>
                <div class="record-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date(record.uploadDate).toLocaleDateString('zh-CN')}</span>
                    <span><i class="fas fa-database"></i> ${formatFileSize(record.size)}</span>
                </div>
            </div>
            <div class="record-actions">
                <button class="project-action-btn" onclick="viewRecord('${record.id}')" title="查看">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="project-action-btn" onclick="downloadRecord('${record.id}')" title="下载">
                    <i class="fas fa-download"></i>
                </button>
                <button class="project-action-btn" onclick="deleteRecord('${record.id}')" title="删除">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 处理文件上传
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const record = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        path: URL.createObjectURL(file)
    };

    records.push(record);
    saveToLocalStorage();
    renderRecords();
    showNotification('文件上传成功！');

    // 清空文件输入
    e.target.value = '';
}

// 处理备份文件上传
function handleBackupFileUpload(e) {
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

    // 使用异步处理，不阻塞UI
    localBackup.restoreFromFile(file).then(success => {
        if (success) {
            updateDashboard();
            renderPlans();
            renderProjects();
            renderRecords();
            showNotification('数据恢复成功！', 'success');
        }
    }).catch(error => {
        console.error('数据恢复失败:', error);
        showNotification('数据恢复失败，请检查文件格式', 'error');
    });

    // 清空文件输入
    e.target.value = '';
}

// 查看记录
function viewRecord(recordId) {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    if (record.type === 'application/pdf') {
        window.open(record.path, '_blank');
    } else {
        // 对于其他文件类型，可以创建下载链接
        const link = document.createElement('a');
        link.href = record.path;
        link.download = record.name;
        link.click();
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

// 删除记录
function deleteRecord(recordId) {
    if (confirm('确定要删除这个记录吗？')) {
        records = records.filter(r => r.id !== recordId);
        saveToLocalStorage();
        renderRecords();
        showNotification('记录删除成功！');
    }
}

// 添加现有的PDF记录
function addExistingRecords() {
    // 添加现有的PDF文件到记录列表
    const existingFiles = [
        {
            id: generateId(),
            name: '3天一阶段制工作记录表20251005.pdf',
            size: 107109,
            type: 'application/pdf',
            uploadDate: new Date().toISOString(),
            path: './store/3天一阶段制工作记录表20251005.pdf'
        },
        {
            id: generateId(),
            name: '创意基础与前沿方向20251005.pdf',
            size: 2750350,
            type: 'application/pdf',
            uploadDate: new Date().toISOString(),
            path: './store/创意基础与前沿方向20251005.pdf'
        }
    ];

    // 检查是否已经添加过这些文件
    existingFiles.forEach(file => {
        if (!records.find(r => r.name === file.name)) {
            records.push(file);
        }
    });

    saveToLocalStorage();
}

// 导出数据
function exportData() {
    const data = {
        plans: plans,
        projects: projects,
        tasks: tasks,
        records: records.map(r => ({
            id: r.id,
            name: r.name,
            size: r.size,
            type: r.type,
            uploadDate: r.uploadDate
        })),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `project-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showNotification('数据导出成功！');
}

// 本地存储功能
function saveToLocalStorage() {
    // 简化的localStorage保存，不再自动下载文件
    localStorage.setItem('projectManagerData', JSON.stringify({
        plans: plans,
        projects: projects,
        tasks: tasks,
        records: records
    }));
}

function loadFromLocalStorage() {
    const storedData = localStorage.getItem('projectManagerData');
    if (storedData) {
        try {
            const data = JSON.parse(storedData);
            plans = data.plans || [];
            projects = data.projects || [];
            tasks = data.tasks || [];
            records = data.records || [];
        } catch (e) {
            console.error('Failed to load data from localStorage:', e);
            plans = [];
            projects = [];
            tasks = [];
            records = [];
        }
    } else {
        // 添加一些示例数据
        plans = [
            {
                id: generateId(),
                name: '前端技能提升计划',
                description: '系统学习现代前端开发技术栈，提升个人技术能力',
                category: 'skill',
                status: 'active',
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                createdAt: new Date().toISOString()
            }
        ];

        projects = [
            {
                id: generateId(),
                planId: plans[0].id,
                name: '个人网站重构',
                description: '使用现代前端框架重构个人网站，提升用户体验和性能',
                category: 'personal',
                status: 'active',
                priority: 'high',
                deadline: '2024-12-31',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                planId: plans[0].id,
                name: '学习React框架',
                description: '深入学习React生态系统，包括Hooks、Redux等',
                category: 'study',
                status: 'active',
                priority: 'medium',
                deadline: '2024-11-30',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        tasks = [
            {
                id: generateId(),
                projectId: projects[0].id,
                name: '设计页面原型',
                description: '使用Figma设计新版本的页面原型',
                status: 'completed',
                priority: 'high',
                createdAt: new Date().toISOString()
            },
            {
                id: generateId(),
                projectId: projects[0].id,
                name: '实现响应式布局',
                description: '确保网站在各种设备上都能正常显示',
                status: 'in-progress',
                priority: 'medium',
                createdAt: new Date().toISOString()
            }
        ];
    }
}

// 工具函数
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(40, 167, 69, 0.4);
        z-index: 2000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 查看项目详情
function viewProjectDetail(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    currentViewingProject = project;

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

    // 获取关联的计划信息
    const relatedPlan = project.planId ? plans.find(p => p.id === project.planId) : null;

    // 显示封面图片
    const coverImage = document.getElementById('projectCoverImage');
    if (project.image) {
        coverImage.innerHTML = `<img src="${project.image}" alt="${project.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        coverImage.innerHTML = `
            <div class="no-cover-image">
                <i class="fas fa-project-diagram" style="margin-right: 0.5rem;"></i>
                <span>暂无封面图片</span>
            </div>
        `;
    }

    const projectInfo = document.querySelector('.project-detail-info');
    projectInfo.innerHTML = `
        <h3 style="color: #ffffff; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);">${project.name}</h3>
        <div class="detail-row">
            <span class="detail-label">所属计划</span>
            <span class="detail-value">${relatedPlan ? relatedPlan.name : '无关联计划'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">分类</span>
            <span class="detail-value">${categoryNames[project.category]}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value"><span class="project-status ${project.status}">${statusNames[project.status]}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">优先级</span>
            <span class="detail-value"><span class="priority-${project.priority}">${priorityNames[project.priority]}</span></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">描述</span>
            <span class="detail-value">${project.description || '暂无描述'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">截止日期</span>
            <span class="detail-value">${project.deadline ? new Date(project.deadline).toLocaleDateString('zh-CN') : '未设定'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">${new Date(project.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
    `;

    renderProjectTasks(projectId);
    document.getElementById('projectDetailModal').classList.add('show');
}

// 关闭项目详情模态框
function closeProjectDetailModal() {
    document.getElementById('projectDetailModal').classList.remove('show');
    currentViewingProject = null;
}

// 渲染项目任务
function renderProjectTasks(projectId) {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const tasksList = document.getElementById('projectTasksList');

    if (projectTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>还没有任务</h3>
                <p>点击"添加任务"按钮创建第一个任务</p>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = projectTasks.map(task => createTaskItem(task)).join('');
}

// 创建任务项
function createTaskItem(task) {
    const statusNames = {
        pending: '未完成',
        'in-progress': '进行中',
        completed: '已完成',
        blocked: '受阻'
    };

    const priorityNames = {
        low: '低',
        medium: '中',
        high: '高'
    };

    return `
        <div class="task-item">
            <div class="task-header">
                <div>
                    <div class="task-title">${task.name}</div>
                    <div class="task-description">${task.description || '暂无描述'}</div>
                </div>
                <div class="task-actions">
                    <button class="project-action-btn" onclick="editTask('${task.id}')" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="project-action-btn" onclick="deleteTask('${task.id}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-status ${task.status}" onclick="cycleTaskStatus('${task.id}')">${statusNames[task.status]}</span>
                <span class="task-priority ${task.priority}">${priorityNames[task.priority]}</span>
            </div>
        </div>
    `;
}

// 显示添加任务模态框
function showAddTaskModal() {
    if (!currentViewingProject) return;

    currentEditingTask = null;
    document.getElementById('taskModalTitle').textContent = '新建任务';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModal').classList.add('show');
}

// 编辑任务
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTask = task;
    document.getElementById('taskModalTitle').textContent = '编辑任务';

    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;

    document.getElementById('taskModal').classList.add('show');
}

// 关闭任务模态框
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('show');
    document.getElementById('taskForm').reset();
    currentEditingTask = null;
}

// 处理任务表单提交
function handleTaskSubmit(e) {
    e.preventDefault();
    if (!currentViewingProject) return;

    const taskData = {
        name: document.getElementById('taskName').value,
        description: document.getElementById('taskDescription').value,
        status: document.getElementById('taskStatus').value,
        priority: document.getElementById('taskPriority').value,
        projectId: currentViewingProject.id
    };

    if (currentEditingTask) {
        // 编辑现有任务
        const index = tasks.findIndex(t => t.id === currentEditingTask.id);
        tasks[index] = { ...currentEditingTask, ...taskData };
    } else {
        // 创建新任务
        const newTask = {
            id: generateId(),
            ...taskData,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }

    saveToLocalStorage();
    closeTaskModal();
    renderProjectTasks(currentViewingProject.id);

    showNotification(currentEditingTask ? '任务更新成功！' : '任务创建成功！');
}

// 删除任务
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        tasks = tasks.filter(t => t.id !== taskId);
        saveToLocalStorage();
        if (currentViewingProject) {
            renderProjectTasks(currentViewingProject.id);
        }
        showNotification('任务删除成功！');
    }
}

// 循环切换任务状态
function cycleTaskStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const statusCycle = ['pending', 'in-progress', 'completed', 'blocked'];
    const currentIndex = statusCycle.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statusCycle.length;

    task.status = statusCycle[nextIndex];
    saveToLocalStorage();

    if (currentViewingProject) {
        renderProjectTasks(currentViewingProject.id);
    }

    const statusNames = {
        pending: '未完成',
        'in-progress': '进行中',
        completed: '已完成',
        blocked: '受阻'
    };

    showNotification(`任务状态更新为：${statusNames[task.status]}`);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);