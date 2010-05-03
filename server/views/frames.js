// Frames
// ======
// These classes represent lists of frames. A 'frame' contains everything the
// client needs to render the robots on the playing field.
/*[
  { // frame 1
    robots: [
      { name: 'Foo Fighter', armor: 23 },
      ...
    ],
    objects: [
      { type: 'robot', x: 555, y: 223, rotation: ... },
      { type: 'bullet', x: 555, y: 222, ...},
      ...
    ],
    current_events: [
      // Enough information so the client can draw special effects (e.g.
      // how does it know when a bullet hit a robot so it can drow an
      // explosion? or when a match finished or when a robot spawned?)
      { event: 'explosion', x: 555, y: 222, ...},
      ...
    ]
  },
  { // frame 2
    ...
  }
  ...
]*/

var
  sys = require('sys'),
  events = require('events');

function FrameList(match) {
  // A list of frames.
  this.frames = [];
  this.currentEvents = [];
  this.match = match;
}
sys.inherits(FrameList, events.EventEmitter);


FrameList.prototype.newFrame = function() {
  // Make a new frame, append it to our history, and then emit an event.
  var frame = {
    robots: this.match.game.robotArray(),
    objects: this.match.game.field.objects.map(
      function(obj) { return obj.renderInfo(); }
    ),
    current_events: this.currentEvents
  };

  this.currentEvents = [];

  this.frames.push(frame);

  this.emit("newFrame", this, frame);
  return frame;
};

FrameList.prototype.latest = function() {
  // Retrieve latest frame
  return this.frames[this.frames.length-1];
};

FrameList.prototype.frame = function(num) {
  if (num in this.frames) {
    return this.frames[num];
  }
  return null;
};

FrameList.prototype.registerEvent = function(event) {
  // Signify that a new event should show up in this frame.
  this.currentEvents.push(event);
};

process.mixin(exports,
  {
    FrameList: FrameList
  }
);
