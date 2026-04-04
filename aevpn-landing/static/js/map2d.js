/**
 * AE VPN — Анимация шифрования данных
 * Визуализация процесса шифрования для пользователя
 */

(function() {
    'use strict';

    const CONFIG = {
        colors: {
            bg: '#050505',
            text: '#ffffff',
            textMuted: 'rgba(255, 255, 255, 0.5)',
            encrypted: '#00ff88',
            danger: '#ef4444',
            success: '#22c55e',
            accent: '#88ccff',
        },
        // Символы для шифрования: цифры, спецсимволы, бинарный код
        scrambleChars: '01*&)#^%$!@~`|{}[]<>?/\\',
    };

    let canvas, ctx;
    let width, height;
    let animationId;
    let time = 0;

    // Состояния анимации
    const states = {
        PLAIN: 0,
        ENCRYPTING: 1,
        ENCRYPTED: 2,
        DECRYPTING: 3,
    };

    let currentState = states.PLAIN;
    let stateTimer = 0;
    let scrambleProgress = 0;

    // Текст для анимации
    const originalText = 'ВАШИ ДАННЫЕ';
    let displayText = originalText;
    let scrambledText = '';
    let currentScrambledChars = [];

    // Анимация замка
    let lockAngle = 0; // 0 = закрыт, -Math.PI/2 = открыт
    let targetLockAngle = 0;

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function init() {
        const container = document.getElementById('world-map-container');
        if (!container) {
            console.error('Контейнер не найден');
            return;
        }

        canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.innerHTML = '';
        container.appendChild(canvas);

        ctx = canvas.getContext('2d');

        resize();
        window.addEventListener('resize', resize);

        // Генерируем зашифрованный текст
        scrambledText = generateScrambledText(originalText);
        currentScrambledChars = scrambledText.split('');

        animate();
    }

    function resize() {
        const container = document.getElementById('world-map-container');
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        width = rect.width;
        height = rect.height;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        ctx.scale(dpr, dpr);
    }

    function generateScrambledText(text) {
        return text.split('').map(char => {
            if (char === ' ') return ' ';
            return CONFIG.scrambleChars[Math.floor(Math.random() * CONFIG.scrambleChars.length)];
        }).join('');
    }

    function getRandomScrambleChar() {
        return CONFIG.scrambleChars[Math.floor(Math.random() * CONFIG.scrambleChars.length)];
    }

    // ===== ОТРИСОВКА =====
    function drawBackground() {
        ctx.fillStyle = CONFIG.colors.bg;
        ctx.fillRect(0, 0, width, height);
    }

    function drawCenterAnimation() {
        const centerX = width / 2;
        const centerY = height * 0.32;
        
        // Обновляем состояние
        stateTimer += 0.016;
        
        // Цикл анимации
        if (currentState === states.PLAIN && stateTimer > 2) {
            currentState = states.ENCRYPTING;
            stateTimer = 0;
            scrambleProgress = 0;
            targetLockAngle = -Math.PI / 2; // Открываем замок
        } else if (currentState === states.ENCRYPTING && scrambleProgress >= 1) {
            currentState = states.ENCRYPTED;
            stateTimer = 0;
            targetLockAngle = 0; // Закрываем замок
        } else if (currentState === states.ENCRYPTED && stateTimer > 2.5) {
            currentState = states.DECRYPTING;
            stateTimer = 0;
            scrambleProgress = 0;
            targetLockAngle = -Math.PI / 2; // Открываем замок
        } else if (currentState === states.DECRYPTING && scrambleProgress >= 1) {
            currentState = states.PLAIN;
            stateTimer = 0;
            displayText = originalText;
            targetLockAngle = 0; // Закрываем замок
        }

        // Плавная анимация замка
        lockAngle += (targetLockAngle - lockAngle) * 0.08;

        // Обновляем прогресс шифрования/дешифрования
        if (currentState === states.ENCRYPTING || currentState === states.DECRYPTING) {
            scrambleProgress = Math.min(1, scrambleProgress + 0.015);
            
            // Перемешиваем символы с эффектом "матрицы"
            const chars = originalText.split('');
            const result = [];
            
            for (let i = 0; i < chars.length; i++) {
                if (chars[i] === ' ') {
                    result.push(' ');
                } else if (currentState === states.ENCRYPTING) {
                    // Шифруем: от начала к концу
                    if (i / chars.length < scrambleProgress) {
                        // Случайная смена символов для эффекта
                        if (Math.random() < 0.3) {
                            currentScrambledChars[i] = getRandomScrambleChar();
                        }
                        result.push(currentScrambledChars[i]);
                    } else {
                        result.push(chars[i]);
                    }
                } else {
                    // Дешифруем: от конца к началу
                    if (i / chars.length > 1 - scrambleProgress) {
                        result.push(chars[i]);
                    } else {
                        // Случайная смена символов для эффекта
                        if (Math.random() < 0.3) {
                            currentScrambledChars[i] = getRandomScrambleChar();
                        }
                        result.push(currentScrambledChars[i]);
                    }
                }
            }
            displayText = result.join('');
        }

        // Рисуем замок
        const lockSize = 50;
        const lockX = centerX;
        const lockY = centerY - 70;
        const isLocked = Math.abs(lockAngle) < 0.1;
        
        drawLock(lockX, lockY, lockSize, lockAngle, isLocked);

        // Рисуем текст
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Основной текст
        const fontSize = Math.min(40, width * 0.045);
        ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
        
        if (currentState === states.ENCRYPTED) {
            ctx.fillStyle = CONFIG.colors.encrypted;
            ctx.shadowColor = CONFIG.colors.encrypted;
            ctx.shadowBlur = 25;
        } else if (currentState === states.ENCRYPTING || currentState === states.DECRYPTING) {
            ctx.fillStyle = CONFIG.colors.accent;
            ctx.shadowColor = CONFIG.colors.accent;
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = CONFIG.colors.text;
            ctx.shadowBlur = 0;
        }
        
        ctx.fillText(displayText, centerX, centerY);
        ctx.shadowBlur = 0;

        // Подпись состояния
        let statusText = '';
        let statusColor = '';
        
        switch (currentState) {
            case states.PLAIN:
                statusText = 'Данные открыты';
                statusColor = CONFIG.colors.textMuted;
                break;
            case states.ENCRYPTING:
                statusText = 'Шифрование...';
                statusColor = CONFIG.colors.accent;
                break;
            case states.ENCRYPTED:
                statusText = 'Зашифровано ✓';
                statusColor = CONFIG.colors.encrypted;
                break;
            case states.DECRYPTING:
                statusText = 'Расшифровка...';
                statusColor = CONFIG.colors.accent;
                break;
        }
        
        ctx.font = `${fontSize * 0.45}px Inter, sans-serif`;
        ctx.fillStyle = statusColor;
        ctx.fillText(statusText, centerX, centerY + 55);

        // Стрелка вниз
        const arrowY = centerY + 95;
        ctx.strokeStyle = CONFIG.colors.textMuted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, arrowY);
        ctx.lineTo(centerX, arrowY + 35);
        ctx.lineTo(centerX - 12, arrowY + 23);
        ctx.moveTo(centerX, arrowY + 35);
        ctx.lineTo(centerX + 12, arrowY + 23);
        ctx.stroke();
    }

    function drawLock(x, y, size, angle, isLocked) {
        ctx.save();
        ctx.translate(x, y);
        
        const bodyWidth = size * 1.4;
        const bodyHeight = size;
        const bodyX = -bodyWidth / 2;
        const bodyY = 0;
        
        // Цвет замка
        const lockColor = isLocked ? CONFIG.colors.encrypted : CONFIG.colors.danger;
        const glowColor = isLocked ? CONFIG.colors.encrypted : CONFIG.colors.danger;
        
        // Свечение
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        
        // Тело замка (прямоугольник со скруглёнными углами)
        ctx.fillStyle = lockColor;
        ctx.beginPath();
        ctx.roundRect(bodyX, bodyY, bodyWidth, bodyHeight, 8);
        ctx.fill();
        
        // Блик на теле замка
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(bodyX + 4, bodyY + 4, bodyWidth - 8, bodyHeight * 0.4, 4);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Дужка замка (анимированная)
        ctx.strokeStyle = lockColor;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';

        const shackleWidth = bodyWidth * 0.6;
        const shackleHeight = bodyHeight * 0.3;
        const shackleX = -shackleWidth / 2;
        const shackleY = -shackleHeight + bodyY * 0.3;

        // Прозрачность дужки: 1 = закрыт, 0 = открыт
        const shackleOpacity = 1 - (Math.abs(angle) / (Math.PI / 2));

        ctx.save();
        // Точка вращения дужки — правая сторона
        const pivotX = shackleX + shackleWidth;
        const pivotY = bodyY + 5;

        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle);
        ctx.translate(-pivotX, -pivotY);

        // Применяем прозрачность к дужке
        ctx.globalAlpha = Math.max(0, shackleOpacity);

        // Рисуем дужку
        ctx.beginPath();
        ctx.moveTo(shackleX, bodyY + 5);
        ctx.lineTo(shackleX, shackleY + shackleHeight * 0.3);
        ctx.arc(shackleX + shackleWidth / 2, shackleY, shackleWidth / 2, Math.PI, 0);
        ctx.lineTo(shackleX + shackleWidth, bodyY + 5);
        ctx.stroke();

        ctx.restore();
        
        // Замочная скважина
        ctx.fillStyle = CONFIG.colors.bg;
        ctx.beginPath();
        ctx.arc(0, bodyY + bodyHeight * 0.45, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Прямоугольник скважины
        ctx.fillRect(-2, bodyY + bodyHeight * 0.45, 4, bodyHeight * 0.25);
        
        ctx.restore();
    }

    function drawInfoCards() {
        const cardWidth = Math.min(300, (width - 60) / 3);
        const cardHeight = 150;
        const gap = 20;
        const totalWidth = cardWidth * 3 + gap * 2;
        const startX = (width - totalWidth) / 2;
        const y = height * 0.72;

        const cards = [
            {
                icon: '🔓',
                title: 'Без VPN',
                desc: 'Ваши данные видны провайдеру и сайтам',
                color: CONFIG.colors.danger,
            },
            {
                icon: '🔐',
                title: 'Шифрование',
                desc: 'Данные превращаются в нечитаемый код',
                color: CONFIG.colors.encrypted,
            },
            {
                icon: '✅',
                title: 'Защита',
                desc: 'Только вы можете расшифровать свои данные',
                color: CONFIG.colors.success,
            },
        ];

        cards.forEach((card, i) => {
            const x = startX + i * (cardWidth + gap);
            
            // Фон карточки
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.roundRect(x, y, cardWidth, cardHeight, 12);
            ctx.fill();
            ctx.stroke();
            
            // Иконка
            ctx.font = '36px serif';
            ctx.textAlign = 'center';
            ctx.fillText(card.icon, x + cardWidth / 2, y + 45);
            
            // Заголовок
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillStyle = card.color;
            ctx.fillText(card.title, x + cardWidth / 2, y + 85);
            
            // Описание
            ctx.font = '14px Inter, sans-serif';
            ctx.fillStyle = CONFIG.colors.textMuted;
            ctx.fillText(card.desc, x + cardWidth / 2, y + 115);
        });
    }

    // ===== АНИМАЦИЯ =====
    function animate() {
        drawBackground();
        drawCenterAnimation();
        drawInfoCards();
        
        animationId = requestAnimationFrame(animate);
    }

    // ===== ЗАПУСК =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
