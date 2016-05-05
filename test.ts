"use strict";

import * as log  from "./index";

let data = { // from PokeAPI
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


try {
	log.divider("TESTING GENERAL FUNCTIONALITY");

	log.log("log (default)");
	log.info("info (blue)");
	log.warn("warn (yellow)");
	log.error("error (red)");
	log.verbose("verbose (gray)");
	log.ok("ok (green)");

	log.log(data);

	log.log(undefined, null, [], "", false);


	log.divider("TESTING COLOR TAGS");

	log.log("<gray><blue>beautiful-log</blue> can be used to higlight important <magenta>keywords</magenta> that may be relevant to <red>errors</red>.</gray>");
	log.log("<#0044ff>What a lovely blue</#0044ff>");
	log.log("<#ff8700>The color of autumn</#ff8700>");
	log.log("<blue>GOTTA CLOSE FAST</>");
	log.log("<blue>GOTTA CLOSE <yellow>FASTER <red>FASTER <green>FASTER FASTER FASTER<//>");



	log.divider("TESTING HOOKS");

	log.addFormat("numbers", "%10d %10d");
	log.logf("numbers", 1234567890, 987654);

	log.addFormat("magenta", "<magenta>%s</magenta>");
	log.logf("magenta", "magenta");



	log.divider("TESTING FUNCTION NAME");

	function fnNameTest() {
		log.log("This log came from a function called 'fnNameTest'.");
	}

	fnNameTest();



	log.divider("TESTING CUSTOM COLOR NAMES");

	log.addColor("purple-af", "#af00af");
	log.log("<purple-af>this color is purple af</purple-af>");



	log.divider("TESTING INDENTS");

	log.indent();
	log.log("Indent = 1");
	log.indent(2);
	log.log("Indent = 3");
	log.unindent();
	log.log("Indent = 2");
	log.unindent(2);
	log.log("Indent = 0");



	log.divider("TESTING TIMESTAMP");

	log.timestamp();



	log.divider("ALTERNATE DIVIDER CHARACTER", "-");
} catch (e) {
	log.error("FAILED - LogError thrown.");
	log.error(e);
}


log.divider("TESTING ERROR CONDITIONS");
log.info("All of the following should print a test number and description, a green OK, and a description of what error was raised.");
log.info("Nothing else should be printed.");

log.line(3);
log.log("Test 1. Invalid format string");

try {
	log.addFormat("int", "%d");
	log.logf("int", "FAILED");
} catch (e) {
	log.ok("OK");
	log.verbose(e);
}

log.line();
log.log("Test 2. Unclosed color tag");

try {
	log.log("<red>FAILED");
} catch (e) {
	log.ok("OK");
	log.verbose(e);
}

log.line();
log.log("Test 3. Mismatched color tag");

try {
	log.log("<red>FAILED</magenta>");
} catch (e) {
	log.ok("OK");
	log.verbose(e);
}


log.divider("TESTING IS COMPLETE", "~");
