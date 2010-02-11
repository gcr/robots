/*
 * courier.js -- utilities for courier
 * requires jquery
 **/

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
    var self = this;
    self.mid = id;
    self.url = "/matches/" + id;
}
Match.prototype.render_list = function(jq) {
    // renders this match as if in a list, later refining ourselves to provide
    // better information.
    jq.html("<a class='match_" + this.mid +
            "' href='/matches/" + this.mid + "'>Match " +
            this.mid + "</a>");
    var match_info_jq = $("<div>one moment...</div>").appendTo(jq);
    ajaxRequest(this.url, {info: true}, function(minfo){
            match_info_jq.html("Time created: " + minfo.init_time);
            match_info_jq.append("<br />Started? " + minfo.started);
            match_info_jq.append("<br />Private? " + minfo['private']);
            var robot_list = $("<ul>").appendTo(match_info_jq);
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
    this.match_jq = {};
    this.populating = false;
}
MatchList.prototype.populate = function(jq, stream) {
    // list the active matches. if stream is true-ish, then follow the changes
    // made.
    if (this.populating) {
        // we're already waiting!
        return false;
    }
    this.populating = true;
    this.stop_listening();
    jq.text("One moment...");
    var self = this;
    ajaxRequest("/matches", {list: true}, function(matchstate) {
        var list = $("<ul></ul>");
        // retreive the list of matches
        for (var l=matchstate.matches.length, i=0; i < l; i++) {
            var m = new Match(matchstate.matches[i]);
            var m_jq = $("<li>").appendTo(list);
            m.render_list(m_jq);
            self.matches[m.mid] = m;
            self.match_jq[m.mid] = m_jq;
        }
        jq.html(list);
        if (stream) {
            self.sh = new StreamingHistory("/matches?history=t",
                matchstate.history,
                function (action) {
                    var m;
                    if ('added' in action) {
                        m = new Match(action.added);
                        var m_jq = $("<li>").appendTo(list).hide();
                        m.render_list(m_jq);
                        m_jq.fadeIn();
                        self.matches[action.added] = m;
                        self.match_jq[m.mid] = m_jq;
                    } else if ('removed' in action) {
                        m = self.matches[action.removed];
                        delete self.matches[action.removed];
                        self.match_jq[m.mid].fadeOut(function() {
                            self.match_jq[m.mid].remove();
                            delete self.match_jq[m.mid];
                        });
                    }
            });
        }
        // finish up; release the 'lock'
        self.populating = false;
    });
};
MatchList.prototype.stop_listening = function() {
    if (this.sh !== undefined) {
        this.sh.stop();
    }
};
