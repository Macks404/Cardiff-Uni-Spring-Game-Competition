class GameObject {
    constructor (posX, posY, width, height, color) {
        this.pos = {x:posX,y:posY};
        this.size = {x:width,y:height};
        this.color = color;
    }

    get Pos() {
        return this.pos;
    }

    get Size() {
        return this.size;
    }

    get Color() {
        return this.color
    }

    set Pos(p) {
        this.pos = p
    }

    set Size(s) {
        this.size = s
    }
}

class StaticObject extends GameObject {
    constructor(posX, posY, width, height, color) {
        super(posX, posY, width, height, color);
    }
}

class PlayerClone extends GameObject {
    constructor(posX, posY, width, height, color,obj) {
        super(posX, posY, width, height, color);
        this.recordedMovement = obj
    }
}

class Player extends GameObject {
    constructor(posX, posY, width, height, color, speed, gravity) {
        super(posX, posY, width, height, color);
        this.speed = speed;
        this.velocity = {x:0,y:0};
        this.gravity = gravity;
        this.grounded = true;
        this.dynamicObject = undefined;
        this.jumping = false;
        this.currentJumpVelocity = 0;
    }

    get Speed() {
        return this.speed;
    }

    get Velocity() {
        return this.velocity
    }

    get Gravity() {
        return this.gravity;
    }

    set Velocity(v) {
        this.velocity = v
    }

    Jump() {
        if(this.grounded && !this.jumping) {
            console.log("jump")
            this.jumping = true;
            this.currentJumpVelocity = this.gravity*15;
        }        
    }

    ApplyMovement(dt) {
        if(this.jumping && this.currentJumpVelocity >= this.gravity) {
            this.currentJumpVelocity -= this.gravity;
        }

        this.pos.x += this.velocity.x *dt;
        this.pos.y += this.velocity.y *dt;
        this.pos.y -= this.currentJumpVelocity *dt;
    }

    GetCollision(objs) {
        this.grounded = false;
        objs.forEach(obj => {
            // AABB collision https://kishimotostudios.com/articles/aabb_collision/
            let collisionX = this.pos.x < obj.pos.x + obj.size.x && this.pos.x + this.size.x > obj.pos.x;
            let collisionY = this.pos.y < obj.pos.y + obj.size.y && this.pos.y + this.size.y > obj.pos.y;
            if(collisionX && collisionY) {
                let overlapX = Math.min(this.pos.x + this.size.x - obj.pos.x, obj.pos.x + obj.size.x - this.pos.x);
                let overlapY = Math.min(this.pos.y + this.size.y - obj.pos.y, obj.pos.y + obj.size.y - this.pos.y);
                
                // adjust players position based on collision
                if(overlapX < overlapY) {
                    if(this.pos.x < obj.pos.x) {
                        // push left
                        this.pos.x -= overlapX;
                    }
                    else {
                        // push right
                        this.pos.x += overlapX;
                    }
                } 
                else {
                    if(this.pos.y < obj.pos.y) {
                        // push up
                        this.pos.y -= overlapY;
                        this.grounded = true;
                        if(obj instanceof PlayerClone) {
                            this.dynamicObject = obj.recordedMovement;
                        }
                        else{
                            this.dynamicObject = undefined;
                        }
                    }
                    else {
                        // push down
                        this.pos.y += overlapY;
                    }
                }

                if(this.pos.y < obj.pos.y) {
                    this.grounded = true;
                    this.jumping = false;
                }
            }

            if(!collisionY) {
                this.dynamicObject = undefined;
            }
        });
    }
}