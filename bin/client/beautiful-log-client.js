"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ipc = require("node-ipc");
const output_1 = require("../common/output");
const COLORS = [
    "\x1b[34m",
    "\x1b[31m",
    "\x1b[33m",
    "\x1b[32m",
    "\x1b[36m",
    "\x1b[35m",
    "\x1b[37m"
];
const BOLD = "\x1b[1m";
const CLEAR = "\x1b[0m";
let connected = false;
let appName = process.argv[2];
if (!appName) {
    console.error("Argument is required.");
    process.exit(1);
}
let channelMap = new Map();
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
    let { create, message } = output_1.make();
    ipc.server.on("create", (data) => {
        create(data);
    });
    ipc.server.on("message", (data) => {
        message(data);
    });
});
ipc.server.start();
