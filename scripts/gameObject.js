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
        this.onDynamicObj = undefined;
    }

    get Grounded() {
        return this.grounded
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

    ApplyMovement(dt) {
        this.pos.x += this.velocity.x *dt
        this.pos.y += this.velocity.y *dt
    }

    GetCollision(objs) {
        // if the player is grounded (it is on a dynamic object) apply the velocity to the player
        objs.forEach(obj => {
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
                        if(obj instanceof PlayerClone) {
                            this.onDynamicObj = obj.recordedMovement;
                        }
                        else{
                            this.onDynamicObj = undefined;
                        }
                    }
                    else {
                        // push down
                        this.pos.y += overlapY;
                    }
                }
            }

            if(!collisionY) {
                this.onDynamicObj = undefined;
            }
        });
    }
}