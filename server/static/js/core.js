/*
 * courier.js -- utilities for courier
 * requires jquery
 **/

var courier = courier || {};

courier.core = (function() { // begin courier namespace

function ajaxRequest(url, data, cb) {
  return $.ajax({
    url: url,
    dataType: 'jsonp',
    jsonp: 'jsonp',
    data: data,
    success:
      function(data, textStatus) {
        if (typeof data == 'object' && 'exception' in data) {
          alert("An error appears: " + data.exception);
        } else {
          cb(data, textStatus);
        }
      },
    error:
      function(xhr, e, exception) {
        if (e == 'timeout') {
          ajaxRequest(url, data, cb);
        } else {
          alert("Network error: " + e);
        }
      }
  });
}

function StreamingHistory(url, startTime, cb) {
  // This object will run a callback when something on the server changes.
  // Give it a URL to ping and a callback to execute whenever that
  // happens and it'll go on its way. Whenever the server does something,
  // the callback will run with the server's response. This is done in such
  // a way so you won't ever skip history you missed.
  // See: history.js
  this.cb = cb;
  this.url = url;
  this.time = startTime;

  var self = this;
  if (startTime == -1) {
    // they don't know what time they're at? uh oh! we'd best tell them,
    // but this is bad because they're going to miss things! it's always
    // better to pass the time in as an argument.
    this.xhr = ajaxRequest(url, {}, function(startTime, textStatus) {
      self.time = startTime;
      self.nextHist();
    });
  } else {
    this.nextHist();
  }
}
StreamingHistory.prototype.nextHist = function() {
  // Carry out the next action in the history, calling callback if we get
  // anything.
  var self = this;
  this.xhr = ajaxRequest(this.url, {since: this.time},
    function (actions) {
      for (var i = 0, l = actions.length; i < l; i++) {
        self.cb(actions[i]);
        self.time++;
      }
      self.nextHist();
    });
};
StreamingHistory.prototype.stop = function() {
  if (this.xhr !== undefined) {
    this.xhr.abort();
  }
};

// Many thanks to http://www.quirksmode.org/js/cookies.html for this code.
function createCookie(name,value,days) {
  var expires;
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	} else {
    expires = "";
  }
	document.cookie = name+"="+value+expires+"; path=/";
}
function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)===' ') {
      c = c.substring(1,c.length);
    }
		if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length,c.length);
    }
	}
	return null;
}
function eraseCookie(name) {
	createCookie(name,"",-1);
}

// nodejs-inspired event emitters.
function EventEmitter() {
  this.events = {};
}
EventEmitter.prototype.addListener = function(type, listener) {
  this.events[type] = this.events[type] || [];
  this.events[type].push(listener);
};
EventEmitter.prototype.emit = function(type) {
  if (type in this.events) {
    var listeners = this.events[type];
    for (var i=0,l=listeners.length; i<l; i++) {
        listeners[i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
};

// A generous thanks to node.js -- sys.js for this function (found:
// http://github.com/ry/node/blob/3238944c7aaef10ffa966b5e730204f24beead68/lib/sys.js )
function inherits(ctor, superCtor) {
  var tempCtor = function(){};
  tempCtor.prototype = superCtor.prototype;
  ctor.prototype = new tempCtor();
  ctor.prototype.constructor = ctor;
}

return {
  ajaxRequest: ajaxRequest,
  StreamingHistory: StreamingHistory,
  createCookie: createCookie,
  readCookie: readCookie,
  eraseCookie: eraseCookie,
  EventEmitter: EventEmitter,
  inherits: inherits
};

})();  // end courier namespace
