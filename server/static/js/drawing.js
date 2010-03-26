/*
 * drawing.js -- manipulating <canvas > elements for great justice.
 * requires jquery
 **/

var courier = courier || {};

courier.drawing = (function() { // begin courier namespace

function Field(width, height, jq) {
  this.jq = jq;
  this.actual_width = jq[0].width;
  this.actual_height = jq[0].width;
  this.width = width;
  this.height = height;
  this.ctx = jq[0].getContext('2d');
}

Field.prototype.withTransform = function(cb) {
  var ctx = this.ctx;
  ctx.save();
  // we have:
  // lower left is 0, height
  // upper right is width, 0
  // we want:
  // lower left corner to be 0, 0
  // upper right corner to be 1000, 1000
  ctx.translate(0, this.actual_height);
  ctx.scale((this.actual_width/this.width), -(this.actual_height/this.height));
  cb(ctx);
  ctx.restore();
};

Field.prototype.drawRobot = function(rob) {
  // Renders a robot at location with rotation and a certain color.
  // Not really a proper robot object; more like a dictionary that the
  // server returns. See FieldObject.field_info()
  var ctx = this.ctx;
  ctx.save();
      ctx.translate(rob.location[0], rob.location[1]);
      ctx.rotate(-rob.rotation);
      ctx.beginPath();
      ctx.moveTo(0, 25);
      ctx.lineTo(15, -15);
      ctx.lineTo(0, -10);
      ctx.lineTo(-15, -15);
      ctx.fill();
      ctx.rotate(-rob.turret_rot);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(0, 30);
      ctx.stroke();
      if (rob.scan_mode == "robots") {
        // Scanning for robots
        ctx.beginPath();
        ctx.lineTo(0, 0);
        ctx.arc(0, 0,
            rob.scanrange, // radius
            3.14/2-rob.scan_width, // left
            3.14/2+rob.scan_width, // right
            false); // anticlockwise?
        ctx.lineTo(0, 0);
        ctx.stroke();
      } else if (rob.scan_mode == "wall") {
        // Sonar ping for wall
        for (var i = 5,r; i>0; i--) {
          r = Math.random()/2 + 0.5;
          ctx.beginPath();
          ctx.arc(0, 0, rob.scanrange*i/5*r, 3.14/2+0.2, 3.14/2-0.2, true);
          ctx.stroke();
        }
      }
      ctx.rotate(rob.turret_rot);
  ctx.restore();
};

Field.prototype.render = function(field) {
  // This gets run at every field update.
  // field: {"width": 1024, heigth: 1025,
  //    "objects": [ # see FieldObject.field_info() in fieldobject.py, robot.py
  //           {'type': 'robot', 'location': [23, 35], ...}
  //        ]
  // }
  var self = this;
  var ctx = this.jq[0].getContext('2d');

  ctx.clearRect(0,0,this.width,this.height);
  this.withTransform(
    function() {
      for (var i=0,l=field.objects.length; i<l; i++) {
        switch (field.objects[i].type) {
          case 'robot':
            self.drawRobot(field.objects[i]);
            break;
          case 'object':
            // default
            break;
        }
      }
    });
};

function followField(m, jq) {
  // We'll set up our field so that when M updates, the <canvas /> in jq
  // will too.
  var f = new Field(m.field_size[0], m.field_size[1], jq);
  var fdat;
  m.addListener('fieldUpdate',
    function(match, field_dat) {
      fdat = field_dat;
    });
  window.setInterval(
      function() {
        if (typeof fdat != 'undefined') {
          f.render(fdat);
        }
      }, 1000*m.speed);
}

return {
  followField: followField
};
})(); // end courier namespace
