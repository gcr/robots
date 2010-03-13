// robot.js -- OMG ROBOTS

function Robot(name) {


}

// def field_info(self):
//   # return enough information for the client to draw on the screen. This
//   # should usually be kept secret (ie not in self.__json__).
//   return {'type': 'robot',
//           'name': self.name,
//           'location': self.location,
//           'rotation': self.rotation,
//           'turret_rot': self.turret_rot,
//           'scan_mode': self.scan_mode,
//           'scan_width': self.scan_width,
//           'scanrange': self.scanrange,
//           'speed': self.speed}
//
Robot.prototype.toJson = function() {
  return {
    name: this.name,
    armor: this.armor,
    heat: 1000000
  };
};

process.mixin(exports,
  {
    Robot: Robot
  }
);
