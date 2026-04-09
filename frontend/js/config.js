// API Configuration (будет подключено к бэкенду позже)
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',  // Будет ваш Node.js сервер
    TOKEN_KEY: 'practday_token',
    USER_KEY: 'practday_user',
    GPS_RADIUS: 300
};

// Роли и маршруты
const ROLES = {
    ADMIN: 'admin',
    STUDENT: 'student',
    PARTNER: 'partner'
};

const ROUTES = {
    HOME: '/index.html',
    LOGIN: '/login.html',
    REGISTER: '/register.html',
    FORGOT: '/forgot-password.html',
    RESET: '/reset-password.html',
    STUDENT: {
        DASHBOARD: '/student/dashboard.html',
        DIARY: '/student/diary.html',
        DIARY_FORM: '/student/diary-form.html',
        ATTENDANCE: '/student/attendance.html',
        CHARACTERISTIC: '/student/characteristic.html',
        CHOOSE_PRACTICE: '/student/choose-practice.html'
    },
    PARTNER: {
        DASHBOARD: '/partner/dashboard.html',
        STUDENTS: '/partner/students.html',
        CONFIRM_ATTENDANCE: '/partner/confirm-attendance.html',
        REVIEW_DIARY: '/partner/review-diary.html',
        FEEDBACK: '/partner/feedback.html'
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard.html',
        USERS: '/admin/users.html',
        USER_FORM: '/admin/user-form.html',
        PRACTICES: '/admin/practices.html',
        PRACTICE_FORM: '/admin/practice-form.html',
        REPORTS: '/admin/reports.html'
    }
};