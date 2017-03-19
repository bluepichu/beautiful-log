"use strict";
const ansy = require("ansy");
const stack = require("callsite");
const util = require("util");
const moment = require("moment");
let colorIndex = 0;
const COLORS = ["red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "black"];
function makeLogger(namespace, options) {
    let log = new Logger(namespace, options);
    log.announce();
    return log;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = makeLogger;
class Logger {
    constructor(namespace, options) {
        if (process.env["SILENT"]) {
            this.silent = true;
        }
        else {
            this.silent = false;
        }
        this.namespace = namespace;
        options = Object.assign({ showDelta: true }, options);
        this.colormap = new Map();
        this.colormap.set("black", (x) => "\x1b[30m" + x + "\x1b[39m");
        this.colormap.set("red", (x) => "\x1b[31m" + x + "\x1b[39m");
        this.colormap.set("green", (x) => "\x1b[32m" + x + "\x1b[39m");
        this.colormap.set("yellow", (x) => "\x1b[33m" + x + "\x1b[39m");
        this.colormap.set("blue", (x) => "\x1b[34m" + x + "\x1b[39m");
        this.colormap.set("magenta", (x) => "\x1b[35m" + x + "\x1b[39m");
        this.colormap.set("cyan", (x) => "\x1b[36m" + x + "\x1b[39m");
        this.colormap.set("white", (x) => "\x1b[37m" + x + "\x1b[39m");
        this.colormap.set("gray", (x) => "\x1b[30m" + x + "\x1b[39m");
        this.colormap.set("default", (x) => "\x1b[39m" + x + "\x1b[39m");
        this.colormap.set("bold", (x) => "\x1b[1m" + x + "\x1b[0m");
        if (options.color) {
            this.color = this.colormap.get(options.color);
        }
        else {
            this.color = this.colormap.get(COLORS[colorIndex++]);
        }
        if (options.showDelta) {
            this.showDelta = true;
        }
        else {
            this.showDelta = false;
        }
        if (options.showCallsite) {
            this.showCallsite = true;
        }
        else {
            this.showCallsite = false;
        }
        this.indentLevel = 0;
        return new Proxy((...args) => this.log(...args), {
            get: (_, prop) => {
                return this[prop];
            },
            set: (_, prop, val) => {
                this[prop] = val;
                return true;
            }
        });
    }
    announce() {
        if (this.silent) {
            return;
        }
        process.stdout.write(this.colormap.get("bold")(this.color(`\u25cf ${this.namespace}\n`)));
    }
    log(...args) {
        if (this.silent) {
            return;
        }
        let lines = this.colorize(args.map(inspect).join(" ")).split("\n");
        if (this.showCallsite) {
            let caller = stack()[2];
            lines[0] = this.color(`[${caller.getFileName().split("/").pop()}:${caller.getLineNumber()}] `) + lines[0];
        }
        if (this.showDelta && this.lastTime !== undefined) {
            lines[0] = this.color(`+${Date.now() - this.lastTime}ms `) + lines[0];
        }
        this.lastTime = Date.now();
        for (let i = 0; i < lines.length; i++) {
            if (i == 0) {
                process.stdout.write(this.color("\u25cf "));
            }
            else {
                process.stdout.write(this.color("| "));
            }
            for (let i = 0; i < this.indentLevel; i++) {
                process.stdout.write("    ");
            }
            process.stdout.write(lines[i]);
            process.stdout.write("\n");
        }
    }
    info(...args) {
        if (this.silent) {
            return;
        }
        this.log(args.map(inspect).join(" ").split("\n").map(this.colormap.get("blue")).join("\n"));
    }
    warn(...args) {
        if (this.silent) {
            return;
        }
        this.log(args.map(inspect).join(" ").split("\n").map(this.colormap.get("yellow")).join("\n"));
    }
    error(...args) {
        if (this.silent) {
            return;
        }
        this.log(args.map(inspect).join(" ").split("\n").map(this.colormap.get("red")).join("\n"));
    }
    ok(...args) {
        if (this.silent) {
            return;
        }
        this.log(args.map(inspect).join(" ").split("\n").map(this.colormap.get("green")).join("\n"));
    }
    verbose(...args) {
        if (this.silent) {
            return;
        }
        this.log(args.map(inspect).join(" ").split("\n").map(this.colormap.get("gray")).join("\n"));
    }
    line(amount) {
        if (this.silent) {
            return;
        }
        amount = amount || 1;
        for (let i = 0; i < amount; i++) {
            this.log();
        }
    }
    divider(text, divider) {
        if (this.silent) {
            return;
        }
        this.line(2);
        if (divider === undefined) {
            divider = "#";
        }
        let outputBuffer = process.stdout;
        text = " " + text + " ";
        let len = outputBuffer.getWindowSize()[0] - 2;
        while (text.length + 2 * divider.length <= len) {
            text = divider + text + divider;
        }
        while (text.length + divider.length <= len) {
            text = text + divider;
        }
        process.stdout.write(this.color("\u25cf ") + text + "\n");
        this.line();
    }
    timestamp() {
        if (this.silent) {
            return;
        }
        this.log(moment().format("YYYY-MM-DD HH:mm:ss"));
    }
    indent(amount) {
        if (this.silent) {
            return;
        }
        this.indentLevel += amount || 1;
    }
    unindent(amount) {
        if (this.silent) {
            return;
        }
        this.indentLevel -= amount || 1;
        this.indentLevel = Math.max(this.indentLevel, 0);
    }
    setColor(name, color) {
        if (this.silent) {
            return;
        }
        let code = ansy.fg.hex(color);
        this.colormap.set(name, (x) => `${code}${x}\x1b[39m`);
    }
    getColorFn(name) {
        if (this.colormap.has(name)) {
            return this.colormap.get(name);
        }
        else {
            return (x) => ansy.fg.hex(name) + x + "\x1b[39m";
        }
    }
    colorize(str) {
        let regex = new RegExp("(</?" + Array.from(this.colormap.keys()).join(">|</?") + ">|</?#[0-9a-fA-F]{6}>|</>|<//>)");
        let parts = str.split(regex);
        let stack = [];
        let result = "";
        parts.forEach((part) => {
            if (regex.exec(part)) {
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
                        throw new SyntaxError(`Tag mismatch - "${stack[stack.length - 1]}" tag closed with "${color}"`);
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
                    let colorfn = this.getColorFn(stack[stack.length - 1]);
                    result += part.split("\n").map(colorfn).join("\n");
                }
            }
        });
        if (stack.length > 0) {
            throw new SyntaxError(`Tag mismatch - "${stack[stack.length - 1]}" tag has no closing tag`);
        }
        return result;
    }
}
exports.Logger = Logger;
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
