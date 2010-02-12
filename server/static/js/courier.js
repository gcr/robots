/*
 * courier.js -- utilities for courier
 * requires jquery
 **/

var courier = (function() { // begin courier namespace

function ajaxRequest(url, data, cb) {
    return $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'jsonp',
        data: data,
        success: function(data, textStatus) {
            if (typeof data == 'object' && 'client_error' in data) {
                alert("An error! " + data.client_error);
            } else {
                cb(data, textStatus);
            }
        },
        error: function(xhr, e, exception) {
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
    this.xhr = ajaxRequest(this.url, {since: this.state}, function (actions) {
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


/* ------------------ Robots --------------------- */
function Robot () {
    var r = arguments[0];
    if (typeof r == 'object' && r !== null) {
        this.name = r.name;
        this.armor = r.armor;
        this.heat = r.heat;
    }
    this.jq = $("<div>");
}
Robot.prototype.render_row = function() {
    if (this.name) {
        this.jq.html("<\"" + this.name + "\", armor: " + this.armor + ">");
    } else {
        this.jq.html("(no robot)");
    }
};


/* ------------------ Match list --------------------- */
function Match(id) {
    // Represents a match.
    this.mid = id;
    this.url = "/matches/" + id;
}
Match.prototype.render_list = function(jq) {
    // renders this match as if in a list, later refining ourselves to provide
    // better information.
    ajaxRequest(this.url, {info: true}, function(minfo){
            jq.html("Time created: " + minfo.init_time);
            jq.append("<br />Started? " + minfo.started);
            jq.append("<br />Private? " + minfo['private']);
            var robot_list = $("<ul>").appendTo(jq);
            $.each(minfo.robots, function(i, robj) {
                var robot = new Robot(robj);
                robot_list.append($("<li>").append(robot.jq));
                robot.render_row();
            });
    });
};

function MatchList() {
    // represents a new match list. run populate(jq) to populate into a jquery
    // object.
    this.matches = {};
    this.match_del_cb = {};
    this.populating = false;
    this.new_match_callback = undefined;
}
MatchList.prototype.populate = function(stream, cb) {
    // Get the list of matches, and run cb when we get them all.
    if (this.populating) {
        // we're already waiting!
        return false;
    }
    this.populating = true;
    var self = this;
    ajaxRequest("/matches", {list: true}, function(matchstate) {
        // retreive the list of matches
        for (var l=matchstate.matches.length, i=0; i < l; i++) {
            var m = new Match(matchstate.matches[i]);
            self.new_match(m);
        }
        if (typeof cb == 'function') {
            cb();
        }
        if (stream) {
            self.begin_stream(matchstate.history);
        }
        // finish up; release the 'lock'
        self.populating = false;
    });
};
MatchList.prototype.begin_stream = function(time) {
    // start streaming since 'time'
    var self = this;
    this.sh = new StreamingHistory("/matches?history=t",
        time,
        function (action) {
            if ('added' in action) {
                self.new_match(new Match(action.added));
            } else if ('removed' in action) {
                self.remove_match(self.matches[action.removed]);
            }
        });
};
MatchList.prototype.stop_stream = function() {
    // stop streaming
    if (this.sh !== undefined) {
        this.sh.stop();
    }
};
MatchList.prototype.on_new_match = function(cb) {
    // run the specified callback when a new match appears!
    this.new_match_callback = cb;
};
MatchList.prototype.new_match = function(match) {
    // add the match to us
    this.matches[match.mid] = match;
    if (typeof this.new_match_callback == 'function') {
        this.new_match_callback(match);
    }
};
MatchList.prototype.on_match_delete = function(match, cb) {
    // be sure to run this callback when we delete a match.
    this.match_del_cb[match.mid] = cb;
};
MatchList.prototype.remove_match = function(match) {
    // delete the given match.
    if (typeof this.match_del_cb[match.mid] == 'function') {
        this.match_del_cb[match.mid](match);
    }
    delete this.matches[match.mid];
};


// public methods
return {
    ajaxRequest: ajaxRequest,
    StreamingHistory: StreamingHistory,
    Robot: Robot,
    Match: Match,
    MatchList: MatchList
};

})();  // end courier namespace
