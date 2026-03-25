const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

keysPressed = []
document.addEventListener("keydown", (event) => {
    if(!keysPressed.includes(event.key)) {
        keysPressed.push(event.key)
    }
})
document.addEventListener("keyup", (event) => {
    if(keysPressed.includes(event.key)) {
        keysPressed.splice(keysPressed.indexOf(event.key), 1)
    }
})

Render = (objs) => {
    objs.forEach(obj => {
        let pos = obj.Pos;
        let size = obj.Size;
        ctx.fillStyle = obj.Color;
        ctx.fillRect(pos[0],pos[1],size[0],size[1])
    });
}

let lastFrame = 0;
let deltatime = 0;
let ticks = 0;
Tick = () => {
    if(ticks > 1) player.ApplyGravity(mapObjects);    

    // Handle input
    if(keysPressed.includes("a") && !keysPressed.includes("d")) {
        player.MoveLeft(0,mapObjects);
    }
    if(keysPressed.includes("d") && !keysPressed.includes("a")) {
        player.MoveRight(0,mapObjects);
    }
    if(keysPressed.includes("w") && !keysPressed.includes("s")) {
        //player.MoveUp(0);
    }
    if(keysPressed.includes("s") && !keysPressed.includes("w")) {
        //player.MoveDown(0);
    }

    

    // Render background
    Render([new StaticObject(0,0,1000,500, "#3C474B")])
    // Render player
    Render([player])
    // Render map
    Render(mapObjects)

    
    requestAnimationFrame(Tick);

    let now = Date.now();
    deltatime = now - lastFrame;
    lastFrame = now;
    ticks+=1;
}

const mapObjects = [];
mapObjects.push(new StaticObject(0,450,400,50, "#000000"))
mapObjects.push(new StaticObject(450,450,200,50, "#000000"))
mapObjects.push(new StaticObject(700,450,300,50, "#000000"))
mapObjects.push(new StaticObject(0,100,200,50, "#000000"))
mapObjects.push(new StaticObject(150,200,200,50, "#000000"))

const player = new Player(10, 10, 40, 40, "black", 0.5, 0.5)

Tick();