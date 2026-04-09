// Координаты вашего учебного центра (г. Павлодар)
const OFFICE_LOCATION = { lat: 52.2873, lng: 76.9671 }; 

async function processAttendance() {
    const btn = document.getElementById('btnMarkAttendance');
    const statusText = document.getElementById('geoStatus');
    
    // Получаем данные из localStorage
    const profile = JSON.parse(localStorage.getItem('practday_profile'));
    const token = localStorage.getItem('practday_token');

    // Проверка авторизации
    if (!profile || !profile._id) {
        alert("Ошибка: Профиль не найден. Пожалуйста, перевойдите в систему.");
        return;
    }

    if (!navigator.geolocation) {
        statusText.innerText = "Геолокация не поддерживается вашим браузером";
        return;
    }

    // Блокируем кнопку на время работы
    btn.disabled = true;
    statusText.innerText = "Определяем ваше местоположение...";

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Считаем дистанцию до офиса
        const distance = calculateDistance(
            latitude, longitude, 
            OFFICE_LOCATION.lat, OFFICE_LOCATION.lng
        );

        try {
            // Отправляем запрос на сервер, используя API_CONFIG.BASE_URL
            const response = await fetch(`${API_CONFIG.BASE_URL}/attendance/log`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentProfileId: profile._id,
                    distance: Math.round(distance)
                })
            });

            if (response.ok) {
                // Визуальное подтверждение успеха
                const locationStatus = distance <= API_CONFIG.GPS_RADIUS ? 'В радиусе офиса' : 'Вне радиуса';
                statusText.innerHTML = `✅ Отметка отправлена! <br> <small>(${locationStatus}, ${Math.round(distance)}м)</small>`;
                btn.style.display = 'none';
            } else {
                throw new Error("Ошибка сервера");
            }
        } catch (err) {
            console.error(err);
            statusText.innerText = "Ошибка при связи с сервером";
            btn.disabled = false;
        }

    }, (error) => {
        console.error(error);
        statusText.innerText = "Не удалось получить доступ к геопозиции";
        btn.disabled = false;
    }, {
        enableHighAccuracy: true, // Запрос высокой точности GPS
        timeout: 10000            // Таймаут 10 секунд
    });
}

// Формула Гаверсинуса для расчета расстояния в метрах
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Радиус Земли в метрах
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}