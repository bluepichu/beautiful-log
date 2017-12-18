"use strict";

import * as ipc from "node-ipc";
import { make } from "../common/output";

const COLORS = [
	"\x1b[34m", // blue
	"\x1b[31m", // red
	"\x1b[33m", // yellow
	"\x1b[32m", // green
	"\x1b[36m", // cyan
	"\x1b[35m", // magenta
	"\x1b[37m"  // white
];

const BOLD = "\x1b[1m";
const CLEAR = "\x1b[0m";

let connected = false;
let appName = process.argv[2];

if (!appName) {
	console.error("Argument is required.");
	process.exit(1);
}

let channelMap = new Map<string, string>();

const START_MARKER = "●";
const CONTINUATION_MARKER = "|";
const END_MARKER = "+";
const SINGLE_MARKER = "●";

ipc.config.silent = true;
ipc.config.id = appName;

ipc.serve(() => {
	process.stdout.write("[LISTENING]\n");

	ipc.server.on("connect", () => {
		process.stdout.write("[CONNECTED]\n");
		connected = true;
	});

	ipc.server.on("socket.disconnected", () => {
		if (connected) {
			process.stdout.write("[DISCONNECTED]\n");
			connected = false;
			channelMap.clear();
		}
	});

	let { create, message } = make();

	ipc.server.on("create", (data: LoggerCreationData) => {
		create(data);
	});

	ipc.server.on("message", (data: LoggerMessageData) => {
		message(data);
	});
});

ipc.server.start();