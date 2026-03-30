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
    if(event.key == "w") jumpedThisHold = false;
    if(event.key == " " && document.activeElement == document.body) {
        if(recordedMovements.length > 0) {
            if(currentRecordedMovementsIndex != -1) {
                let recordedMovement = recordedMovements[currentRecordedMovementsIndex]
                if(recordedMovement.isRecording) {
                    // currently recording -> stop recording
                    recordedMovement.StopRecording();
                    playerObject.pos = {...recordedMovement.origin}
                    let btns = Array.from(document.getElementsByClassName("replayButtons"))
                    btns.forEach(btn => {
                        btn.disabled = false;
                    }); 
                    document.getElementById("recordingMovement").innerText = "Press Space To Record Movement"
                    const button = document.createElement("button")
                    button.classList.add("replayButtons")
                    button.id = recordedMovements.length
                    button.innerText = "Play Replay " + button.id
                    currentRecordedMovementsIndex = -1;
                    button.onclick = () => {
                        // replay button functionality
                        if(currentRecordedMovementsIndex != -1) {
                            recordedMovements[currentRecordedMovementsIndex].StopReplaying();
                        }
                        document.getElementById("recordingMovement").innerText = "Currently Replaying Movement"
                        recordedMovements[button.id-1].StartReplaying(ticks);
                        currentRecordedMovementsIndex = button.id-1;
                        button.blur()
                    }
                    document.body.appendChild(button);
                }
            }
            else {
                // not doing anything - record
                document.getElementById("recordingMovement").innerText = "Recording Movement";
                recordedMovements.push(new RecordedMovement({...playerObject.Pos}));
                currentRecordedMovementsIndex = recordedMovements.length-1;
                let btns = Array.from(document.getElementsByClassName("replayButtons"))
                btns.forEach(btn => {
                    btn.disabled = true;
                }); 
            }
        }
        else {
            // no recordings exist
            document.getElementById("recordingMovement").innerText = "Recording Movement";
            recordedMovements.push(new RecordedMovement({...playerObject.Pos}));
            currentRecordedMovementsIndex = 0;
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

let jumpedThisHold = false;

let currentRecordedMovementsIndex = -1;
let lastFrame = 0;
let deltatime = 0;
let ticks = 0;
Tick = () => {
    let now = Date.now();
    deltatime = (now - lastFrame)/1000;
    lastFrame = now;

    let recordingMovement = false;
    let replayingMovement = false;

    if(recordedMovements.length > 0 && currentRecordedMovementsIndex != -1) {
        recordedMovement = recordedMovements[currentRecordedMovementsIndex]
        if(recordedMovement.isRecording) {
            recordingMovement = true;
        }
        else if(recordedMovement.isReplaying) {
            if(recordedMovement.recordedVelocities.length-1 == ticks-recordedMovement.tickStartedReplaying) {
                recordedMovement.StopReplaying()
                document.getElementById("recordingMovement").innerText = "Press Space To Record Movement"
                currentRecordedMovementsIndex = -1;
            }
            else {
                replayingMovement = true;
            }
        }
    }

    // Apply gravity
    if(ticks > 1) playerObject.velocity.y = 5*playerObject.Gravity;

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
    if(keysPressed.includes("w") && !jumpedThisHold) {
        jumpedThisHold = true;
        playerObject.Jump()
    }
    // Move player with dynamic object
    if(playerObject.dynamicObject != undefined) {
        playerObject.pos.x += playerObject.dynamicObject.recordedVelocities[ticks-playerObject.dynamicObject.tickStartedReplaying].x
        playerObject.pos.y += playerObject.dynamicObject.recordedVelocities[ticks-playerObject.dynamicObject.tickStartedReplaying].y
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
        recordedMovements[currentRecordedMovementsIndex].RecordCurrentVelocity(prevPos,playerObject.Pos);
    }
    else if(replayingMovement) {
        recordedMovements[currentRecordedMovementsIndex].ReplayStep(ticks)
    }

    // Render background
    Render([new StaticObject(0,0,1000,500, "#61988E")]);
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
mapObjects.push(new StaticObject(0,450,400,50, "#493843"));
mapObjects.push(new StaticObject(450,450,200,50, "#493843"));
mapObjects.push(new StaticObject(700,450,300,50, "#493843"));
mapObjects.push(new StaticObject(0,100,200,50, "#493843"));
mapObjects.push(new StaticObject(150,200,200,50, "#493843"));
const finishObject = new StaticObject(900, 350, 60, 100, "#A0B2A6");
const playerObject = new Player(10, 10, 40, 40, "#A0B2A6", 90, 125);
const recordedMovements = [];

Tick();