// Ears is just a wee bit of abstraction perched atop the node.js event
// system. It allows you to automatically assign event handlers for objects
// even if you don't know where they'll come from; even if you haven't a clue
// of how the internals of this framework works.
//
// ears.listenFor(
//   {
//     'matchList': {
//       'newMatch': function(match) {
//         log.info("New match: ...");
//       },
//       'remove': function(match) {
//         log.info("Match disappeared: ...");
//       }
//     },
//     '...': ...
//   }
// );

var
  sys = require('sys'),
  allEars = {};

function listenFor(newEars) {
  // Merges the ears stored in newEars into allEars
  for (var obj in newEars) {
    if (newEars.hasOwnProperty(obj)) {
      // Find the object, creating it if necessary
      allEars[obj] = allEars[obj] || [];
      var oldObj = allEars[obj];
      // For every event listener in the object...
      for (var newEventListener in newEars[obj]) {
        if (newEars[obj].hasOwnProperty(newEventListener)) {
          // ... merge it into allEars, creating it if necessary.
          oldObj[newEventListener] = oldObj[newEventListener] || [];
          oldObj[newEventListener].splice(-1, 0, newEars[obj][newEventListener]);
        }
      }
    }
  }
}

function addEars(objType, obj) {
  // Add event handlers for an obj of type objType.

  // ...But which ears should we add?
  var objEvents = allEars[objType];
  if (!objEvents) {
    // We don't know anything about that object
    return false;
  }

  for (var eventType in objEvents) {
    // Add each event type
    if (objEvents.hasOwnProperty(eventType)) {
      var events = objEvents[eventType];
      // Add each event in objEvents[eventTypes]
      for (var i=0,l=events.length; i<l; i++) {
        obj.addListener(eventType, events[i]);
      }
    }
  }
}

// These ears contain objects.
// These objects contain events that are emitted with eventEmitter.event and
// listened for with eventEmitter.addListener.
// these events contain lists of functions.
var allEars = {
  'MatchList':
    {
      // remember to put these in lists!
      'newMatch': [function(match) {
        addEars('Match', match);
      }]
    }
};

process.mixin(exports,
  {
    //allEars: allEars,
    listenFor: listenFor,
    addEars: addEars
  }
);