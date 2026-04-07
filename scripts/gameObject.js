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
    constructor(posX, posY, width, height, color, opacity) {
        super(posX, posY, width, height, color);
        if(opacity != undefined) {
            this.opacity = opacity;
        }
        else {
            this.opacity = 1;
        }
        this.fadingOut = false;
        this.fadingIn = false;
    }
    fadeInStep(dt) {
        if(this.opacity >= 1) {
            this.fadingIn = false;
            this.opacity = 1;
            return;
        }
        if(dt == 0) dt = 0.01
        this.opacity = Math.min(this.opacity + 1*dt, 1);
        this.fadingIn = true;
    }
    fadeOutStep(dt) {
        if(this.opacity <= 0) {
            this.fadingOut = false;
            this.opacity = 0;
            return;
        }
        if(dt == 0) dt = 0.01
        this.opacity = Math.max(this.opacity - 1*dt, 0);
        this.fadingOut = true;

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

class MovingPlatform extends GameObject {
    constructor(posX, posY, width, height, color, movePath, velocity) {
        super(posX, posY, width, height, color);
        this.movePath = movePath
        this.velocity = velocity
        this.speed = 75
    }

    Step(dt) {
        if(this.pos.x >= this.movePath[1]) this.velocity = -1
        if(this.pos.x <= this.movePath[0]) this.velocity = 1
        this.pos.x += this.velocity*dt*this.speed;
    }
}

class KillingObject extends GameObject {
    constructor(posX, posY, width, height) {
        super(posX, posY, width, height, "#7600006b");
    }
}

class PressurePlate extends GameObject {
    constructor(posX, posY, width, height, color, connectedObjIndex) {
        super(posX, posY, width, height, color);
        this.connectedObjIndex = connectedObjIndex;
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
        this.platformObj = undefined;
        this.dead = false;
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
            this.currentJumpVelocity = 1500;
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
        this.currentJumpVelocity -= this.gravity *dt*30;
        if(this.currentJumpVelocity < 0) {
            this.currentJumpVelocity = 0;
        }

        this.pos.x += this.velocity.x *dt;
        this.pos.y += this.velocity.y *dt;
        this.pos.y -= this.currentJumpVelocity *dt;
    }

    GetCollision(objs, isRecording, isReplaying, cloneObj) {
        let touchingClone = false;
        let touchingPlatform = false;
        this.grounded = false;
        let collidedObjects = {"x":[],"y":[]}

        objs.forEach(obj => {
            if(obj.opacity === undefined || obj.opacity > 0.1){
                // AABB collision https://kishimotostudios.com/articles/aabb_collision/
                let collisionX = this.pos.x < obj.pos.x + obj.size.x && this.pos.x + this.size.x > obj.pos.x;
                let collisionY = this.pos.y < obj.pos.y + obj.size.y && this.pos.y + this.size.y > obj.pos.y;
                if(collisionX && collisionY) {
                    let overlapX = Math.min(this.pos.x + this.size.x - obj.pos.x, obj.pos.x + obj.size.x - this.pos.x);
                    let overlapY = Math.min(this.pos.y + this.size.y - obj.pos.y, obj.pos.y + obj.size.y - this.pos.y);
                    if(obj instanceof FinishObject && !isRecording && !isReplaying) {
                        obj.level += 1;
                    }
                    if(obj instanceof PlayerClone) {
                        touchingClone = true;
                        this.dynamicObject = obj.recordedMovement;
                    }
                    if(obj instanceof KillingObject && !isRecording) {
                        //location.reload();
                        this.dead = true;
                    }
                    if(obj instanceof MovingPlatform) {
                        touchingPlatform = true;
                        this.platformObj = obj;
                    }
                    if(obj instanceof PressurePlate) {
                        objs[obj.connectedObjIndex].fadingOut = true;
                        objs[obj.connectedObjIndex].fadeOutStep(0);
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
                            this.currentJumpVelocity = 0;
                        }
                    }
                }
                else if(obj instanceof PressurePlate) {
                    // peform seperate collision check to see if clone is on it
                    if(cloneObj != undefined) {
                        let collisionX = cloneObj.pos.x < obj.pos.x + obj.size.x && cloneObj.pos.x + cloneObj.size.x > obj.pos.x;
                        let collisionY = cloneObj.pos.y < obj.pos.y + obj.size.y && cloneObj.pos.y + cloneObj.size.y > obj.pos.y;
                        if(collisionX && collisionY) {
                            objs[obj.connectedObjIndex].fadingOut = true;
                            objs[obj.connectedObjIndex].fadingIn = false;
                            objs[obj.connectedObjIndex].fadeOutStep(0);
                        }
                    }
                    if(!objs[obj.connectedObjIndex].fadingOut) {
                        objs[obj.connectedObjIndex].fadingIn = true;
                        objs[obj.connectedObjIndex].fadingOut = false;
                        objs[obj.connectedObjIndex].fadeInStep(0);
                    }
                }
            }
        });
        if(!touchingClone) {
            this.dynamicObject = undefined;
        }
        if(!touchingPlatform) {
            this.platformObj = undefined;
        }
        return collidedObjects
    }
}