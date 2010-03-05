// Logging utilities.
var sys = require('sys'),
    begin_bracket = "\u23a1 ",
    mid_bracket   = "\u23a2 ",
    end_bracket   = "\u23a3 ",
    single_bracket = "[ ",
    reset_code = '\x1b[0m';

function makeLogger(esc_code) {
  return function(text) {
    var t = text.split("\n");
    sys.print('\n');
    if (t.length > 1) {
      for (var i=0, l=t.length; i<l; i++) {
        sys.print(esc_code);
        sys.print(i===0? begin_bracket : i===l-1? end_bracket : mid_bracket);
        sys.print(reset_code);
        sys.puts(t[i]);
      }
    } else {
      sys.puts(esc_code + single_bracket + reset_code + text);
    }
  };
}

process.mixin(exports, {
  debug:  makeLogger('\x1b[32;1m'), // Green
  info:  makeLogger('\x1b[34;1m'), // Blue
  warn:  makeLogger('\x1b[33;1m'), // Yellow
  error:  makeLogger('\x1b[31;1m') // Red
});