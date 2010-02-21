/*
 * ui.js -- rendering the page UI
 * requires jquery
 **/

var courier = courier || {};

courier.ui = (function() { // begin courier namespace
    function RenderRobotRow(jq, robot) {
      // Render the given robot as a row to the given jquery object.
      if (robot) {
        jq.empty();
        jq.empty().text("<\"" + robot.name + "\", armor: " + robot.armor + ">");
      } else {
        jq.empty().text("(unconnected robot)");
      }
    }

    function RenderMatchRow(jq, match) {
      // Render a match inside of a match list or something.
      match.populate(false,
        function () {
          jq.html("Time created: " + match.initTime);
          jq.append("<br />Started? " + match.started);
          jq.append("<br />Public? " + match['public']);
          var robotList = $("<ul>").appendTo(jq);
          $.each(match.robots, function(i, robot) {
            // todo: render robot to robotList
            RenderRobotRow($("<li>").appendTo(robotList), robot);
          });
        });
    }

    function RenderMatchList(jq) {
      // Render the match list into the jQuery object jq (given).
      var ml = new courier.matchlist.MatchList();
      var mljq = jq.empty();
      var mlLoading = $("<div>One moment...</div>").appendTo(mljq);
      ml.onNewMatch(
        function(match) {
          var matchJq = $("<li>").append(
              $("<a>", {href: '/matches/' + match.mid}).append(match.mid)
            ).appendTo(mljq);
          RenderMatchRow($("<div>").appendTo(matchJq), match);
          ml.onMatchDelete(match,
            function() {
              matchJq.fadeOut(function() {$(this).remove();});
            });
        });
      ml.populate(true,
        function() {
          mlLoading.remove();
        });
    }

    function DrawField(match, field) {
      // Draw the field to the field() object.
      match.onFieldUpdate(
          function(field) {
            console.log(field);
          });
    }

    function WatchMatchRobots(m, list) {
      // Give me a match, and I'll be sure to keep list updated with the list
      // of robots. I'll watch to see whether they disconnect or if new ones
      // appear or whatever.
      var filled_slots = [],
          filled_slots_jq = $("<ul>").appendTo(list.append("Robots:")),
          empty_slots = [],
          empty_slots_jq = $("<ul>").appendTo(list.append("Waiting for connection:"));

      m.onNewSlot(
          function () {
            var e_slot_jq = $("<li>").appendTo(empty_slots_jq);
            RenderRobotRow(e_slot_jq, null);
            empty_slots[empty_slots.length] = e_slot_jq;
          });

      m.onConnectedRobot(
          function (rob) {
            // Take a slot from our pool of empty slots...
            var e_robot_jq = empty_slots.splice(0, 1)[0];
            // Add it to our filled slots...
            filled_slots[filled_slots.length] = e_robot_jq;
            // ...then rerender it.
            RenderRobotRow(e_robot_jq, rob);
            // Gotta do the same to our jquery too.
            e_robot_jq.detach().appendTo(filled_slots_jq);
            m.onDisconnectRobot(rob,
              function() {
                // find the robot in our filled slots and remove it. (See
                // above)
                for (var i = 0, l = filled_slots.length; i<l; i++) {
                  if (filled_slots[i] === e_robot_jq) {
                    filled_slots.splice(i, 1);
                    empty_slots[empty_slots.length] = e_robot_jq;
                    RenderRobotRow(e_robot_jq, null);
                    e_robot_jq.detach().appendTo(empty_slots_jq);
                  }
                }
              });
          });

      m.onRemoveSlot(
          function (rob) {
            var e_slot_jq = empty_slots.splice(0, 1)[0];
            e_slot_jq.remove();
          });
      m.onMatchStart(
          function () {
            console.log("Match started.");
          });
    }

    return {
      RenderMatchList: RenderMatchList,
      RenderRobotRow: RenderRobotRow,
      RenderMatchRow: RenderMatchRow,
      WatchMatchRobots: WatchMatchRobots,
      DrawField: DrawField
    };
})();
