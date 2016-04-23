# beautiful-log

Because logging should be easy and beautiful.

## Installation

`npm install beautiful-log`

## Usage

Please note that `beautiful-log` uses rest parameters to capture arguments, and thus requires Node to be run with the
`--harmony` flag.

```js
var log = require("beautiful-log");



////////// Basic logging //////////

log.log("log (default)");
log.info("info (blue)");
log.warn("warn (yellow)");
log.error("error (red)");
log.verbose("verbose (gray/grey)");
log.ok("ok (green)");

log.log("<magenta>Color tags are also supported <black>(even nested)</black> in log calls!</magenta>");
// Supported colors: default, black, red, green, yellow, blue, magenta, cyan, white, gray/grey

log.log({ objects: "can be logged as well, and are colorful", colorful: true });

// No matter how you log, the function name, file name, and line number from which you logged are logged as well



////////// Formatting and hooks //////////

log.logf("You can %s", "use format strings, too.");
// Powered by sprintf-js, so anything that's valid there is valid here

// You can also store a format string so you don't have to pass it many times...
log.addFormat("date", "%s %2d, %4d");
log.logf("date", "October", 23, 2077);
log.logf("date", "January", 1, 2000);



////////// Other features //////////

log.divider("DIVIDE");
// Prints a divider that looks like "###### DIVIDE ######", expanding to fill the full console width
// You can also pass a different divider character: log.divider("DIVIDE", "-");

logger.indent();
logger.log("This text is indented one level.");
logger.log("All text will be indented until the unindent is called.")
logger.indent();
logger.log("Multiple indentation levels work.");
logger.unindent(2);
logger.log("You can also pass a parameter to indent/unindent multiple times in one call.");
```