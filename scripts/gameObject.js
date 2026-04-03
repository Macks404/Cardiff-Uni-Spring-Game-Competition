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

class FinishObject extends GameObject {
    constructor(posX, posY, width, height, color, lvl) {
        super(posX, posY, width, height, color);
        this.level = lvl
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
        this.collidedObjects = {"x":[],"y":[]};
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
        if(this.grounded) {
            this.currentJumpVelocity = this.gravity*15;
        }
    }

    ReadjustPos(mapObjects) {
        this.collidedObjects.x.forEach(coll => {
            let newPos = {"x":this.pos.x + coll.overlap,"y":this.pos.y}
            if(coll.obj instanceof PlayerClone) {
                let collided = false;
                mapObjects.forEach(mapObj => {
                    // Get collision in new position given
                    let collisionX = newPos.x < mapObj.pos.x + mapObj.size.x && newPos.x + this.size.x > mapObj.pos.x;
                    let collisionY = newPos.y < mapObj.pos.y + mapObj.size.y && newPos.y + this.size.y > mapObj.pos.y;
                    if(collisionX && collisionY) {
                        collided = true;
                    }
                });
                if(!collided) {
                    this.pos.x += coll.overlap
                }
            }
            else {
                this.pos.x += coll.overlap
            }
        });
        this.collidedObjects.y.forEach(coll => {
            let newPos = {"x":this.pos.x,"y":this.pos.y+coll.overlap}
            if(coll.obj instanceof PlayerClone) {
                let collided = false;
                mapObjects.forEach(mapObj => {
                    // Get collision in new position given
                    let collisionX = newPos.x < mapObj.pos.x + mapObj.size.x && newPos.x + this.size.x > mapObj.pos.x;
                    let collisionY = newPos.y < mapObj.pos.y + mapObj.size.y && newPos.y + this.size.y > mapObj.pos.y;
                    if(collisionX && collisionY) {
                        collided = true;
                    }
                });
                if(!collided) {
                    this.pos.y += coll.overlap
                }
            }
            else {
                this.pos.y += coll.overlap
            }
        });
        this.collidedObjects.y = []
        this.collidedObjects.x = []
    }

    ApplyMovement(dt) {
        if(this.currentJumpVelocity >= this.gravity) {
            this.currentJumpVelocity -= this.gravity;
        }

        this.pos.x += this.velocity.x *dt;
        this.pos.y += this.velocity.y *dt;
        this.pos.y -= this.currentJumpVelocity *dt;
    }

    GetCollision(objs) {
        let touchingClone = false;
        this.grounded = false;
        let collidedObjects = {"x":[],"y":[]}

        objs.forEach(obj => {
            // AABB collision https://kishimotostudios.com/articles/aabb_collision/
            let collisionX = this.pos.x < obj.pos.x + obj.size.x && this.pos.x + this.size.x > obj.pos.x;
            let collisionY = this.pos.y < obj.pos.y + obj.size.y && this.pos.y + this.size.y > obj.pos.y;
            if(collisionX && collisionY) {
                let overlapX = Math.min(this.pos.x + this.size.x - obj.pos.x, obj.pos.x + obj.size.x - this.pos.x);
                let overlapY = Math.min(this.pos.y + this.size.y - obj.pos.y, obj.pos.y + obj.size.y - this.pos.y);
                if(obj instanceof FinishObject) {
                    obj.level += 1;
                }
                if(obj instanceof PlayerClone) {
                    touchingClone = true;
                    this.dynamicObject = obj.recordedMovement;
                }
                
                // adjust players position based on collision
                if(overlapX < overlapY) {
                    if(this.pos.x < obj.pos.x) {
                        // push left
                        collidedObjects.x.push({"obj":obj,"overlap":-overlapX})
                    }
                    else {
                        // push right
                        collidedObjects.x.push({"obj":obj,"overlap":overlapX})
                    }
                } 
                else {
                    if(this.pos.y < obj.pos.y) {
                        this.grounded = true;
                        this.currentJumpVelocity = 0;

                        // push up
                        collidedObjects.y.push({"obj":obj,"overlap":-overlapY})
                        this.grounded = true;
                    }
                    else {
                        // push down
                        collidedObjects.y.push({"obj":obj,"overlap":overlapY})
                    }
                }
            }
        });
        if(!touchingClone) {
            this.dynamicObject = undefined;
        }
        return collidedObjects
    }
}