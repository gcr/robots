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
          alert("An error! " + data.client_error);
        } else {
          cb(data, textStatus);
        }
      },
    error:
      function(xhr, e, exception) {
        if (e == 'timeout') {
          ajaxRequest(url, data, cb);
        } else {
          alert("Oh no! An error appeared, and I can't fix it! " + e);
        }
      }
  });
}

function StreamingHistory() {
  // This object will run a callback when something on the server changes.
  // Give it a URL to ping and a callback to execute whenever that
  // happens and it'll go on its way. Whenever the server does something,
  // the callback will run with the server's response. This is done in such
  // a way so you won't ever skip history you missed.
}
StreamingHistory.prototype.beginStream = function(url, state, cb) {
  this.cb = cb;
  this.url = url;
  // how far we're going
  this.state = state;

  var self = this;
  if (this.state == -1) {
    // they don't know what state they're at? uh oh! we'd best tell them,
    // but this is bad because they're going to miss things!
    this.xhr = ajaxRequest(url, {get_state: true}, function(state, textStatus) {
      self.state = state;
      self.getNextHist();
    });
  } else {
    this.getNextHist();
  }
};
StreamingHistory.prototype.getNextHist = function() {
  /// Carry out the next action in the history, calling callback if we get
  /// anything.
  var self = this;
  this.xhr = ajaxRequest(this.url, {since: this.state},
    function (actions) {
      for (var i = 0, l = actions.length; i < l; i++) {
        self.cb(actions[i]);
        self.state++;
      }
      self.getNextHist();
    });
};
StreamingHistory.prototype.stop = function() {
  if (this.xhr !== undefined) {
    this.xhr.abort();
  }
};

function SlowStreamingHistory(group_time, trickle_time) {
  // This object is just like StreamingHistory, but it will group up things
  // together in a bunch and will trickle them over a period of time. e.g. "Fire
  // off actions every 0.5 seconds, make a request to the server every 5
  // seconds"

  // used as a queue; this DOES NOT correspond to this.state (e.g. when
  // starting out, this.state might be 25, which would correspond to
  // this.history[0])
  this.queue = [];
  this.group_time = group_time;
  this.trickle_time = trickle_time;
  StreamingHistory.call(this);
}

SlowStreamingHistory.prototype = new StreamingHistory();

SlowStreamingHistory.prototype.beginStream = function(url, state, cb) {
  // Begin our stream
  var self = this;
  // run this every self.trickle_time seconds: pop off the history
  window.setInterval(function() {
        console.log(self.queue);
        if (self.queue.length > 0) {
          self.cb(self.queue.shift());
        }
      }, 1000*this.trickle_time);
  StreamingHistory.prototype.beginStream.call(this, url, state, cb);
};

SlowStreamingHistory.prototype.getNextHist = function() {
  /// Carry out the next action in the history, calling callback if we get
  /// anything.
  var self = this;
  this.xhr = ajaxRequest(this.url, {since: this.state},
    function (actions) {
      for (var i = 0, l = actions.length; i < l; i++) {
        self.queue.push(actions[i]);
        self.state++;
      }
      // wait before getting the next history later.
      self.getNextHistTimer = window.setTimeout(
        function() {
          self.getNextHist();
        }, 1000*self.group_time);
    });
};


function createPropertySetters(obj, suffix, propList) {
  // assign some property setters for obj
  $.each(propList,
      function(i, prop) {
        obj.prototype[prop] = function(value) {
          // assign value to the property
          this[prop + suffix] = value;
        };
      });
}

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

return {
  ajaxRequest: ajaxRequest,
  StreamingHistory: StreamingHistory,
  SlowStreamingHistory: SlowStreamingHistory,
  createPropertySetters: createPropertySetters,
  createCookie: createCookie,
  readCookie: readCookie,
  eraseCookie: eraseCookie
};

})();  // end courier namespace
