var log = require("./index");



////////// Basic Logging //////////

log.log("log (default)");
log.info("info (blue)");
log.warn("warn (yellow)");
log.error("error (red)");
log.verbose("verbose (gray/grey)");
log.ok("ok (green)");

log.log("<magenta>Color tags are also supported <black>(even nested)</black> in log calls!</magenta>");
// Default names: default, black, red, green, yellow, blue, magenta, cyan, white, gray/grey.

log.log("<#af00af>This color is purple af</#af00af>");
// You can also pass any hex color, which gets approximated for your terminal.

log.addColor("veljean", "#024601");
// You can also name your own colors...

log.log("<veljean>Your time is up and your parole's begun</veljean>")
// ...and use them just like the prenamed ones.

log.addColor("gray", "#333333");
// You can even overwrite the default ones if you don't like them.

log.log({ objects: "can be logged as well, and are colorful", colorful: true });
// This is done via util.inspect(), so whatever color settings you have for that will be preserved.

// No matter how you log, the function name, file name, and line number from which you logged are logged as well.



////////// Formatting and Saved Formats //////////

log.logf("You can %s", "use format strings, too.");
// Formatting is powered by sprintf-js, so anything that's valid there is valid here.

log.addFormat("date", "%s %2d, %4d");
log.logf("date", "October", 23, 2077);
log.logf("date", "January", 1, 2000);
// You can also store a format string so you don't have to pass it many times.



////////// Other features //////////

log.divider("DIVIDE");
// Prints a divider that looks like "###### DIVIDE ######", expanding to fill the full console width.

log.divider("-D-I-V-I-D-E-", "-");
// You can also pass a different divider character.

log.timestamp();
// Prints the current time.

log.line();
// Prints an empty line.

log.line(2);
// Prints many empty lines.

log.indent();
log.log("This text is indented one level.");
log.log("All text will be indented until the unindent is called.")
log.indent();
log.log("Multiple indentation levels work.");
log.unindent(2);
log.log("You can also pass a parameter to indent/unindent multiple times in one call.");