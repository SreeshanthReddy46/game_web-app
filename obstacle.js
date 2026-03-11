class Obstacle {
    constructor(game, x) {
        this.game = game;
        this.spriteWidth = 120;
        this.spriteHeight = 120;
        this.x = x;
        this.collisionRadius = 0;
        this.markForDeletion = false;
        this.image = document.getElementById("small_Gears");
        this.frameX = Math.floor(Math.random() * 4);

        // FIX 3: Call resize() from constructor so scaledWidth/Height and
        // collisionRadius are properly set before the first frame renders.
        this.resize();

        // Random Y speed set after resize so ratio is available
        this.speedY = Math.random() < 0.5 ? -1 * this.game.ratio : 1 * this.game.ratio;

        this.y = this.game.height * 0.5 - this.scaledHeight;
        this.collisionX = this.x + this.scaledWidth * 0.5;
        this.collisionY = this.y + this.scaledHeight * 0.5;
    }

    update() {
        this.x -= this.game.speed;
        this.y += this.speedY;
        this.collisionX = this.x + this.scaledWidth * 0.5;
        this.collisionY = this.y + this.scaledHeight * 0.5;

        if (!this.game.gameOver) {
            if (this.y <= 0 || this.y >= this.game.height - this.scaledHeight) {
                this.speedY *= -1;
            }
        } else {
            this.speedY += 0.1;
        }

        if (this.isOffScreen()) {
            this.markForDeletion = true;
            this.game.score++;
            // FIX 4: Check remaining count AFTER marking, using filter count
            // (the actual array filtering happens in game.js render)
            const remaining = this.game.obstacles.filter(o => !o.markForDeletion).length;
            if (remaining <= 0) {
                this.game.triggerGameOver();
            }
        }

        if (this.game.checkCollision(this, this.game.player)) {
            this.game.player.collided = true;
            this.game.player.stopCharge();
            this.game.triggerGameOver();
        }
    }

    draw() {
        this.game.ctx.drawImage(
            this.image,
            this.frameX * this.spriteWidth, 0,
            this.spriteWidth, this.spriteHeight,
            this.x, this.y,
            this.scaledWidth, this.scaledHeight
        );
        if (this.game.debug) {
            this.game.ctx.beginPath();
            this.game.ctx.arc(this.collisionX, this.collisionY, this.collisionRadius, 0, Math.PI * 2);
            this.game.ctx.stroke();
        }
    }

    resize() {
        this.scaledWidth = Math.max(20, this.spriteWidth * this.game.ratio);
        this.scaledHeight = this.spriteHeight * this.game.ratio;
        this.collisionRadius = this.scaledWidth * 0.4;
    }

    isOffScreen() {
        return this.x < -this.scaledWidth || this.y < -this.scaledHeight || this.y > this.game.height;
    }
}
