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
    if(event.key == "Return" || event.key == "Enter") {
        document.getElementById("levelTip").style.opacity = 1;
    }
    if(event.key == "w" || event.key == "ArrowUp") jumpedThisHold = false;
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
        if(obj instanceof StaticObject) {
            ctx.globalAlpha = obj.opacity
        }
        ctx.fillRect(pos.x,pos.y,size.x,size.y);
        ctx.globalAlpha = 1;
    });
}

let jumpedThisHold = false;
let currentLevel = 0;
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

    if(finishObject.level != currentLevel) {
        currentLevel += 1;
        LoadNextLevel();
    }
    if(playerObject.dead) LoadNextLevel();
    // if glitched out of map reset
    if(playerObject.pos.y > 700) LoadNextLevel();

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

    let leftIn = false;
    let rightIn = false;
    let upIn = false;
    let downIn = false;
    if(keysPressed.includes("a") || keysPressed.includes("ArrowLeft")) {
        leftIn = true;
    }
    if(keysPressed.includes("d") || keysPressed.includes("ArrowRight")) {
        rightIn = true;
    }
    if(keysPressed.includes("s") || keysPressed.includes("ArrowDown")) {
        downIn = true;
    }
    if(keysPressed.includes("w") || keysPressed.includes("ArrowUp")) {
        upIn = true;
    }

    // Handle input
    if(leftIn && !rightIn) {
        playerObject.velocity.x = -5*playerObject.Speed;
    }
    else if(rightIn && !leftIn) {
        playerObject.velocity.x = 5*playerObject.Speed;
    }
    else {
        playerObject.velocity.x = 0;
    }
    if(upIn && !jumpedThisHold) {
        jumpedThisHold = true;
        playerObject.Jump()
    }

    let prevPos = {... playerObject.pos};
    // Move player with clone object
    if(playerObject.dynamicObject != undefined) {
        playerObject.pos.x += playerObject.dynamicObject.recordedVelocities[ticks-playerObject.dynamicObject.tickStartedReplaying].x
        playerObject.pos.y += playerObject.dynamicObject.recordedVelocities[ticks-playerObject.dynamicObject.tickStartedReplaying].y
    }
    // Move player with platform object
    if(playerObject.platformObj != undefined) {
        playerObject.pos.x += playerObject.platformObj.velocity*playerObject.platformObj.speed*deltatime;
    }

    mapObjects.forEach(obj => {
        if(obj.fadingOut) {
            obj.fadeOutStep(deltatime);
        }
        else if(obj.fadingIn) {
            obj.fadeInStep(deltatime);
        }
    })

    playerObject.ApplyMovement(deltatime);

    let collisionObjs = [];
    let cloneObj = undefined;
    collisionObjs.push(...mapObjects)
    recordedMovements.forEach(movement => {
        if(movement.object != undefined && movement.isReplaying) {
            collisionObjs.push(movement.object)
            cloneObj = movement.object;
        }
    })

    collisionObjs.push(...movingPlatformObjects)
    collisionObjs.push(...pressurePlateObjects)
    collisionObjs.push(finishObject)
    playerObject.collidedObjects = playerObject.GetCollision(collisionObjs,recordingMovement,replayingMovement,cloneObj);
    playerObject.ReadjustPos(mapObjects)

    if(recordingMovement) {
        recordedMovements[currentRecordedMovementsIndex].RecordCurrentVelocity(prevPos,playerObject.Pos);
    }
    else if(replayingMovement) {
        recordedMovements[currentRecordedMovementsIndex].ReplayStep(ticks)
    }

    if(movingPlatformObjects.length > 0 && ticks > 1) {
        movingPlatformObjects.forEach(obj => {
            obj.Step(deltatime);
        })
    }

    // Apply gravity
    if(ticks > 1) playerObject.velocity.y = 5*playerObject.Gravity;

    // Render background
    Render([new StaticObject(0,0,1000,500, "#61988E")]);
    // Render player
    Render([playerObject]);
    // Render map
    Render(mapObjects);
    // Render finish point
    Render([finishObject]);
    // Render platforms
    Render(movingPlatformObjects)
    // Render pressure plates
    Render(pressurePlateObjects)

    // Render player clones
    recordedMovements.forEach(movement => {
        if(movement.object != undefined && movement.isReplaying) {
            Render([movement.object])
        }
    })
    
    requestAnimationFrame(Tick);

    ticks+=1;
}

