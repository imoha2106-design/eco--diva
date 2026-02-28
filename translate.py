import os

html_path = 'c:/Users/101127503349/OneDrive/хакатон/сайт/index.html'
js_path = 'c:/Users/101127503349/OneDrive/хакатон/сайт/script.js'
manifest_path = 'c:/Users/101127503349/OneDrive/хакатон/сайт/manifest.json'

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = f.read()
manifest = manifest.replace('"ECODIVA Petropavl"', '"ECODIVA Петропавловск"')
manifest = manifest.replace('"A comprehensive Smart Eco-City monitoring application"', '"Комплексное приложение для мониторинга умного эко-города"')
with open(manifest_path, 'w', encoding='utf-8') as f:
    f.write(manifest)

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

reps_html = {
    'EcoCity | Smart Environmental Dashboard': 'EcoCity | Умная экологическая панель',
    'A comprehensive Smart Eco-City monitoring application featuring real-time AQI, AI Trend Analysis, Active Citizen Tools, Eco-Community, and Smart Infrastructure.': 'Комплексное приложение умного эко-города: ИКВ, ИИ-анализ трендов, инструменты активного горожанина, эко-сообщество и умная инфраструктура.',
    'Join the smart environmental community': 'Присоединяйтесь к умному экологическому сообществу',
    'Welcome Back': 'С возвращением',
    '>Welcome<': '>С<',
    '>Back<': '>возвращением<',
    'Email</label>': 'Email</label>',
    '> Password</label>': '> Пароль</label>',
    'Enter</button>': 'Войти</button>',
    'Don\'t have an account?': 'Нет аккаунта?',
    '>Create Account<': '>Создать аккаунт<',
    '>Create<': '>Создать<',
    '>Eco-Passport<': '>Эко-Паспорт<',
    'Full Name': 'Полное имя',
    'Your Name': 'Ваше Имя',
    'Min 6 characters': 'Мин 6 символов',
    'We\'ve sent a': 'Мы отправили',
    '6-digit code to your email. Please enter it below.': '6-значный код на ваш email. Введите его ниже.',
    'Verification Code</label>': 'Код подтверждения</label>',
    'Verify & Create Account': 'Подтвердить и Создать Аккаунт',
    'Already have an account?': 'Уже есть аккаунт?',
    '>Sign In<': '>Войти<',

    'Monitoring & Analysis': 'Мониторинг и анализ',
    '>Real-time Dashboard<': '>Панель управления<',
    '>Eco-Sim Heatmap<': '>Тепловая карта Эко-Сим<',
    '>AI Trend Analysis<': '>ИИ-анализ трендов<',
    '>Active Citizen<': '>Активный горожанин<',
    '>Report Violation<': '>Сообщить о нарушении<',
    '>Green Route<': '>Зеленый маршрут<',
    '>AR Street View<': '>AR-просмотр улиц<',
    '>Community & Infra<': '>Сообщество и инфраструктура<',
    '>Eco-Passport<': '>Эко-Паспорт<',
    '>Smart Bins<': '>Умные урны<',
    'current-user-name">User<': 'current-user-name">Пользователь<',
    '>Eco-Citizen<': '>Эко-гражданин<',
    '> Logout<': '> Выйти<',

    'Welcome back,': 'С возвращением,',
    '>User<': '>Пользователь<',
    'Here\'s what\'s happening in your city today.': 'Вот что происходит в вашем городе сегодня.',
    'Search districts, reports, or sensors...': 'Поиск районов, отчетов или датчиков...',
    'Air Quality Index': 'Индекс качества воздуха',
    '>Safe Mode<': '>Безопасный режим<',
    'Loading...': 'Загрузка...',
    'Fetching real-time air quality data for Petropavl...': 'Загрузка данных о качестве воздуха в реальном времени для Петропавловска...',

    '>AI Clean Air Predictions<': '>ИИ-прогнозы чистоты воздуха<',
    '>24h Forecast<': '>Прогноз на 24 часа<',
    '>7 Days<': '>На 7 дней<',
    'Pollution expected to rise by 15% during rush hour': 'Загрязнение увеличится на 15% в час пик',
    '(17:00-19:00)': '(17:00-19:00)',

    '>System Alerts<': '>Системные уведомления<',

    '>View Leaderboard<': '>Таблица лидеров<',
    'CO₂ Saved': 'Сэкономлено CO₂',
    '>Recycled<': '>Переработано<',
    'Sorting Master': 'Мастер сортировки',
    'Velo-Ninja': 'Вело-Ниндзя',
    'Eco-Patrol': 'Эко-Патруль',
    'Next: <strong>Eco-Patrol</strong>': 'Следующий: <strong>Эко-Патруль</strong>',
    'Unlock 10% Public Transit Credit at 100%': 'Скидка 10% на транспорт при 100%',

    '>Territory Pollution Analysis<': '>Анализ загрязнения территории<',
    'Territory Average (V̄)': 'Среднее по территории (V̄)',
    'Trees Planted': 'Посажено деревьев',
    'Factories Built': 'Построено фабрик',
    'Critical Condition! Average AQI exceeds safe threshold.': 'Критическое состояние! ИКВ превышает безопасный порог.',
    '>Plant Tree<': '>Посадить дерево<',
    '>Build Factory<': '>Построить фабрику<',
    '> Reset Simulation<': '> Сбросить симуляцию<',

    '>PM2.5 Trend Forecast<': '>Прогноз тренда PM2.5<',
    '>AI Insights<': '>ИИ-прогнозы<',
    'Best Window: Tomorrow 6-9 AM': 'Окно чистоты: Завтра 6-9 утра',
    'PM2.5 will drop to 18 µg/m³ due to overnight rain and low traffic. Ideal': 'PM2.5 упадет до 18 мкг/м³ из-за ночного дождя. Идеально',
    'for outdoor exercise.': 'для утренней пробежки.',
    '"Black Day" Risk: Thursday': 'Риск «Черного неба»: Четверг',
    'Industrial wind shift predicted. PM2.5 may reach 120 µg/m³. Masks advised': 'Прогнозируется перемена ветра. PM2.5 может достичь 120 мкг/м³. Рекомендуются маски',
    'from 14:00.': 'с 14:00.',
    'Weekly Trend: -20% PM2.5': 'Недельный тренд: -20% PM2.5',
    'AI predicts a significant drop midweek due to expected rainfall and': 'ИИ прогнозирует значительное снижение в середине недели из-за дождей и',
    'reduced': 'снижения',
    'traffic.': 'трафика.',
    'Park Zone: Safe All Week': 'Парковая зона: Безопасно',
    'Central Park maintains AQI below 35. Green Route through the park is': 'Центральный парк сохраняет ИКВ ниже 35. Ежедневно рекомендуется Зеленый маршрут через',
    'recommended daily.': 'парк.',

    '>Capture Evidence<': '>Сделать фото нарушения<',
    '>Click to upload photo<': '>Нажмите, чтобы загрузить фото<',
    'AI will auto-classify: Trash, Smoke, or Road': 'ИИ классифицирует: мусор, дым или дороги',
    'violation</small>': 'нарушение</small>',
    '>Report Details<': '>Детали нарушения<',
    'Violation': 'Нарушение',
    'Category</label>': 'Категория</label>',
    '🗑️ Illegal Dumping': '🗑️ Незаконная свалка',
    '💨 Air Pollution / Smoke': '💨 Загрязнение воздуха / Дым',
    '🚧 Road Damage': '🚧 Повреждение дороги',
    '💧 Water Contamination': '💧 Загрязнение воды',
    '🔊 Noise Violation': '🔊 Нарушение тишины',
    'Description</label>': 'Описание</label>',
    'Describe the violation in detail...': 'Опишите нарушение подробно...',
    '> Submit Report<': '> Отправить отчет<',

    'Green Route Eco-Navigator 🌿': 'Эко-Навигатор Зеленого маршрута 🌿',
    'Find the cleanest': 'Найдите самый чистый маршрут',
    'path through the city': 'через город',
    '> AQI Savings<': '> Экономия ИКВ<',
    'Exposure<': 'экспозиции<',
    '>Fast Route <small>': '>Быстрый маршрут <small>',
    '(High': '(Высокий',
    'Traffic)</small>': 'трафик)</small>',
    '>Green Route': '>Зеленый маршрут',
    '(Park Path)</small>': '(Парк)</small>',
    '> Start Eco-Navigation<': '> Начать Эко-Навигатор<',

    'Environmental AR HUD': 'Экологический AR Интерфейс',
    'Scanning local atmosphere...': 'Сканирование местной атмосферы...',
    '> Enable HUD Camera<': '> Включить AR Камеру<',
    '> Ambient AQI<': '> Окружающий ИКВ<',
    '>Moderate<': '>Умеренно<',
    '> Traffic Noise<': '> Шум трафика<',
    '> Emission Source<': '> Источник выбросов<',
    'NO₂ Spike': 'Всплеск NO₂',

    'New': 'Новый',
    'Eco-Citizen</p>': 'Эко-гражданин</p>',
    '> Level 1<': '> Уровень 1<',
    '> Edit Profile<': '> Настройки профиля<',
    '>Avatar': '>Ключ',
    'Seed <small': 'аватара <small',
    '(Type a word to change': '(Введите слово для смены',
    'avatar)</small>': 'аватара)</small>',
    '>Short': '>О',
    'Bio</label>': 'себе</label>',
    'Tell the community about your green journey...': 'Расскажите сообществу о своем эко-пути...',
    '> Save Profile<': '> Сохранить профиль<',
    '>Eco-Level Progress<': '>Прогресс Эко-Уровня<',
    '>Next rank: <': '>Следующий ранг: <',
    '>Eco-Patrol Captain<': '>Капитан Эко-Патруля<',

    '> kg CO₂ Saved<': '> кг CO₂ Сэкономлено<',
    '> kg Recycled<': '> кг Переработано<',
    '> Reports Sent<': '> Отчетов Отправлено<',
    '> Green km<': '> Зеленых км<',
    '>Your Badges<': '>Ваши достижения<',
    '100+ green km': '100+ зеленых км',
    'cycled': 'на велосипеде',
    '30+ kg sorted': '30+ кг',
    'correctly': 'отсортировано',
    '>Eagle': '>Орлиный',
    'Eye<': 'Глаз<',
    '5+ violations': '5+ нарушений',
    'reported': 'зафиксировано',
    '>Tree': '>Защитник',
    'Hugger<': 'Деревьев<',
    'Planted 5': 'Посажено 5',
    'trees in sim': 'деревьев',

    'Smart Bin Monitoring 🗑️': 'Мониторинг умных урн 🗑️',
    'IoT-connected waste bins across the city. Request pickup when bins are nearly full.': 'Урны с IoT по всему городу. Запрашивайте вывоз, когда урны почти полны.'
}

