class Background {
    constructor(game) {
        this.game = game;
        this.image = document.getElementById('background');
        this.image2 = document.getElementById('background2');
        this.width = 2400;
        this.height = this.game.baseHeight;
        this.scaledWidth;
        this.scaledHeight;
        this.x;
    }
    update(){
        this.x -= this.game.speed;
        if(this.x <= -this.scaledWidth) this.x = 0;
    }
    draw(){
        this.game.ctx.drawImage(this.image, this.x, 0, this.scaledWidth, this.scaledHeight);
        this.game.ctx.drawImage(this.image, this.x + this.scaledWidth - 1, 0, this.scaledWidth, this.scaledHeight);
        if (this.game.canvas.width >= this.scaledWidth){ // FIX 2: was "this.scaleWidth" (missing 'd')
            this.game.ctx.drawImage(this.image, this.x + this.scaledWidth * 2 - 2, 0, this.scaledWidth, this.scaledHeight);
        }
    }
    resize(){
        this.scaledWidth = this.width * this.game.ratio;
        this.scaledHeight = this.height * this.game.ratio;
        this.x = 0;
    }
}
