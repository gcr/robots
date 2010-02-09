/*
 * courier.js -- utilities for courier
 * requires jquery
 **/

function ajaxRequest(url, data, cb) {
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'jsonp',
        data: data,
        success: function(data, textStatus) {
            if (typeof data == 'object' && 'client_error' in data) {
                alert("An error! " + data['client_error']);
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
        },
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
        ajaxRequest(url, {get_state: true}, function(state, textStatus) {
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
    ajaxRequest(this.url, {since: this.state}, function (actions) {
        for (var i = 0, l = actions.length; i < l; i++) {
            self.cb(actions[i]);
            self.state++;
        }
        self.nextHist();
    });
}


/* ------------------ Match list --------------------- */
Match = function(id) {
    // Represents a match.
    var self = this;
    self.mid = id;
    self.url = "/matches/" + id;
    self.jq = $("<div>");
}
Match.prototype.render_list = function() {
    // renders this match as if in a list, later refining ourselves to provide
    // better information.
    this.jq.html("<a class='match_" + this.mid +
            "' href='/matches/" + this.mid + "'>Match " +
            this.mid + "</a>");
    var match_info_jq = $("<div>one moment...</div>").appendTo(this.jq);
    ajaxRequest(this.url, {info: true}, function(minfo){
            match_info_jq.html("Time created: " + minfo.init_time);
            match_info_jq.append("<br />Started? " + minfo.started);
            match_info_jq.append("<br />Private? " + minfo.private);
            var robot_list = $("<ul>").appendTo(match_info_jq);
            $.each(minfo.robots, function(i, robj) {
                var robot = new Robot(robj);
                robot_list.append($("<li>").append(robot.jq));
                robot.render_row();
            });
    });
}

jQuery.fn.courierMatchList = function() {
    // apply matchList to the specified jquery objects
    // do something like $("#match_list").courierMatchList(); and I'll handle
    // all the rest.
    var jq = this;
    var matches = {};
    jq.text("One moment...");
    var list = $("<ul></ul>");
    ajaxRequest("/matches", {list: true}, function(matchstate) {
        // retreive the list of matches
        for (var l=matchstate.matches.length, i=0; i < l; i++) {
            var m = new Match(matchstate.matches[i]);
            list.append(m.jq);
            m.render_list();
            matches[m.mid] = m;
        }
        jq.html(list);
        var sh = new StreamingHistory("/matches?history=t",
            matchstate.history,
            function (action) {
                if ('added' in action) {
                    var m = new Match(action.added);
                    list.append(m.jq.hide());
                    m.render_list();
                    m.jq.fadeIn();
                    matches[action.added] = m;
                } else if ('removed' in action) {
                    var m = matches[action.removed];
                    delete matches[action.removed];
                    m.jq.fadeOut(function() {
                        m.jq.remove();
                    });
                }
            });
    });
    return jq;
}


/* ------------------ Robots --------------------- */
function Robot () {
    var r = arguments[0]
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
}
