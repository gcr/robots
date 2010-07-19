// Romot naming

var prefix = ("mega ultra super trady killer spectra power tera kilo giga " +
  "yocto proto buzzing sitting hyper canned scrapping astro " +
  "rubber advanced tasty optimized kingly brave final spinning burning " +
  "quantum illusion tracking mecha gray revolver cyborg psycho " +
  "sniper vulcan metal solid liquid laughing raging crying screaming " +
  "big slasher pyro fourier dashing nano functional object-oriented " +
  "procedural algorithmic javascript ruby python REBOL COBOL " +
  "INTERCAL visual_basic .NET secret invisible stock_market " +
  "confused awesome").split(' ');

var middle = ("planet star chrono duck endurer bot test " +
  "narwhal walrus eating razor spoon mountain typhoon hurricane " +
  "storm opponent foe loser tracker king royalty mech voltage fox " +
  "hound ocelot snake raven wolf mantis ninja octopus hawk owl " +
  "bison parliament congress ambassador spy scout heavy TCP " +
  "mime medic lawyer retailer sergeant colonel " +
  "turing babbage dijkstra gobel graham bach stroustrup sussman " +
  "steele air water fire penguin awesome landlord").split(' ');

var suffix = ("killer crusher atomizer shooter 2 2.0 9000 1000 3000 5000 " +
  "beta alpha prime robot bot buzzer sniper tank juggernaut man " +
  "eater bender zapper warrior bringer optimizer algorithm " +
  "transformer cruncher ultra overload").split(' ');

function pickCoolName() {
  // Pick a robot name for those too lazy (special?) to pick one themselves

  var use_suffix = Math.random() > 0.3;
  var grammar = use_suffix? [prefix, middle, suffix] : [prefix, middle];
  return grammar.map(
    function (set) {
      // take random member of each set
      return set[Math.floor(Math.random() * set.length)];
    }
  ).join(' ').replace(/_/g, ' ');
}

exports.pickCoolName = pickCoolName;
