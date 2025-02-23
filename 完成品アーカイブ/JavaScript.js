<script>

class ShootingStar {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'shooting-star';
        this.container = document.querySelector('#container');
        
        if (this.container) {
            this.container.appendChild(this.element);
        } else {
            console.error('Container not found');
            return;
        }

        // ランダムな開始位置を設定
        this.startX = Math.random() * 100;
        this.startY = Math.random() * 50;

        // ランダムな終了位置を設定
        this.endX = 100 + Math.random() * 2000;
        this.endY = 50 + Math.random() * 5000;

        // 初期位置の設定
        this.element.style.top = `${this.startY}%`;
        this.element.style.left = `${this.startX}%`;
        this.element.style.opacity = '0';

        // ランダムなサイズを設定
        const size = 30 + Math.random() * 20;
        this.element.style.width = `${size}px`;
        this.element.style.height = `${size}px`;

        this.progress = 0;
        this.duration = 100000 + Math.random() * 1000;
        this.startTime = null;
    }

    animate(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        this.progress = (timestamp - this.startTime) / this.duration;

        if (this.progress <= 1) {
            const translateX = this.startX + (this.endX - this.startX) * this.progress;
            const translateY = this.startY + (this.endY - this.startY) * this.progress;

            let opacity = 0;
            if (this.progress < 0.1) {
                opacity = this.progress * 5;
            } else if (this.progress > 0.9) {
                opacity = (1 - this.progress) * 5;
            } else {
                opacity = 0.5;
            }

            this.element.style.transform = `translate(${translateX}%, ${translateY}%)`;
            this.element.style.opacity = opacity;

            requestAnimationFrame(this.animate.bind(this));
        } else {
            this.container.removeChild(this.element);
        }
    }

    start() {
        requestAnimationFrame(this.animate.bind(this));
    }
}

function createShootingStars() {
    const star = new ShootingStar();
    star.start();

    const nextDelay =  Math.random() * 3000;
    setTimeout(createShootingStars, nextDelay);
}

document.addEventListener('DOMContentLoaded', function() {
    // スムーズスクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // アニメーション効果
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });

    document.querySelectorAll('.feature-item').forEach((item) => {
        observer.observe(item);
    });

    // 流れ星のアニメーション開始
    createShootingStars();
});

</script>