class RecordedMovement {
    constructor(origin) {
        this.isRecording = true;
        this.isReplaying = false;
        this.origin = {x:origin.x-1,y:origin.y-1};
        this.recordedVelocities = [];
        this.tickStartedReplaying = 0;
        this.object = undefined;
    }

    StopRecording() {
        this.isRecording = false;
    }

    StartReplaying(t) {
        this.isReplaying = true;
        this.tickStartedReplaying = t;
        this.object = new PlayerClone(this.origin.x,this.origin.y,42,42,"#ff000075",this);
    }

    StopReplaying() {
        this.isReplaying = false;
    }

    RecordCurrentVelocity(prevPos, pos) {
        let vel = {x:pos.x-prevPos.x,y:pos.y-prevPos.y}
        this.recordedVelocities.push(vel);
    }

    ReplayStep(ticks) {
        let step = ticks - this.tickStartedReplaying;
        this.object.Pos.x += this.recordedVelocities[step].x;
        this.object.Pos.y += this.recordedVelocities[step].y;
    }
}