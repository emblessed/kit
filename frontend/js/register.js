/**
 * Функция переключения интерфейса в зависимости от выбранной роли
 */
function updateRoleUI(input) {
    // Управляем активным классом для визуального выделения карточек ролей
    document.querySelectorAll('.role-option').forEach(opt => {
        opt.classList.remove('active');
    });

    if (input.checked) {
        input.closest('.role-option').classList.add('active');
    }

    const nameLabel = document.getElementById('name-label');
    const fullNameInput = document.getElementById('full-name');
    const groupContainer = document.getElementById('group-container');
    const groupInput = document.getElementById('group');

    if (input.value === 'student') {
        if (nameLabel) nameLabel.innerText = 'ФАМИЛИЯ И ИМЯ';
        if (fullNameInput) fullNameInput.placeholder = 'Иван Иванов';
        if (groupContainer) groupContainer.style.display = 'block';
        if (groupInput) groupInput.required = true;
    } else {
        if (nameLabel) nameLabel.innerText = 'НАЗВАНИЕ КОМПАНИИ';
        if (fullNameInput) fullNameInput.placeholder = 'ООО "Название компании"';
        if (groupContainer) groupContainer.style.display = 'none';
        if (groupInput) {
            groupInput.required = false;
            groupInput.value = '';
        }
    }
}

/**
 * Логика проверки существования Email
 */
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');
const submitBtn = document.querySelector('.btn-primary');

if (emailInput) {
    emailInput.addEventListener('blur', async () => {
        const email = emailInput.value.trim();
        
        if (email === "") {
            resetEmailStatus();
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/check-email?email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (data.exists) {
                emailError.style.display = 'block';
                emailInput.style.borderColor = '#ff4d4d';
                submitBtn.disabled = true; 
                submitBtn.style.opacity = '0.5';
            } else {
                resetEmailStatus();
            }
        } catch (error) {
            console.error("Ошибка проверки почты:", error);
        }
    });

    emailInput.addEventListener('input', resetEmailStatus);
}

function resetEmailStatus() {
    if (emailError) emailError.style.display = 'none';
    if (emailInput) emailInput.style.borderColor = '';
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
}

/**
 * Обработка отправки формы регистрации
 */
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ВАЖНО: Очищаем старые данные (токен админа), чтобы не было конфликтов
        localStorage.clear(); 

        const role = document.querySelector('input[name="role"]:checked').value;
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const nameValue = document.getElementById('full-name').value.trim();
        
        const groupInput = document.getElementById('group');
        const groupValue = groupInput ? groupInput.value.trim() : "";

        // Формируем объект данных в зависимости от роли
        let details = {};
        if (role === 'student') {
            details = {
                fullName: nameValue,
                group: groupValue || "Не указана" 
            };
        } else if (role === 'partner') {
            details = {
                companyName: nameValue,
                inn: "0000000000" // Заглушка, если ИНН не введен
            };
        }

        const userData = {
            email: email.toLowerCase(),
            password: password,
            role: role,
            details: details
        };

        console.log('Отправка данных на регистрацию:', userData);

        try {
            const response = await fetch('http://localhost:3000/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Аккаунт успешно создан! Теперь войдите под своими данными.');

                window.location.href = 'login.html'; 
            } else {
                alert('Ошибка регистрации: ' + (result.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса:', error);
            alert('Не удалось связаться с сервером. Проверьте, запущен ли бэкенд.');
        }
    });
}