LoadNextLevel = () => {
    document.getElementById("recordingMovement").innerText = "Press Space To Record Movement"
    currentRecordedMovementsIndex = -1;
    const lvl = levels[currentLevel];
    // load map objects
    mapObjects = lvl.mapObjs.map(obj =>
        new obj.constructor(
            obj.Pos.x, 
            obj.Pos.y, 
            obj.Size.x, 
            obj.Size.y, 
            obj.Color, 
            obj.opacity
        )
    );
    // create map borders
    mapObjects.push(new StaticObject(0,500,1000,100, "#493843"));
    mapObjects.push(new StaticObject(0,-100,1000,100, "#493843"));
    mapObjects.push(new StaticObject(-100,0,100,500, "#493843"));
    mapObjects.push(new StaticObject(1000,0,100,500, "#493843"));

    finishObject = new FinishObject(
        lvl.finishObj.Pos.x,
        lvl.finishObj.Pos.y,
        lvl.finishObj.Size.x,
        lvl.finishObj.Size.y,
        lvl.finishObj.Color,
        lvl.finishObj.level
    );
    playerObject = new Player(
        lvl.playerObj.Pos.x,
        lvl.playerObj.Pos.y,
        lvl.playerObj.Size.x,
        lvl.playerObj.Size.y,
        lvl.playerObj.Color,
        lvl.playerObj.Speed,
        lvl.playerObj.Gravity
    );
    movingPlatformObjects = lvl.platformObjs.map(obj =>
        new MovingPlatform(
            obj.Pos.x,
            obj.Pos.y,
            obj.Size.x,
            obj.Size.y,
            obj.Color,
            obj.movePath,
            obj.speed
        )
    );
    pressurePlateObjects = lvl.pressurePlates.map(obj =>
        new PressurePlate(
            obj.Pos.x,
            obj.Pos.y,
            obj.Size.x,
            obj.Size.y,
            obj.Color,
            obj.connectedObjIndex
        )
    );
    recordedMovements = [];
    recordingMovement = false;
    replayingMovement = false;

    // create tip text
    let tipText = document.getElementById("levelTip");
    if(tipText != null) tipText.remove()
    tipText = document.createElement("p");
    tipText.innerText = lvl.tipText;
    tipText.style.opacity = 0;
    tipText.id = "levelTip"
    document.body.appendChild(tipText)

    // delete replay buttons
    let btns = Array.from(document.getElementsByClassName("replayButtons"))
    btns.forEach(btn => {
        btn.remove()
    })

    document.getElementById("level").innerText = `Level ${currentLevel+1}`
}

let mapObjects = [];
let pressurePlateObjects = [];
let movingPlatformObjects = [];
let finishObject = undefined;
let playerObject = undefined;

Level1 = {
    "mapObjs": 
    [new StaticObject(0,450,225,50, "#493843"),
    new StaticObject(275,375,200,50, "#493843"),
    new StaticObject(525,275,200,50, "#493843"),
    new StaticObject(775,200,225,50, "#493843")],
    "pressurePlates":
    [],
    "platformObjs":
    [],
    "finishObj": new FinishObject(900, 100, 60, 100, "#A0B2A6", 0),
    "playerObj": new Player(10, 400, 40, 40, "#A0B2A6", 90, 125),
    "tipText": "Press {W} to jump.",
};
Level2 = {
    "mapObjs": 
    [new StaticObject(250,375,750,125, "#493843"),
    new StaticObject(400,200,150,175, "#493843"),
    new StaticObject(625,200,150,50, "#493843"),
    new StaticObject(850,200,150,175, "#493843"),
    new KillingObject(550,350,300,25)],
    "pressurePlates":
    [],
    "platformObjs":
    [],
    "finishObj": new FinishObject(900, 100, 60, 100, "#A0B2A6", 1),
    "playerObj": new Player(10, 400, 40, 40, "#A0B2A6", 90, 125),
    "tipText": "You can stand on your clone object whilst it jumps.",
};
Level3 = {
    "mapObjs": 
    [new KillingObject(150,475,350,25),
    new StaticObject(0,350,150,150, "#493843"),
    new StaticObject(500,350,500,300, "#493843"),
    new StaticObject(500,300,100,50, "#493843"),
    new StaticObject(900,200,100,150, "#493843"),
    new KillingObject(600,325,300,25)],
    "pressurePlates":
    [],
    "platformObjs":
    [new MovingPlatform(200,350,100,25,"#493843",[200,350],1)],
    "finishObj": new FinishObject(925, 100, 60, 100, "#A0B2A6", 2),
    "playerObj": new Player(10, 300, 40, 40, "#A0B2A6", 90, 125),
    "tipText": "Lava will not kill you when you are recording your movement.",
};
Level4 = {    
    "mapObjs": 
    [new StaticObject(0,100,150,50, "#493843"),
    new StaticObject(500,150,100,350, "#493843"),
    new KillingObject(0,475,500,25),
    new StaticObject(600,250,100,250, "#493843"),
    new StaticObject(650,100,150,100, "#493843"),
    new KillingObject(650,75,150,25),
    new StaticObject(675,200,25,50, "#383a49"),
    new StaticObject(950,100,50,50, "#493843"),
    new StaticObject(800,150,200,50,"#493843"),
    new StaticObject(0,300,50,50, "#493843"),
    new StaticObject(500,0,25,150,"#383a49"),
    new StaticObject(700,325,300,200,"#493843"),
    new StaticObject(450,200,50,50, "#493843")
    ],
    "pressurePlates":
    [new PressurePlate(0,275,50,25,"#0e76006b",10),
    new PressurePlate(950,75,100,25,"#0e76006b",6)
    ],
    "platformObjs":
    [new MovingPlatform(125,250,100,25,"#493843",[125,275],1),
    new MovingPlatform(800,100,50,25,"#493843",[825,875],1)],
    "finishObj": new FinishObject(900, 225, 60, 100, "#A0B2A6", 3),
    "playerObj": new Player(25, 40, 40, 40, "#A0B2A6", 90, 125),
    "tipText": "Doors can be opened by you or your clone standing on pressure plates.",
}

const levels = [Level1,Level2,Level3,Level4]

let recordedMovements = [];

LoadNextLevel()
Tick();