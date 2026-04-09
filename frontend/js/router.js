class Router {
    constructor() {
        this.init();
    }

    init() {
        // Проверяем авторизацию на защищённых страницах
        const currentPath = window.location.pathname;
        
        // Защищённые маршруты
        const studentPaths = ['/student/', '/student/dashboard', '/student/diary', '/student/attendance', '/student/characteristic'];
        const partnerPaths = ['/partner/'];
        const adminPaths = ['/admin/'];
        
        // Проверка для студенческих страниц
        if (studentPaths.some(path => currentPath.includes(path))) {
            if (!auth.checkRole([ROLES.STUDENT])) return;
            this.loadStudentData();
        }
        
        // Проверка для партнёрских страниц
        if (partnerPaths.some(path => currentPath.includes(path))) {
            if (!auth.checkRole([ROLES.PARTNER])) return;
            this.loadPartnerData();
        }
        
        // Проверка для админских страниц
        if (adminPaths.some(path => currentPath.includes(path))) {
            if (!auth.checkRole([ROLES.ADMIN])) return;
            this.loadAdminData();
        }
        
        // Загрузка данных для текущей страницы
        this.loadPageData(currentPath);
    }

    async loadStudentData() {
        const user = api.getCurrentUser();
        if (user) {
            document.getElementById('studentName')?.addEventListener
            this.updateStudentUI(user);
            await this.loadStudentStats();
            await this.loadActivePractice();
        }
    }

    async loadStudentStats() {
        try {
            const stats = await api.get('/student/stats');
            document.getElementById('totalHours').textContent = stats.total_hours || 0;
            document.getElementById('attendanceRate').textContent = `${stats.attendance_rate || 0}%`;
            document.getElementById('diaryEntries').textContent = stats.diary_entries || 0;
            document.getElementById('feedbackScore').textContent = stats.feedback_score || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadActivePractice() {
        try {
            const practice = await api.get('/student/active-practice');
            const container = document.getElementById('activePractice');
            if (container && practice) {
                container.innerHTML = `
                    <div class="practice-info">
                        <div class="info-row"><strong>Название:</strong> ${practice.name}</div>
                        <div class="info-row"><strong>Организация:</strong> ${practice.organization}</div>
                        <div class="info-row"><strong>Формат:</strong> ${practice.format === 'offline' ? 'Очно' : 'Заочно'}</div>
                        <div class="info-row"><strong>Период:</strong> ${practice.start_date} - ${practice.end_date}</div>
                        <div class="info-row"><strong>Статус:</strong> <span class="status-badge status-${practice.status}">${practice.status === 'approved' ? 'Утверждена' : 'На рассмотрении'}</span></div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading practice:', error);
        }
    }

    updateStudentUI(user) {
        const nameElement = document.getElementById('studentName');
        const groupElement = document.getElementById('studentGroup');
        
        if (nameElement) nameElement.textContent = `Добро пожаловать, ${user.full_name}!`;
        if (groupElement) groupElement.textContent = `Группа: ${user.group_name || 'не указана'}`;
    }

    async loadPartnerData() {
        const user = api.getCurrentUser();
        if (user) {
            document.getElementById('partnerName').textContent = `Добро пожаловать, ${user.full_name}!`;
            document.getElementById('organizationName').textContent = user.organization_name;
            await this.loadPartnerStats();
        }
    }

    async loadPartnerStats() {
        try {
            const stats = await api.get('/partner/stats');
            document.getElementById('studentsCount').textContent = stats.students_count || 0;
            document.getElementById('pendingConfirmations').textContent = stats.pending_confirmations || 0;
            document.getElementById('pendingDiary').textContent = stats.pending_diary || 0;
            document.getElementById('avgRating').textContent = stats.avg_rating || 0;
        } catch (error) {
            console.error('Error loading partner stats:', error);
        }
    }

    async loadAdminData() {
        const user = api.getCurrentUser();
        if (user) {
            await this.loadAdminStats();
            await this.loadRecentUsers();
            await this.loadPendingPractices();
        }
    }

    async loadAdminStats() {
        try {
            const stats = await api.get('/admin/stats');
            document.getElementById('totalUsers').textContent = stats.total_users || 0;
            document.getElementById('totalStudents').textContent = stats.total_students || 0;
            document.getElementById('totalPartners').textContent = stats.total_partners || 0;
            document.getElementById('totalPractices').textContent = stats.total_practices || 0;
            document.getElementById('pendingPractices').textContent = stats.pending_practices || 0;
            document.getElementById('pendingDiary').textContent = stats.pending_diary || 0;
        } catch (error) {
            console.error('Error loading admin stats:', error);
        }
    }

    async loadRecentUsers() {
        try {
            const users = await api.get('/admin/recent-users');
            const tbody = document.querySelector('#recentUsersTable tbody');
            if (tbody && users) {
                tbody.innerHTML = users.map(user => `
                    <tr>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>${user.created_at}</td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadPendingPractices() {
        try {
            const practices = await api.get('/admin/pending-practices');
            const container = document.getElementById('pendingPracticesList');
            if (container && practices) {
                container.innerHTML = practices.map(p => `
                    <div class="practice-request">
                        <div class="request-info">
                            <strong>${p.student_name}</strong> - ${p.practice_name}
                            <span class="request-date">${p.created_at}</span>
                        </div>
                        <button onclick="approvePractice(${p.id})" class="btn btn-primary btn-small">Утвердить</button>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading practices:', error);
        }
    }

    loadPageData(path) {
        // Загрузка специфичных данных для страницы
        if (path.includes('attendance')) {
            this.loadAttendanceData();
        }
        if (path.includes('diary')) {
            this.loadDiaryEntries();
        }
        if (path.includes('users')) {
            this.loadUsersList();
        }
        if (path.includes('practices')) {
            this.loadPracticesList();
        }
    }

    async loadAttendanceData() {
        try {
            const practices = await api.get('/student/practices');
            const select = document.getElementById('practiceSelect');
            if (select && practices) {
                select.innerHTML = '<option value="">Выберите практику</option>' +
                    practices.map(p => `
                        <option value="${p.id}" data-lat="${p.latitude}" data-lng="${p.longitude}" data-name="${p.name}" data-org="${p.organization}">
                            ${p.name} - ${p.organization}
                        </option>
                    `).join('');
            }
        } catch (error) {
            console.error('Error loading practices:', error);
        }
    }

    async loadDiaryEntries() {
        try {
            const entries = await api.get('/student/diary');
            const container = document.getElementById('diaryEntries');
            if (container && entries) {
                container.innerHTML = entries.map(entry => `
                    <div class="entry-item">
                        <div class="entry-date">${entry.date}</div>
                        <div class="entry-work">${entry.work_description}</div>
                        <div class="entry-status ${entry.confirmed ? 'confirmed' : 'pending'}">
                            ${entry.confirmed ? '✓ Подтверждено' : '⏳ Ожидает'}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading diary:', error);
        }
    }

    async loadUsersList() {
        try {
            const users = await api.get('/admin/users');
            const tbody = document.querySelector('#usersTable tbody');
            if (tbody && users) {
                tbody.innerHTML = users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.full_name}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>
                            <button onclick="deleteUser(${user.id})" class="btn-danger">Удалить</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    async loadPracticesList() {
        try {
            const practices = await api.get('/admin/practices');
            const tbody = document.querySelector('#practicesTable tbody');
            if (tbody && practices) {
                tbody.innerHTML = practices.map(p => `
                    <tr>
                        <td>${p.name}</td>
                        <td>${p.organization}</td>
                        <td>${p.format}</td>
                        <td>${p.start_date} - ${p.end_date}</td>
                        <td><span class="status-badge status-${p.status}">${p.status}</span></td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading practices:', error);
        }
    }
}

// Инициализация роутера при загрузке страницы
const router = new Router();

// Глобальные функции для кнопок
window.approvePractice = async (id) => {
    try {
        await api.post(`/admin/practices/${id}/approve`);
        location.reload();
    } catch (error) {
        auth.showMessage(error.message, 'error');
    }
};

window.deleteUser = async (id) => {
    if (confirm('Удалить пользователя?')) {
        try {
            await api.delete(`/admin/users/${id}`);
            location.reload();
        } catch (error) {
            auth.showMessage(error.message, 'error');
        }
    }
};