for k, v in reps_html.items():
    html = html.replace(k, v)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

reps_js = {
    "'24h Forecast'": "'Прогноз на 24 часа'",
    "'7 Days'": "'На 7 дней'",
    "'Good Air Quality'": "'Хорошее качество воздуха'",
    '"Pollution dynamics are optimal. Perfect time to open windows or go for a run."': '"Динамика загрязнения оптимальна. Отличное время открыть окна или пойти на пробежку."',
    "'Safe Mode'": "'Безопасный режим'",
    "'Moderate Air Quality'": "'Умеренное качество воздуха'",
    '"Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion."': '"Качество воздуха приемлемо. Чувствительны люди должны ограничить долгое пребывание на улице."',
    "'Unhealthy Air Quality'": "'Нездоровое качество воздуха'",
    '"Health effects possible for sensitive groups. General public less likely affected."': '"Возможны последствия для здоровья чувствительных групп. Обычные люди менее подвержены."',

    'Showing last cached value.': 'Показано последнее кэшированное значение.',
    'Real-time data currently unavailable.': 'Данные в реальном времени временно недоступны.',
    'Loading real-time data...': 'Загрузка данных в реальном времени...',
    'Loading forecast data...': 'Загрузка прогноза...',

    '<strong>AI Insight:</strong>': '<strong>ИИ-прогноз:</strong>',
    'Smog expected later this week with averages hitting': 'Ожидается смог на этой неделе, средние значения достигнут',
    'Clean air week ahead, staying consistently': 'Неделя чистого воздуха впереди, стабильно',
    'below 50 AQI': 'ниже 50 ИКВ',
    'Average week, fluctuating between': 'Обычная неделя, колеблется между',
    'Pollution expected to': 'Ожидается, что',
    'rise by': 'загрязнение вырастет на',
    'over the next 3-4 hours.': 'в течение следующих 3-4 часов.',
    'Conditions improving, expected to': 'Улучшение условий, ожидается',
    'drop by': 'падение на',
    'soon.': 'вскоре.',
    'Air quality expected to remain stable for the next few hours.': 'Ожидается, что качество воздуха останется стабильным в течение нескольких часов.',

    ' Eco-Points': ' Эко-Баллов',
    "|| 'You'": "|| 'Вы'",
    
    "'🚛 Pickup Scheduled'": "'🚛 Вывоз запланирован'",
    "'🔴 Critical — Full!'": "'🔴 Критично — Полная!'",
    "'🟠 Almost Full'": "'🟠 Почти полная'",
    "'🟡 Moderate'": "'🟡 Средне'",
    "'🟢 Low'": "'🟢 Мало'",
    '% full</span>': '% заполнено</span>',
    'Request Pickup</button>': 'Запросить вывоз</button>',
    'Scheduled</button>': 'Запланировано</button>',
    'Healthy</span>': 'В норме</span>',

    'Photo Captured!</p>': 'Фото сделано!</p>',
    'AI classification: Illegal Dumping — 94% confidence': 'ИИ классификация: Незаконная свалка — уверенность 94%',
    'Report Submitted! +25 XP': 'Отчет отправлен! +25 Опыта',
    'Click to capture photo': 'Нажмите, чтобы сделать фото',
    
    "'Eco-Rookie'": "'Эко-Новичок'",
    "'Sorting Master'": "'Мастер сортировки'",
    "'Eco-Citizen'": "'Эко-гражданин'",
    "'Eco-Warrior'": "'Эко-Воин'",
    "'Velo-Ninja'": "'Вело-Ниндзя'",
    "'Eco-Patrol Captain'": "'Капитан Эко-Патруля'",

    '"Black Day" Prediction': 'Прогноз «Черного неба»',
    'AQI exceeds 150. PM2.5 at critical levels. Masks advised.': 'ИКВ превышает 150. Уровень PM2.5 критичен. Рекомендуются маски.',
    'Active Alert': 'Активное уведомление',
    'Smart Bin Routing Optimized': 'Маршрут умных урн оптимизирован',
    'A bin has reached 90% capacity.': 'Урна достигла 90% заполненности.',
    'Just now': 'Только что',
    'Park Air Restored': 'Воздух в парке в норме',
    'AQI restored to safe levels after high period.': 'ИКВ вернулся к безопасным уровням.',
    'System Status: Normal': 'Статус системы: Норма',
    'All city systems are operating within safe parameters.': 'Все городские системы работают в безопасных пределах.',
    'Updated recently': 'Недавно обновлено',
    
    'System Active': 'Система активна',
    'Camera access is required for AR Street View.': 'Требуется доступ к камере для AR-просмотра улиц.',

    "'Incorrect email or password. Please try again.'": "'Неверные учетные данные. Пожалуйста, попробуйте снова.'",
    "'An account with this email already exists.'": "'Аккаунт с таким email уже существует.'",
    "'Password is too weak. Must be at least 6 characters.'": "'Пароль слишком слабый. Минимум 6 символов.'",
    "'Please enter a valid email address.'": "'Пожалуйста, введите корректный email.'",
    "'Network error. Please check your connection.'": "'Ошибка сети. Проверьте подключение.'",
    "'An unexpected error occurred.'": "'Произошла непредвиденная ошибка.'",
    "'Please fill in all fields.'": "'Пожалуйста, заполните все поля.'",
    "'Password must be at least 6 characters.'": "'Пароль должен быть минимум 6 символов.'",
    '"Sending code..."': '"Отправка кода..."',
    '"Generating verification code..."': '"Код подтверждения отправлен"',
    '"Verification code sent to email."': '"Код подтверждения отправлен на email."', 
    '"Failed to send code via EmailJS."': '"Ошибка отправки кода."' ,
    '"Invalid verification code. Please check your email."': '"Неверный код подтверждения. Проверьте email."',
    '"Creating Account..."': '"Создание аккаунта..."',
    "'Account created! Welcome to EcoCity.'": "'Аккаунт создан! Добро пожаловать в EcoCity.'",
    "'Please fill in both email and password.'": "'Пожалуйста, заполните email и пароль.'",
    "'Access granted. Generating dashboard...'": "'Доступ разрешен. Создание панели управления...'",
    
    'AI Analyzing image...': 'Обработка ИИ...',
    '"AI Verified: Violation logged! +20 XP awarded."': '"Проверено ИИ: Нарушение зафиксировано! +20 Опыта начислено."',
    '"AI Verified: Violation logged! (Log in to see XP)"': '"Проверено ИИ: Нарушение зафиксировано! (Войдите, чтобы увидеть опыт)"',

    "'New Community Member'": "'Новый участник'",
    "|| 'Eco-Citizen'": "|| 'Эко-гражданин'"
}

for k, v in reps_js.items():
    js = js.replace(k, v)

js = js.replace("is ${fullBin.fill}% full", "на ${fullBin.fill}% полна")
js = js.replace("Route optimized.", "Маршрут оптимизирован.")
js = js.replace("Level 1", "Уровень 1")
js = js.replace("'Verification code sent'", "'Код подтверждения отправлен'")
js = js.replace("'Invalid credentials'", "'Неверные учетные данные'")
js = js.replace("'Processing by AI...'", "'Обработка ИИ...'")

# Dashboard -> Панель управления mapping:
# Eco-Passport -> Эко-Паспорт
# Report Violation -> Сообщить о нарушении
# Green Route -> Зеленый маршрут
# Settings / Edit Profile -> Настройки профиля
# Air Quality Index -> Индекс качества воздуха
# System Alerts -> Системные уведомления
# AI Clean Air Predictions -> ИИ-прогнозы чистоты воздуха
# Level -> Уровень
# XP -> Опыт
# Avatar Seed -> Ключ аватара
# Short Bio -> О себе
# Achievements -> Достижения

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
