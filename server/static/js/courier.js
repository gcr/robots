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
