/*
 * ui.js -- rendering the page UI
 * requires jquery
 **/

var courier = courier || {};

courier.ui = (function() { // begin courier namespace
    function RenderRobotRow(jq, robot) {
      // this function will render the given robot as a row to the given
      // jquery object
      if (robot.name) {
        jq.text("<\"" + robot.name + "\", armor: " + robot.armor + ">");
      } else {
        jq.text("(unconnected robot)");
      }
    }

    function RenderMatchRow(jq, match) {
      // this function will render the given match as a row to the given
      // jquery object
      match.populate(false,
        function () {
          jq.html("Time created: " + match.initTime);
          jq.append("<br />Started? " + match.started);
          jq.append("<br />Private? " + match['private']);
          var robotList = $("<ul>").appendTo(jq);
          $.each(match.robots, function(i, robot) {
            // todo: render robot to robotList
            RenderRobotRow($("<li>").appendTo(robotList), robot);
          });
        });
    }


    function RenderMatchList(jq) {
      // this object will render the match list into the jQuery object jq
      // (given)
      var ml = new courier.matchlist.MatchList();
      var mljq = jq.empty();
      var mlLoading = $("<div>One moment...</div>").appendTo(mljq);
      ml.onNewMatch(
        function(match) {
          var matchJq = $("<li>Match " +
              "<a href='/matches/" + match.mid + "'>" + match.mid + "</a>" +
              "</li>").appendTo(mljq);
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

    function RenderRobotList(m, list) {
      m.onNewSlot(
          function (rob) {
              console.log("new slot");
              console.log(m);
          });
      m.onConnectedRobot(
          function (rob) {
              console.log(m);
          });
      m.onDisconnectRobot(
          function (rob) {
              console.log(m);
          });
    }

    return {
      RenderMatchList: RenderMatchList,
      RenderRobotRow: RenderRobotRow,
      RenderMatchRow: RenderMatchRow,
      RenderRobotList: RenderRobotList,
      DrawField: DrawField
    };
})();
