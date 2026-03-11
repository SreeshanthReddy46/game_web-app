class Game {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.bottomMargin;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.baseHeight = 720;
        this.ratio = this.height / this.baseHeight;
        this.background = new Background(this);
        this.player = new Player(this);
        this.sound = new AudioControl();
        this.obstacles = [];
        this.numberOfObstacles = 13;
        this.smallFont;
        this.largeFont;
        this.gravity;
        this.speed;
        this.maxSpeed;
        this.minSpeed;
        this.score;
        this.gameOver;
        this.timer;
        this.message1;
        this.message2;
        this.eventTimer = 0;
        this.eventInterval = 150;
        this.eventUpdate = false;
        this.touchStartX;
        this.swipeDistance = 50;
        this.debug = false;

        this.resize(window.innerWidth, window.innerHeight);

        // Mouse controls
        window.addEventListener("resize", e => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });
        this.canvas.addEventListener("mousedown", e => {
            this.player.flap();
        });
        this.canvas.addEventListener("mouseup", e => {
            setTimeout(() => {
                this.player.wingsUp();
            }, 50);
        });

        // Keyboard controls
        window.addEventListener("keydown", e => {
            if (e.key === ' ' || e.key === 'Enter') this.player.flap();
            if (e.key === 'Shift' || e.key.toLowerCase() === 'c') this.player.startCharge();
            if (e.key.toLowerCase() === 'r') this.resize(window.innerWidth, window.innerHeight);
            if (e.key.toLowerCase() === 'f') this.toggleFullscreen(true);
            if (e.key.toLowerCase() === 'd') this.debug = !this.debug;
        });

        // Touch controls
        this.canvas.addEventListener("touchstart", e => {
            this.touchStartX = e.changedTouches[0].pageX;
        });
        this.canvas.addEventListener("touchmove", e => {
            e.preventDefault();
        });
        this.canvas.addEventListener("touchend", e => {
            if (e.changedTouches[0].pageX - this.touchStartX > this.swipeDistance) {
                this.player.startCharge();
            } else {
                this.player.flap();
            }
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.textAlign = 'right';
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'white';
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ratio = this.height / this.baseHeight;

        this.bottomMargin = Math.floor(5 * this.ratio);
        this.gravity = 0.15 * this.ratio;
        this.background.resize();
        this.smallFont = Math.ceil(20 * this.ratio);
        this.largeFont = Math.ceil(40 * this.ratio);
        this.ctx.font = this.smallFont + 'px Bungee';
        this.speed = 2 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;
        this.player.resize();
        this.createObstacles();
        this.obstacles.forEach(obstacle => {
            obstacle.resize();
        });
        this.score = 0;
        this.gameOver = false;
        this.timer = 0;
    }

    render(deltaTime) {
        if (!this.gameOver) this.timer += deltaTime;
        this.handlePeriodicTimer(deltaTime);
        this.background.update();
        this.background.draw();
        this.drawStatusText();
        this.player.update();
        this.player.draw();
        this.obstacles.forEach(obstacle => {
            obstacle.update();
            obstacle.draw();
        });
        // FIX 6: Filter out obstacles marked for deletion each frame
        this.obstacles = this.obstacles.filter(o => !o.markForDeletion);
    }

    createObstacles() {
        this.obstacles = [];
        const firstX = this.baseHeight * this.ratio;
        const obstacleSpacing = 600 * this.ratio;
        for (let i = 0; i < this.numberOfObstacles; i++) {
            this.obstacles.push(new Obstacle(this, firstX + i * obstacleSpacing));
        }
    }

    checkCollision(a, b) {
        const dx = a.collisionX - b.collisionX;
        const dy = a.collisionY - b.collisionY;
        const distance = Math.hypot(dx, dy);
        const sumOfRadii = a.collisionRadius + b.collisionRadius;
        return distance <= sumOfRadii;
    }

    formatTimer() {
        // FIX 7: was 0.000001 (gave near-zero values). 0.001 correctly converts ms to seconds
        return (this.timer * 0.001).toFixed(1);
    }

    handlePeriodicTimer(deltaTime) {
        if (this.eventTimer < this.eventInterval) {
            this.eventTimer += deltaTime;
            this.eventUpdate = false;
        } else {
            this.eventTimer = this.eventTimer % this.eventInterval;
            this.eventUpdate = true;
        }
    }

    triggerGameOver() {
        if (!this.gameOver) {
            this.gameOver = true;
            if (this.obstacles.length <= 0) {
                this.sound.play(this.sound.win);
                this.message1 = "Nailed It!!!";
                this.message2 = "Can You Do It Faster than " + this.formatTimer() + " seconds!";
            } else {
                this.sound.play(this.sound.lose);
                this.message1 = "Getting Rusty?";
                // FIX 8: was "Collision Time0.0" — missing space and word
                this.message2 = "Collision at " + this.formatTimer() + " seconds!";
            }
        }
    }

    drawStatusText() {
        this.ctx.save();
        this.ctx.fillStyle = 'white'; // FIX 9: explicitly set white so score/timer text always renders
        this.ctx.font = this.smallFont + 'px Bungee';
        this.ctx.textAlign = 'right';
        this.ctx.fillText("Score: " + this.score, this.width - this.smallFont, this.largeFont);
        this.ctx.textAlign = 'left';
        this.ctx.fillText("Timer: " + this.formatTimer(), this.smallFont, this.largeFont);

        if (this.gameOver) {
            this.ctx.textAlign = "center";
            this.ctx.font = this.largeFont + "px Bungee";
            this.ctx.fillText(this.message1, this.width * 0.5, this.height * 0.5 - this.largeFont, this.width);
            this.ctx.font = this.smallFont + "px Bungee";
            this.ctx.fillText(this.message2, this.width * 0.5, this.height * 0.5 - this.smallFont, this.width);
            this.ctx.fillText("Press 'R' to try again!", this.width * 0.5, this.height * 0.5, this.width);
        }

        // Energy bar — color based on level
        if (this.player.energy <= this.player.minEnergy) this.ctx.fillStyle = 'red';
        else if (this.player.energy < this.player.maxEnergy) this.ctx.fillStyle = 'orangered';
        else this.ctx.fillStyle = 'limegreen';

        for (let i = 0; i < this.player.energy; i++) {
            this.ctx.fillRect(
                10,
                this.height - 10 - this.player.barSize * i,
                this.player.barSize * 5,
                this.player.barSize
            );
        }
        this.ctx.restore();
    }
}

window.addEventListener('load', function () {
    const canvas = document.getElementById("canvas1");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas, ctx);

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp; // FIX 10: was never updated — deltaTime was always huge/wrong
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(deltaTime);
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
});
