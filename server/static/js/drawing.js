/*
 * drawing.js -- manipulating <canvas > elements for great justice.
 * requires jquery
 **/

var courier = courier || {};

courier.drawing = (function() { // begin courier namespace

    function withTransform(ctx, width, height, cb) {
      ctx.save();
      // we have:
      // lower left is 0, height
      // upper right is width, 0
      // we want:
      // lower left corner to be 0, 0
      // upper right corner to be 1000, 1000
      ctx.translate(0, height);
      ctx.scale((width/1000), -(height/1000));
      cb();
      ctx.restore();
    }

    function drawRobot(ctx, width, height, location, rotation, color) {
      // Renders a robot at location with rotation and a certain color.
      ctx.save();
      withTransform(ctx, width, height, 
        function() {
          ctx.translate(location[0], location[1]);
          ctx.rotate(-rotation);
          ctx.beginPath();
          ctx.moveTo(0, 25);
          ctx.lineTo(15, -15);
          ctx.lineTo(0, -10);
          ctx.lineTo(-15, -15);
          ctx.fill();
        });
      ctx.restore();
    }

    var t = 0;

    function renderField(field, jq) {
      // This gets run at every field update.
      // jsonp1266794150747([{"field": {"width": 1024, "objects": [[[422,
      // 133], {"armor": 100, "heat": 0, "type": "robot", "name": "power
      // eating bot"}]], "height": 1024}}])
      var ctx = jq[0].getContext('2d');
      var width = jq[0].width;
      var height = jq[0].height;
      ctx.clearRect(0,0,width,height);
      drawRobot(ctx, width, height, [250, 333], t);
      t += 0.1;
      /*withTransform(ctx, width, height,
        function() {
          ctx.fillRect(250, 500, 500, 250);
        });*/
    }

    function followField(m, jq) {
      // We'll set up our field so that when M updates, the <canvas /> in jq
      // will too.
      renderField(m, jq);
      m.onFieldUpdate(
        function(field) {
          renderField(field, jq);
        });
    }

    return {
      followField: followField
    };
})(); // end courier namespace
