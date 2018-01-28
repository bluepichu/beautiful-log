"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ansy = require("ansy");
const ipc = require("node-ipc");
const stack = require("callsite");
const util = require("util");
const moment = require("moment");
const output_1 = require("../common/output");
let started = false;
let broadcast = (event, data) => undefined;
let loggers = [];
function init(appName, mode) {
    if (started) {
        throw new Error("Can't init the logger more than once.");
    }
    started = true;
    switch (mode) {
        case "ipc":
            ipc.config.silent = true;
            ipc.connectTo(appName);
            broadcast = (event, data) => ipc.of[appName].emit(event, data);
            break;
        case "console":
            let { create, message } = output_1.make();
            broadcast = (event, data) => {
                switch (event) {
                    case "create":
                        create(data);
                        break;
                    case "message":
                        message(data);
                        break;
                }
            };
            break;
        case "disabled":
            broadcast = (event, data) => undefined;
            break;
        default:
            throw new Error(`Unknown broadcast mode ${mode}`);
    }
    for (let logger of loggers) {
        logger.announce();
    }
}
exports.init = init;
function make(loggerName) {
    let log = new Logger(loggerName);
    loggers.push(log);
    return log;
}
exports.make = make;
class Logger {
    constructor(name) {
        this.silent = false;
        this.name = name;
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
        this.colormap.set("info", this.colormap.get("blue"));
        this.colormap.set("warn", this.colormap.get("yellow"));
        this.colormap.set("error", this.colormap.get("red"));
        this.colormap.set("ok", this.colormap.get("green"));
        this.colormap.set("verbose", this.colormap.get("gray"));
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
        broadcast("create", { logger: this.name });
    }
    transform(args, fn = (x) => x) {
        let indentStr = new Array(4 * this.indentLevel + 1).join(" ");
        return this.colorize(args.map(this.inspect).join(" "))
            .split("\n")
            .map(fn)
            .map((s) => indentStr + s)
            .join("\n");
    }
    send(message) {
        if (this.silent) {
            return;
        }
        let time = Date.now();
        let data = {
            logger: this.name,
            message,
            delta: this.showDelta && this.lastTime !== undefined ? time - this.lastTime : undefined
        };
        if (this.showCallsite) {
            let st = stack();
            let index = 1;
            while (st[index].getFileName().split("/").pop() === "beautiful-log.js") {
                index++;
            }
            let caller = st[index];
            data.callsite = `${caller.getFileName().split("/").pop()}:${caller.getLineNumber()}`;
        }
        broadcast("message", data);
        this.lastTime = time;
    }
    log(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args));
    }
    info(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args, this.colormap.get("info")));
    }
    warn(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args, this.colormap.get("warn")));
    }
    error(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args, this.colormap.get("error")));
    }
    ok(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args, this.colormap.get("ok")));
    }
    verbose(...args) {
        if (this.silent) {
            return;
        }
        this.send(this.transform(args, this.colormap.get("verbose")));
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
    inspect(arg) {
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
}
exports.Logger = Logger;
