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

    function renderField(m, jq) {
      // We'll set up our field so that when M updates, jq will too.
      var ctx = jq[0].getContext('2d');
      var width = jq[0].width;
      var height = jq[0].height;
      ctx.clearRect(0,0,500,500);
      withTransform(ctx, width, height,
        function() {
          ctx.fillRect(250, 500, 500, 250);
        });
    }

    return {
      renderField: renderField
    };
})(); // end courier namespace
