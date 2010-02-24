/*
 * drawing.js -- manipulating <canvas > elements for great justice.
 * requires jquery
 **/

var courier = courier || {};

courier.drawing = (function() { // begin courier namespace

    function withTransform(ctx, width, height, wantWidth, wantHeight, cb) {
      ctx.save();
      // we have:
      // lower left is 0, height
      // upper right is width, 0
      // we want:
      // lower left corner to be 0, 0
      // upper right corner to be 1000, 1000
      ctx.translate(0, height);
      ctx.scale((width/wantWidth), -(height/wantHeight));
      cb();
      ctx.restore();
    }

    function drawRobot(ctx, width, height, rob) {
      // Renders a robot at location with rotation and a certain color.
      ctx.save();
          ctx.translate(rob.location[0], rob.location[1]);
          ctx.rotate(-rob.rotation);
          ctx.beginPath();
          ctx.moveTo(0, 25);
          ctx.lineTo(15, -15);
          ctx.lineTo(0, -10);
          ctx.lineTo(-15, -15);
          ctx.fill();
      ctx.restore();
    }

    function renderField(field, jq) {
      // This gets run at every field update.
      // field: {"width": 1024, heigth: 1025,
      //    "objects": [
      //           {'type': 'robot', 'location': [23, 35], ...}
      //        ]
      // }
      var ctx = jq[0].getContext('2d');
      var width = jq[0].width;
      var height = jq[0].height;
      ctx.clearRect(0,0,width,height);
      withTransform(ctx, width, height, field.width, field.height,
        function() {
          for (var i=0,l=field.objects.length; i<l; i++) {
            switch (field.objects[i].type) {
              case 'robot':
                drawRobot(ctx, width, height, field.objects[i]);
                break;
            }
          }
        });
    }

    function followField(m, jq) {
      // We'll set up our field so that when M updates, the <canvas /> in jq
      // will too.
      m.onFieldUpdate(
        function(field) {
          renderField(field, jq);
        });
    }

    return {
      followField: followField
    };
})(); // end courier namespace
