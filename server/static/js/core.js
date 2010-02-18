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
          alert("An error! " + e);
        }
      }
  });
}

function StreamingHistory(url, state, cb) {
  /// This object will run a callback when something on the server changes.
  /// Give it a URL to ping and a callback to execute whenever that
  /// happens and it'll go on its way. Whenever the server does something,
  /// the callback will run with the server's response. This is done in such
  /// a way so you won't ever skip history you missed.
  this.cb = cb;
  this.url = url;
  this.state = state;

  var self = this;
  if (this.state == -1) {
    // they don't know what state they're at? uh oh! we'd best tell them,
    // but this is bad because they're going to miss things!
    this.xhr = ajaxRequest(url, {get_state: true}, function(state, textStatus) {
      self.state = state;
      self.nextHist();
    });
  } else {
    this.nextHist();
  }
}
StreamingHistory.prototype.nextHist = function() {
  /// Carry out the next action in the history, calling callback if we get
  /// anything.
  var self = this;
  this.xhr = ajaxRequest(this.url, {since: this.state},
    function (actions) {
      for (var i = 0, l = actions.length; i < l; i++) {
        self.cb(actions[i]);
        self.state++;
      }
      self.nextHist();
    });
};
StreamingHistory.prototype.stop = function() {
  if (this.xhr !== undefined) {
    this.xhr.abort();
  }
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
  createPropertySetters: createPropertySetters,
  createCookie: createCookie,
  readCookie: readCookie,
  eraseCookie: eraseCookie
};

})();  // end courier namespace
