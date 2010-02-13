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
      match.populate(
        function () {
          jq.html("Time created: " + match.init_time);
          jq.append("<br />Started? " + match.started);
          jq.append("<br />Private? " + match['private']);
          var robot_list = $("<ul>").appendTo(jq);
          $.each(match.robots, function(i, robot) {
            // todo: render robot to robot_list
            RenderRobotRow($("<li>").appendTo(robot_list), robot);
          });
        });
    }

    
    function RenderMatchList(jq) {
      // this object will render the match list into the jQuery object jq
      // (given)
      var ml = new courier.match.MatchList();
      var mljq = jq.empty();
      var ml_loading = $("<div>One moment...</div>").appendTo(mljq);
      ml.on_new_match(
        function(match) {
          var match_jq = $("<li>Match " + 
              "<a href='" + match.mid + "'>" + match.mid + "</a>" +
              "</li>").appendTo(mljq);
          RenderMatchRow($("<div>").appendTo(match_jq), match);
          ml.on_match_delete(match,
            function() {
              match_jq.fadeOut(function() {$(this).remove();});
            });
        });
      ml.populate(true,
        function() {
          ml_loading.remove();
        });
    }



    return {
      RenderMatchList: RenderMatchList,
      RenderRobotRow: RenderRobotRow,
      RenderMatchRow: RenderMatchRow
    };
})();
