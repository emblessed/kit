// js/partner-attendance.js
document.addEventListener('DOMContentLoaded', fetchAttendance);

/**
 * Получение списка всех отметок студентов для панели партнера
 */
async function fetchAttendance() {
    const list = document.getElementById('attendanceList');
    const counter = document.getElementById('requestCounter');
    const token = localStorage.getItem('practday_token');

    if (!list) return; // Защита, если скрипт подключен не на той странице

    try {
        // Используем BASE_URL из config.js
        const response = await fetch(`${API_CONFIG.BASE_URL}/attendance/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка при загрузке данных');
        
        const logs = await response.json();

        // Считаем только те запросы, которые ожидают подтверждения (pending)
        const pendingLogs = logs.filter(log => log.status === 'pending' || !log.status);
        if (counter) {
            counter.innerText = `${pendingLogs.length} новых запросов`;
        }

        list.innerHTML = ''; // Очищаем контейнер

        if (logs.length === 0) {
            list.innerHTML = '<div class="card p-20 text-center">История посещаемости пуста</div>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
            
            // Проверяем, находится ли студент в радиусе (из конфига)
            const isNear = log.distance <= API_CONFIG.GPS_RADIUS;
            
            const card = `
                <div class="card attendance-card ${log.status === 'confirmed' ? 'confirmed-row' : 'active-request'}">
                    <div class="student-avatar-box">👨‍💻</div>
                    <div class="attendance-info">
                        <h4 class="student-name">${log.studentId?.fullName || 'Имя не указано'}</h4>
                        <p class="student-meta">${log.studentId?.group || 'Группа не указана'}</p>
                        <p class="attendance-details">
                            <span class="status-dot ${isNear ? 'bg-success' : 'bg-error'}"></span> 
                            Прибыл: <strong>${date}</strong> 
                            <span class="distance-tag">(${Math.round(log.distance)}м от офиса)</span>
                        </p>
                    </div>
                    
                    <div class="attendance-actions">
                        ${log.status === 'pending' || !log.status ? `
                            <button class="btn-action approve" onclick="updateStatus('${log._id}', 'confirmed')" title="Подтвердить">✓</button>
                            <button class="btn-action decline" onclick="updateStatus('${log._id}', 'declined')" title="Отклонить">✕</button>
                        ` : `
                            <span class="status-badge ${log.status}">${log.status === 'confirmed' ? 'ПОДТВЕРЖДЕНО' : 'ОТКЛОНЕНО'}</span>
                        `}
                    </div>
                </div>
            `;
            list.insertAdjacentHTML('beforeend', card);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = '<div class="card p-20 text-center text-error">Ошибка загрузки данных. Проверьте соединение с сервером.</div>';
    }
}

/**
 * Смена статуса отметки (Подтверждение/Отклонение)
 * Вызывает PATCH эндпоинт на бэкенде
 */
async function updateStatus(id, newStatus) {
    const token = localStorage.getItem('practday_token');
    
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/attendance/update/${id}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            // Перезагружаем список после успешного обновления
            fetchAttendance();
        } else {
            alert("Не удалось обновить статус");
        }
    } catch (err) {
        console.error("Ошибка обновления:", err);
        alert("Произошла ошибка при отправке данных");
    }
}