"use strict";

import * as ansy              from "ansy";
import * as ipc               from "node-ipc";
import * as stack             from "callsite";
import * as util              from "util";
import * as moment            from "moment";
import { make as makeOutput } from "../common/output";

let started = false;
let broadcast: (event: string, data: any) => void = undefined;
let loggers: Logger[] = [];

export enum Mode {
	DISABLED = "disabled",
	CONSOLE = "console",
	IPC = "ipc"
}

export function init(appName: string, mode: Mode) {
	if (started) {
		throw new Error("Can't init the logger more than once.");
	}

	started = true;

	switch (mode) {
		case Mode.IPC:
			ipc.config.silent = true;
			ipc.connectTo(appName);
			broadcast = (event, data) => ipc.of[appName].emit(event, data);
			break;

		case Mode.CONSOLE:
			let { create, message } = makeOutput();
			broadcast = (event, data) => {
				switch (event) {
					case "create": create(data); break;
					case "message": message(data); break;
				}
			}
			break;

		case Mode.DISABLED:
			broadcast = (event, data) => undefined; // noop
			break;

		default:
			throw new Error(`Unknown broadcast mode ${mode}`);
	}
}

export function make(loggerName: string): CallableLogger {
	if (!started) {
		throw new Error("Can't make a logger until init() is called.");
	}

	let log = new Logger(loggerName) as CallableLogger;
	loggers.push(log);
	log.announce();
	return log;
}

export interface CallableLogger extends Logger {
	(...args: any[]): void;
}

export class Logger {
	private colormap: Map<string, (str: string) => string>;
	public silent: boolean;
	public name: string;
	public showDelta: boolean;
	public lastTime: number;
	public showCallsite: boolean;
	public indentLevel: number;

	public constructor(name: string) {
		this.silent = true;
		this.name = name;

		this.colormap = new Map();

		this.colormap.set("black",   (x) => "\x1b[30m" + x + "\x1b[39m");
		this.colormap.set("red",     (x) => "\x1b[31m" + x + "\x1b[39m");
		this.colormap.set("green",   (x) => "\x1b[32m" + x + "\x1b[39m");
		this.colormap.set("yellow",  (x) => "\x1b[33m" + x + "\x1b[39m");
		this.colormap.set("blue",    (x) => "\x1b[34m" + x + "\x1b[39m");
		this.colormap.set("magenta", (x) => "\x1b[35m" + x + "\x1b[39m");
		this.colormap.set("cyan",    (x) => "\x1b[36m" + x + "\x1b[39m");
		this.colormap.set("white",   (x) => "\x1b[37m" + x + "\x1b[39m");
		this.colormap.set("gray",    (x) => "\x1b[30m" + x + "\x1b[39m");
		this.colormap.set("default", (x) => "\x1b[39m" + x + "\x1b[39m");
		this.colormap.set("bold",    (x) => "\x1b[1m"  + x + "\x1b[0m");

		this.colormap.set("info",    this.colormap.get("blue"));
		this.colormap.set("warn",    this.colormap.get("yellow"));
		this.colormap.set("error",   this.colormap.get("red"));
		this.colormap.set("ok",      this.colormap.get("green"));
		this.colormap.set("verbose", this.colormap.get("gray"));

		this.indentLevel = 0;

		return new Proxy((...args: any[]) => this.log(...args), {
			get: (_, prop) => {
				return (this as any)[prop];
			},
			set: (_, prop, val) => {
				(this as any)[prop] = val;
				return true;
			}
		}) as CallableLogger;
	}

	public announce(): void {
		broadcast("create", { logger: this.name });
	}

	private transform(args: any[], fn: (arg: string) => string = (x) => x): string {
		let indentStr = new Array(4 * this.indentLevel + 1).join(" ");

		return this.colorize(args.map(this.inspect).join(" "))
			.split("\n")
			.map(fn)
			.map((s) => indentStr + s)
			.join("\n");
	}

	private send(message: string): void {
		if (this.silent) {
			return;
		}

		let time = Date.now();

		let data: LoggerMessageData = {
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

	public log(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args));
	}

	public info(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args, this.colormap.get("info")));
	}

	public warn(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args, this.colormap.get("warn")));
	}

	public error(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args, this.colormap.get("error")));
	}

	public ok(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args, this.colormap.get("ok")));
	}

	public verbose(...args: any[]): void {
		if (this.silent) {
			return;
		}

		this.send(this.transform(args, this.colormap.get("verbose")));
	}

	public line(amount?: number): void {
		if (this.silent) {
			return;
		}

		amount = amount || 1;
		for (let i = 0; i < amount; i++) {
			this.log();
		}
	}

	// public divider(text: string, divider?: string): void {
	// 	if (this.silent) {
	// 		return;
	// 	}

	// 	this.line(2);

	// 	if (divider === undefined) {
	// 		divider = "#";
	// 	}

	// 	let outputBuffer: any = process.stdout;
	// 	text = " " + text + " ";
	// 	let len: number = outputBuffer.getWindowSize()[0] - 2;

	// 	while (text.length + 2 * divider.length <= len) {
	// 		text = divider + text + divider;
	// 	}

	// 	while (text.length + divider.length <= len) {
	// 		text = text + divider;
	// 	}

	// 	write(this.color("\u25cf ") + text + "\n");

	// 	this.line();
	// }

	public timestamp(): void {
		if (this.silent) {
			return;
		}

		this.log(moment().format("YYYY-MM-DD HH:mm:ss"));
	}

	public indent(amount?: number) {
		if (this.silent) {
			return;
		}

		this.indentLevel += amount || 1;
	}

	public unindent(amount?: number) {
		if (this.silent) {
			return;
		}

		this.indentLevel -= amount || 1;
		this.indentLevel = Math.max(this.indentLevel, 0);
	}

	public setColor(name: string, color: string): void {
		if (this.silent) {
			return;
		}

		let code = ansy.fg.hex(color);
		this.colormap.set(name, (x) => `${code}${x}\x1b[39m`);
	}

	private getColorFn(name: string): (str: string) => string {
		if (this.colormap.has(name)) {
			return this.colormap.get(name);
		} else {
			return (x) => ansy.fg.hex(name) + x + "\x1b[39m";
		}
	}

	private colorize(str: string): string {
		let regex = new RegExp("(</?" + Array.from(this.colormap.keys()).join(">|</?") + ">|</?#[0-9a-fA-F]{6}>|</>|<//>)");
		let parts = str.split(regex);
		let stack: string[] = [];
		let result = "";

		parts.forEach((part: string) => {
			if (regex.exec(part)) {
				let color = part.substring(1, part.length - 1);
				if (color.charAt(0) === "/") {
					color = color.substring(1);

					if (color === "" || stack[stack.length - 1] === color) {
						stack.pop();
					} else if (color === "/") {
						stack = [];
					} else {
						throw new SyntaxError(`Tag mismatch - "${stack[stack.length - 1]}" tag closed with "${color}"`);
					}
				} else {
					stack.push(color);
				}
			} else {
				if (stack.length === 0) {
					result += part;
				} else {
					let colorfn: (str: string) => string = this.getColorFn(stack[stack.length - 1]);
					result += part.split("\n").map(colorfn).join("\n");
				}
			}
		});

		if (stack.length > 0) {
			throw new SyntaxError(`Tag mismatch - "${stack[stack.length - 1]}" tag has no closing tag`);
		}

		return result;
	}

	private inspect(arg: any): string {
		if (typeof arg === "object") {
			return util.inspect(arg, { colors: true });
		} else if (arg === undefined) {
			return "undefined";
		} else {
			return arg;
		}
	}
}
