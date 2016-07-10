"use strict";
const ansy = require("ansy");
const stack = require("callsite");
const sprintf_js_1 = require("sprintf-js");
const util = require("util");
const moment = require("moment");
const TAG_WIDTH = 40;
const TAG_FORMAT = "[(%s) %s:%d]";
const MSG_FORMAT = "%-" + TAG_WIDTH + "s %s%s";
const FORMATS = new Map();
const STYLE_REGEX = /(<[#\w-]*>|<\/[#\w-]*>|<\/\/>)/g;
const COLOR_FN_MAP = new Map();
const stdout = console.log;
const stderr = console.error;
let tagPlaceholder = "";
for (let i = 0; i < TAG_WIDTH; i++) {
    tagPlaceholder += " ";
}
COLOR_FN_MAP.set("black", (x) => "\x1b[30m" + x + "\x1b[39m");
COLOR_FN_MAP.set("red", (x) => "\x1b[31m" + x + "\x1b[39m");
COLOR_FN_MAP.set("green", (x) => "\x1b[32m" + x + "\x1b[39m");
COLOR_FN_MAP.set("yellow", (x) => "\x1b[33m" + x + "\x1b[39m");
COLOR_FN_MAP.set("blue", (x) => "\x1b[34m" + x + "\x1b[39m");
COLOR_FN_MAP.set("magenta", (x) => "\x1b[35m" + x + "\x1b[39m");
COLOR_FN_MAP.set("cyan", (x) => "\x1b[36m" + x + "\x1b[39m");
COLOR_FN_MAP.set("white", (x) => "\x1b[37m" + x + "\x1b[39m");
COLOR_FN_MAP.set("gray", (x) => "\x1b[30m" + x + "\x1b[39m");
COLOR_FN_MAP.set("default", (x) => "\x1b[39m" + x + "\x1b[39m");
COLOR_FN_MAP.set("blink", (x) => "\x1b[5m" + x + "\x1b[0m");
const INDENT_WIDTH = 4;
let oneIndent = "";
for (let i = 0; i < INDENT_WIDTH; i++) {
    oneIndent += " ";
}
let fullIndent = "";
function print(str, printfn, color) {
    let caller = stack()[2];
    let tag = sprintf_js_1.sprintf(TAG_FORMAT, caller.getFunctionName() || "anonymous", caller.getFileName().split("/").pop(), caller.getLineNumber());
    str = str.replace(/\n/g, "\n" + tagPlaceholder + fullIndent);
    let toPrint = sprintf_js_1.sprintf(MSG_FORMAT, tag, fullIndent, str);
    printfn(color(toPrint));
}
function inspect(arg) {
    if (typeof arg === "object") {
        return util.inspect(arg, { colors: true });
    }
    else if (arg === undefined) {
        return "undefined";
    }
    else {
        return arg;
    }
}
function verbose(...args) {
    print(args.map(inspect).join(" "), stdout, getColorFn("gray"));
}
exports.verbose = verbose;
function log(...args) {
    print(args.map(inspect).join(" "), stdout, colorize);
}
exports.log = log;
function info(...args) {
    print(args.map(inspect).join(" "), stdout, getColorFn("blue"));
}
exports.info = info;
function warn(...args) {
    print(args.map(inspect).join(" "), stdout, getColorFn("yellow"));
}
exports.warn = warn;
function error(...args) {
    print(args.map(inspect).join(" "), stderr, getColorFn("red"));
}
exports.error = error;
function ok(...args) {
    print(args.map(inspect).join(" "), stdout, getColorFn("green"));
}
exports.ok = ok;
function indent(amount) {
    if (amount === undefined) {
        amount = 1;
    }
    for (let i = 0; i < amount; i++) {
        fullIndent += oneIndent;
    }
}
exports.indent = indent;
function unindent(amount) {
    if (amount === undefined) {
        amount = 1;
    }
    let rem = INDENT_WIDTH * amount;
    fullIndent = fullIndent.substring(rem);
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
    line(2);
    stdout(text);
    line();
}
exports.divider = divider;
function timestamp() {
    print(moment().format("YYYY-MM-DD HH:mm:ss"), stdout, colorize);
}
exports.timestamp = timestamp;
function logf(format, ...args) {
    if (FORMATS.has(format)) {
        print(sprintf_js_1.sprintf(FORMATS.get(format), ...args), stdout, colorize);
    }
    else {
        print(sprintf_js_1.sprintf(format, ...args), stdout, colorize);
    }
}
exports.logf = logf;
function line(count) {
    if (count === undefined) {
        count = 1;
    }
    for (let i = 0; i < count; i++) {
        stdout("\n");
    }
}
exports.line = line;
function addFormat(name, format) {
    FORMATS.set(name, format);
}
exports.addFormat = addFormat;
function addColor(name, color) {
    COLOR_FN_MAP.set(name, (x) => ansy.fg.hex(color) + x + "\x1b[39m");
}
exports.addColor = addColor;
function getColorFn(name) {
    if (COLOR_FN_MAP.has(name)) {
        return COLOR_FN_MAP.get(name);
    }
    else {
        return (x) => ansy.fg.hex(name) + x + "\x1b[39m";
    }
}
function colorize(str) {
    let parts = str.split(STYLE_REGEX);
    let stack = [];
    let result = "";
    parts.forEach((part) => {
        if (STYLE_REGEX.exec(part)) {
            let color = part.substring(1, part.length - 1);
            if (color.charAt(0) === "/") {
                color = color.substring(1);
                if (color === "" || stack[stack.length - 1] === color) {
                    stack.pop();
                }
                else if (color === "/") {
                    stack = [];
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
                let colorfn = getColorFn(stack[stack.length - 1]);
                result += colorfn(part);
            }
        }
    });
    if (stack.length > 0) {
        throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag has no closing tag");
    }
    return result;
}
