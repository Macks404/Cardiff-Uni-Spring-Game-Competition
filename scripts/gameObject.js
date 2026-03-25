class GameObject {
    constructor (posX, posY, width, height, color) {
        this.posX = posX;
        this.posY = posY;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    get Pos() {
        return [this.posX, this.posY];
    }

    get Size() {
        return [this.width, this.height];
    }

    get Color() {
        return this.color
    }

    set Pos(newPos) {
        this.posX = newPos[0];
        this.posY = newPos[1];
    }

    set Size(newSize) {
        this.width = newSize[0];
        this.height = newSize[1];
    }
     
    set Color(newColor) {
        this.color = newColor;
    }
}

class StaticObject extends GameObject {
    constructor(posX, posY, width, height, color) {
        super(posX, posY, width, height, color);
    }
}

class Player extends GameObject {
    constructor(posX, posY, width, height, color, speed, gravity) {
        super(posX, posY, width, height, color);
        this.speed = speed
        this.gravity = gravity
        // Distance to objects around player
        this.collision = {
            tl:999,
            tr:999,
            bl:999,
            br:999,
            lu:999,
            ru:999,
            ld:999,
            rd:999
        };
    }

    MoveUp(n,mapObjects) {
        this.GetCollision(mapObjects,n*deltatime)
        if(n == 0) {
            n = this.speed
        }
        let coll = Math.min(this.collision.lu, this.collision.ru)
        if(coll >= n*deltatime){
            this.posY -= n*deltatime;
        }
        else {
            this.posY -= coll
        }
    }

    MoveDown(n,mapObjects) {
        this.GetCollision(mapObjects,n*deltatime)
        if(n == 0) {
            n = this.speed
        }
        let coll = Math.min(this.collision.ld, this.collision.rd)
        if(coll >= n*deltatime){
            this.posY += n*deltatime;
        }
        else {
            this.posY += coll
        }
    }

    MoveLeft(n,mapObjects) {
        this.GetCollision(mapObjects)
        if(n == 0) {
            n = this.speed
        }
        let coll = Math.min(this.collision.tl, this.collision.bl)
        if(coll >= n*deltatime){
            this.posX -= n*deltatime;
        }
        else {
            this.posX -= coll
        }
    }

    MoveRight(n,mapObjects) {
        this.GetCollision(mapObjects)
        if(n == 0) {
            n = this.speed
        }
        let coll = Math.min(this.collision.tr, this.collision.br)
        if(coll >= n*deltatime){
            this.posX += n*deltatime;
        }
        else {
            this.posX += coll
        }
    }

    ApplyGravity() {
        this.MoveDown(this.gravity,mapObjects)
    }

    Jump(){
        console.log("Jump");
    }

    GetCollision(mapObjects) {
        // Raycasting system
        // Use two perpendicular rays for each corner to make a total of 8
        let rayLength = 25;

        this.collision = {
            tl:999, 
            tr:999,
            bl:999, 
            br:999,
            lu:999, 
            ru:999,
            ld:999, 
            rd:999
        };
        
        // Left and right rays
        for(let i = 0; i < 2; i++) {
            // i = 0 -> check top horizontal corners
            // i = 1 -> check bottom horizontal corners
            let rightRayOrigin = [this.Pos[0] + this.Size[0], this.Pos[1]+this.Size[1]*i]
            let leftRayOrigin = [this.Pos[0], this.Pos[1]+this.Size[1]*i]
            mapObjects.forEach(obj => {
                if(rightRayOrigin[0] + rayLength > obj.Pos[0] &&
                    rightRayOrigin[0] + rayLength < obj.Pos[0] + obj.Size[0] &&
                    rightRayOrigin[1] < obj.Pos[1] + obj.Size[1] &&
                    rightRayOrigin[1] > obj.Pos[1]
                ) {
                    let dist = obj.Pos[0] - rightRayOrigin[0]
                    if(i == 0) {
                        this.collision.tr = Math.min(this.collision.tr, dist)
                    }
                    else {
                        this.collision.br = Math.min(this.collision.br, dist)
                    }
                }
                if(leftRayOrigin[0] - rayLength < obj.Pos[0] + obj.Size[0] &&
                    leftRayOrigin[0] - rayLength > obj.Pos[0] &&
                    leftRayOrigin[1] < obj.Pos[1] + obj.Size[1] &&
                    leftRayOrigin[1] > obj.Pos[1]
                ) {
                    let dist = leftRayOrigin[0] - obj.Pos[0] - obj.Size[0] 
                    if(i == 0) {
                        this.collision.tl = Math.min(this.collision.tl, dist)
                    }
                    else {
                        this.collision.bl = Math.min(this.collision.bl, dist)
                    }
                }
            });
        }
        // Up and down rays
        for(let i = 0; i < 2; i++) {
            // i = 0 -> left
            // i = 1 -> right
            let topRayOrigin = [this.Pos[0]+this.Size[0]*i, this.Pos[1]]
            let bottomRayOrigin = [this.Pos[0]+this.Size[0]*i, this.Pos[1]+this.Size[1]]

            mapObjects.forEach(obj => {
                if(topRayOrigin[0] > obj.Pos[0] &&
                    topRayOrigin[0] < obj.Pos[0] + obj.Size[0] &&
                    topRayOrigin[1] - rayLength < obj.Pos[1] + obj.Size[1] &&
                    topRayOrigin[1] - rayLength > obj.Pos[1]
                ) {
                    let dist = topRayOrigin[1] - (obj.Pos[1] + obj.Size[1]);
                    if(i == 0) {
                        this.collision.lu = Math.min(this.collision.lu, dist)
                    }
                    else {
                        this.collision.ru = Math.min(this.collision.ru, dist)
                    }
                }
                if(bottomRayOrigin[0] > obj.Pos[0] &&
                    bottomRayOrigin[0] < obj.Pos[0] + obj.Size[0] &&
                    bottomRayOrigin[1] + rayLength < obj.Pos[1] + obj.Size[1] &&
                    bottomRayOrigin[1] + rayLength > obj.Pos[1]
                ) {
                    let dist = obj.Pos[1] - bottomRayOrigin[1]
                    if(i == 0) {
                        this.collision.ld = Math.min(this.collision.ld, dist)
                    }
                    else {
                        this.collision.rd = Math.min(this.collision.rd, dist)
                    }
                }
            });
        }
    }
}