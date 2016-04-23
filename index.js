"use strict";
const stack = require("callsite");
const colors = require("colors");
const sprintf_js_1 = require("sprintf-js");
const util = require("util");
const moment = require("moment");
const TAG_WIDTH = 40;
const TAG_FORMAT = "[(%s) %s:%d]";
const MSG_FORMAT = "%-" + TAG_WIDTH + "s %s%s";
const FORMATS = new Map();
const COLOR_REGEX = /(<black>|<red>|<green>|<yellow>|<blue>|<magenta>|<cyan>|<white>|<gray>|<grey>|<\/black>|<\/red>|<\/green>|<\/yellow>|<\/blue>|<\/magenta>|<\/cyan>|<\/white>|<\/gray>|<\/grey>)/g;
const COLOR_FN_MAP = new Map();
const INDENT_WIDTH = 4;
let INDENT = 0;
COLOR_FN_MAP.set("black", colors.black);
COLOR_FN_MAP.set("red", colors.red);
COLOR_FN_MAP.set("green", colors.green);
COLOR_FN_MAP.set("yellow", colors.yellow);
COLOR_FN_MAP.set("blue", colors.blue);
COLOR_FN_MAP.set("magenta", colors.magenta);
COLOR_FN_MAP.set("cyan", colors.cyan);
COLOR_FN_MAP.set("white", colors.white);
COLOR_FN_MAP.set("gray", colors.gray);
COLOR_FN_MAP.set("grey", colors.grey);
function print(str, printfn, colorize) {
    let caller = stack()[2];
    let tag = sprintf_js_1.sprintf(TAG_FORMAT, caller.getFunctionName() || "anonymous", caller.getFileName().split("/").pop(), caller.getLineNumber());
    let oneIndent = "";
    for (let i = 0; i < INDENT_WIDTH; i++) {
        oneIndent += " ";
    }
    let fullIndent = "";
    for (let i = 0; i < INDENT; i++) {
        fullIndent += oneIndent;
    }
    let toPrint = sprintf_js_1.sprintf(MSG_FORMAT, tag, fullIndent, str);
    printfn(colorize(toPrint));
}
function inspect(arg) {
    if (typeof arg === "object") {
        return util.inspect(arg, { colors: true });
    }
    else {
        return arg.toString();
    }
}
function verbose(...args) {
    print(args.map(inspect).join(" "), console.log, colors.gray);
}
exports.verbose = verbose;
function log(...args) {
    print(args.map(inspect).join(" "), console.log, colorize);
}
exports.log = log;
function info(...args) {
    print(args.map(inspect).join(" "), console.info, colors.blue);
}
exports.info = info;
function warn(...args) {
    print(args.map(inspect).join(" "), console.warn, colors.yellow);
}
exports.warn = warn;
function error(...args) {
    print(args.map(inspect).join(" "), console.error, colors.red);
}
exports.error = error;
function ok(...args) {
    print(args.map(inspect).join(" "), console.error, colors.green);
}
exports.ok = ok;
function indent(amount) {
    if (amount === undefined) {
        amount = 1;
    }
    INDENT += amount;
}
exports.indent = indent;
function unindent(amount) {
    if (amount === undefined) {
        amount = 1;
    }
    INDENT -= amount;
}
exports.unindent = unindent;
function divider(text, divider) {
    if (divider === undefined) {
        divider = "#";
    }
    let outputBuffer = process.stdout;
    text = " " + text + " ";
    let len = outputBuffer.getWindowSize()[0];
    while (text.length + 2 * divider.length <= len) {
        text = divider + text + divider;
    }
    while (text.length + divider.length <= len) {
        text = text + divider;
    }
    line();
    line();
    console.log(text);
    line();
}
exports.divider = divider;
function timestamp() {
    print(moment().format("YYYY-MM-DD HH:mm:ss"), console.log, colorize);
}
exports.timestamp = timestamp;
function logf(format, ...args) {
    if (FORMATS.has(format)) {
        print(sprintf_js_1.sprintf(FORMATS.get(format), ...args), console.log, colorize);
    }
    else {
        print(sprintf_js_1.sprintf(format, ...args), console.log, colorize);
    }
}
exports.logf = logf;
function line() {
    console.log();
}
exports.line = line;
function addFormat(name, format) {
    FORMATS.set(name, format);
}
exports.addFormat = addFormat;
function colorize(str) {
    let parts = str.split(COLOR_REGEX);
    let stack = [];
    let result = "";
    parts.forEach((part) => {
        if (COLOR_REGEX.exec(part)) {
            let color = part.substring(1, part.length - 1);
            if (color.charAt(0) === "/") {
                color = color.substring(1);
                if (stack[stack.length - 1] === color) {
                    stack.pop();
                }
                else {
                    throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag closed with </" + color + ">");
                }
            }
            else {
                stack.push(color);
            }
        }
        else {
            if (stack.length === 0) {
                result += part;
            }
            else {
                let colorfn = COLOR_FN_MAP.get(stack[stack.length - 1]);
                result += colorfn(part);
            }
        }
    });
    if (stack.length > 0) {
        throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag has no closing tag");
    }
    return result;
}
