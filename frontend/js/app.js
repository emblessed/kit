// Главный файл приложения
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Настройка форм
    initForms();
    
    // Настройка навигации
    initNavigation();
    
    // Автоматическое скрытие уведомлений
    initAlerts();
}

function initForms() {
    // Форма логина
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const result = await auth.login(email, password);
            if (!result.success) {
                auth.showMessage(result.error, 'error');
            }
        });
    }
    
    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password_confirm').value;
            
            if (password !== passwordConfirm) {
                auth.showMessage('Пароли не совпадают', 'error');
                return;
            }
            
            const formData = {
                role: document.getElementById('role').value,
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: password
            };
            
            if (formData.role === 'student') {
                formData.group_name = document.getElementById('group_name').value;
                formData.specialty = document.getElementById('specialty').value;
                formData.course = document.getElementById('course').value;
            } else {
                formData.organization = document.getElementById('organization').value;
                formData.address = document.getElementById('address').value;
            }
            
            const result = await auth.register(formData);
            if (!result.success) {
                auth.showMessage(result.error, 'error');
            }
        });
    }
    
    // Форма восстановления пароля
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            try {
                await api.post('/auth/forgot-password', { email });
                auth.showMessage('Инструкции отправлены на email', 'success');
            } catch (error) {
                auth.showMessage(error.message, 'error');
            }
        });
    }
}

function initNavigation() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => auth.logout());
    }
    
    // Переключение вкладок (для страницы отметки)
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('offlineTab').style.display = type === 'offline' ? 'block' : 'none';
                document.getElementById('onlineTab').style.display = type === 'online' ? 'block' : 'none';
            });
        });
    }
    
    // Переключение полей при регистрации
    const roleSelect = document.getElementById('role');
    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            const isStudent = roleSelect.value === 'student';
            document.getElementById('studentFields').style.display = isStudent ? 'block' : 'none';
            document.getElementById('partnerFields').style.display = isStudent ? 'none' : 'block';
        });
    }
}

function initAlerts() {
    setTimeout(() => {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        });
    }, 5000);
    
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.remove();
        });
    });
}