"use strict";

const bl = require("../dist");
bl.init("bl-test", "console");

const log = bl.make("log1");
log.silent = false;
const log2 = bl.make("log2");
log2.silent = false;

let data = {
	"bulbasaur": {
		"id": 1,
		"name": "bulbasaur",
		"base_experience": 64,
		"height": 7,
		"is_default": true,
		"order": 1,
		"weight": 69,
		"types": ["grass", "poison"]
	}, "charmander": {
		"id": 4,
		"name": "charmander",
		"base_experience": 62,
		"height": 6,
		"is_default": true,
		"order": 5,
		"weight": 85,
		"types": ["fire"]
	}, "squirtle": {
		"id": 7,
		"name": "squirtle",
		"base_experience": 63,
		"height": 5,
		"is_default": true,
		"order": 10,
		"weight": 90,
		"types": ["water"]
	}
};

log.divider = () => undefined;

try {
	log.divider("TESTING GENERAL FUNCTIONALITY");
	log("log (default)");
	log.info("info (blue)");
	log.warn("warn (yellow)");
	log.error("error (red)");
	log.verbose("verbose (gray)");
	log.ok("ok (green)");
	log(data);
	log(undefined, null, [], "", false);
	log2("This message should have a different dot next to it.");
	log.divider("TESTING COLOR TAGS");
	log("<gray><blue>beautiful-log</blue> can be used to higlight important <magenta>keywords</magenta> that may be relevant to <red>errors</red>.</gray>");
	log("<#0044ff>What a lovely blue</#0044ff>");
	log("<#ff8700>The color of autumn</#ff8700>");
	log("<blue>GOTTA CLOSE FAST</>");
	log("<blue>GOTTA CLOSE <yellow>FASTER <red>FASTER <green>FASTER FASTER FASTER<//>");
	log("<green>Colors need to even work\nacross lines</green>")
	log.divider("TESTING CALLSITE");
	log.showCallsite = true;
	log(`This line should start with a file name and line number.`);
	log.showCallsite = false;
	log.divider("TESTING CUSTOM COLOR NAMES");
	log.setColor("purple-af", "#af00af");
	log("<purple-af>this color is purple af</purple-af>");
	log.divider("TESTING INDENTS");
	log.indent();
	log("Indent = 1");
	log.indent(2);
	log("Indent = 3");
	log.unindent();
	log("Indent = 2");
	log.unindent(2);
	log("Indent = 0");
	log.divider("TESTING TIMESTAMP");
	log.timestamp();
	log.divider("ALTERNATE DIVIDER CHARACTER", "-");
} catch (e) {
	console.error("FAILED - LogError thrown.");
	console.error(e);
}
log.divider("TESTING ERROR CONDITIONS");
log.info("All of the following should print a test number and description, a green OK, and a description of what error was raised.");
log.info("Nothing else should be printed.");
log("Test 1. Unclosed color tag");
try {
    log("<red>FAILED");
} catch (e) {
    log.ok("OK");
    log.verbose(e);
}
log("Test 2. Mismatched color tag");
try {
    log("<red>FAILED</magenta>");
} catch (e) {
    log.ok("OK");
    log.verbose(e);
}

log.divider("TESTING TIME DELTAS");

setTimeout(() => {
	log.showDelta = true;
	log("Delta should be about 1000ms.");
	log.showDelta = false;
	log.divider("TESTING IS COMPLETE", "~");
	process.exit(0); // Needed for the time being
}, 1000);
