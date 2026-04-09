const auth = {
    checkRole: (allowedRoles) => {
        const user = api.getCurrentUser();

        if (!user) {
            window.location.href = '../login.html';
            return false;
        }

        if (!allowedRoles.includes(user.role)) {
            alert('У вас нет доступа к этой секции');
            window.location.href = '../index.html';
            return false;
        }   

        return true;
    },

    logout: () => {
        api.clearUserData();
        window.location.href = '../index.html';
    },

    checkPageAccess: (pageRole) => {
        return auth.checkRole([pageRole]);
    },

    protectedRoutes: {
        student: ['dashboard.html', 'diary.html', 'diary-form.html', 'attendance.html', 'characteristic.html', 'choose-practice.html'],
        partner: ['dashboard.html', 'students.html', 'confirm-attendance.html', 'review-diary.html', 'feedback.html'],
        admin: ['dashboard.html', 'users.html', 'user-form.html', 'practices.html', 'practice-form.html', 'reports.html']
    },

    initAccessCheck: async () => {
        const token = localStorage.getItem('practday_token');
        const currentPath = window.location.pathname;

        // Список публичных страниц
        const isPublicPage = currentPath.endsWith('index.html') || 
                             currentPath.endsWith('login.html') || 
                             currentPath.endsWith('register.html') ||
                             currentPath === '/'; 

        if (!token) {
            if (!isPublicPage) {
                console.warn("Доступ запрещен: токен отсутствует");
                window.location.href = '../login.html';
            }
            return; 
        }

        try {
            const response = await fetch('http://localhost:3000/api/verify-token', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Token invalid');

            const data = await response.json();

            // Редирект залогиненного юзера с публичных страниц в кабинет
            if (currentPath.endsWith('login.html') || currentPath.endsWith('register.html')) {
                window.location.href = `${data.role}/dashboard.html`;
                return;
            }

            // Проверка прав доступа к секциям
            const isStudentSection = currentPath.includes('/student/');
            const isPartnerSection = currentPath.includes('/partner/');
            const isAdminSection = currentPath.includes('/admin/');

            let accessDenied = false;
            if (isAdminSection && data.role !== 'admin') accessDenied = true;
            if (isPartnerSection && data.role !== 'partner') accessDenied = true;
            if (isStudentSection && data.role !== 'student') accessDenied = true;

            if (accessDenied) {
                alert(`У вас нет прав доступа к этому разделу`);
                window.location.href = `../${data.role}/dashboard.html`;
            }

        } catch (error) {
            console.error("Ошибка верификации:", error);
            if (!isPublicPage) {
                api.clearUserData();
                window.location.href = '../login.html';
            }
        }
    } // Конец функции initAccessCheck
}; // Конец объекта auth

// Запуск проверки
auth.initAccessCheck();