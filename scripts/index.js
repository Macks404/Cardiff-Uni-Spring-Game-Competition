const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

keysPressed = [];
document.addEventListener("keydown", (event) => {
    if(!keysPressed.includes(event.key)) {
        keysPressed.push(event.key);
    }
})
document.addEventListener("keyup", (event) => {
    if(keysPressed.includes(event.key)) {
        keysPressed.splice(keysPressed.indexOf(event.key), 1);
    }

    if(event.key == " ") {
        if(recordedMovements.length > 0) {
            let recordedMovement = recordedMovements[recordedMovements.length-1]
            if(recordedMovement.isRecording) {
                // currently recording -> stop recording
                recordedMovement.StopRecording();
                recordedMovement.StartReplaying(ticks);
            }
            else if(recordedMovements[recordedMovements.length-1].isReplaying) {
                // currently replaying
                console.log("already replaying")
            }
        }
        else {
            recordedMovements.push(new RecordedMovement({...playerObject.Pos}));
        }
    }
})

Render = (objs) => {
    objs.forEach(obj => {
        let pos = obj.Pos;
        let size = obj.Size;
        ctx.fillStyle = obj.Color;
        ctx.fillRect(pos.x,pos.y,size.x,size.y);
    });
}

let lastFrame = 0;
let deltatime = 0;
let ticks = 0;
Tick = () => {
    let now = Date.now();
    deltatime = (now - lastFrame)/1000;
    lastFrame = now;

    let recordingMovement = false;
    let replayingMovement = false;

    if(recordedMovements.length > 0) {
        recordedMovement = recordedMovements[recordedMovements.length-1]
        if(recordedMovement.isRecording) {
            recordingMovement = true;
        }
        else if(recordedMovement.isReplaying) {
            if(recordedMovement.recordedVelocities.length-1 == ticks-recordedMovement.tickStartedReplaying) {
                recordedMovement.StopReplaying()
            }
            else {
                replayingMovement = true;
            }
        }
    }

    // Handle input
    if(keysPressed.includes("a") && !keysPressed.includes("d")) {
        playerObject.velocity.x = -5*playerObject.Speed;
    }
    else if(keysPressed.includes("d") && !keysPressed.includes("a")) {
        playerObject.velocity.x = 5*playerObject.Speed;
    }
    else {
        playerObject.velocity.x = 0;
    }
    if(keysPressed.includes("w") && !keysPressed.includes("s")) {
        playerObject.velocity.y = -5*playerObject.Speed;
    }
    else {
        // Apply gravity
        if(ticks > 1) playerObject.velocity.y = 5*playerObject.Gravity;
    }

    if(playerObject.onDynamicObj != undefined) {
        playerObject.pos.x += playerObject.onDynamicObj.recordedVelocities[ticks-playerObject.onDynamicObj.tickStartedReplaying].x
        playerObject.pos.y += playerObject.onDynamicObj.recordedVelocities[ticks-playerObject.onDynamicObj.tickStartedReplaying].y
    }

    let prevPos = {... playerObject.Pos};

    playerObject.ApplyMovement(deltatime);
    playerObject.GetCollision(mapObjects);
    recordedMovements.forEach(movement => {
        if(movement.object != undefined && movement.isReplaying) {
            playerObject.GetCollision([movement.object])
        }
    })    

    if(recordingMovement) {
        recordedMovements[0].RecordCurrentVelocity(prevPos,playerObject.Pos);
    }
    else if(replayingMovement) {
        recordedMovements[0].ReplayStep(ticks)
    }

    // Render background
    Render([new StaticObject(0,0,1000,500, "#3C474B")]);
    // Render player
    Render([playerObject]);
    // Render map
    Render(mapObjects);
    // Render finish point
    Render([finishObject]);

    // Render player clones
    recordedMovements.forEach(movement => {
        if(movement.object != undefined && movement.isReplaying) {
            Render([movement.object])
        }
    })    
    
    requestAnimationFrame(Tick);

    ticks+=1;
}

const mapObjects = [];
mapObjects.push(new StaticObject(0,450,400,50, "#000000"));
mapObjects.push(new StaticObject(450,450,200,50, "#000000"));
mapObjects.push(new StaticObject(700,450,300,50, "#000000"));
mapObjects.push(new StaticObject(0,100,200,50, "#000000"));
mapObjects.push(new StaticObject(150,200,200,50, "#000000"));
const finishObject = new StaticObject(900, 350, 60, 100, "#162521");
const playerObject = new Player(10, 10, 40, 40, "#000000", 100, 80);
const recordedMovements = [];

Tick();