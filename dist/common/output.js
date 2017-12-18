"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const START_MARKER = "●";
const CONTINUATION_MARKER = "|";
const END_MARKER = "+";
const SINGLE_MARKER = "●";
function make() {
    let channelMap = new Map();
    function create(data) {
        channelMap.set(data.logger, COLORS[channelMap.size % COLORS.length]);
        process.stdout.write(`${BOLD}${channelMap.get(data.logger)}${START_MARKER} ${data.logger}${CLEAR}\n`);
    }
    function message(data) {
        let lines = data.message.split("\n");
        let color = channelMap.get(data.logger);
        let message = " ";
        if (data.delta !== undefined) {
            message += `${color}[+${data.delta}ms]${CLEAR} `;
        }
        if (data.callsite !== undefined) {
            message += `[${data.callsite}] `;
        }
        if (lines.length === 1) {
            message = `${color}${SINGLE_MARKER}${CLEAR}` + message;
            message += lines[0];
            message += "\n";
        }
        else {
            message = `${channelMap.get(data.logger)}${START_MARKER}${CLEAR}` + message;
            message += lines.slice(0, lines.length - 1).join(`\n${channelMap.get(data.logger)}${CONTINUATION_MARKER}${CLEAR} `);
            message += `\n${channelMap.get(data.logger)}${END_MARKER}${CLEAR} `;
            message += lines[lines.length - 1];
            message += "\n";
        }
        process.stdout.write(message);
    }
    return { create, message };
}
exports.make = make;
