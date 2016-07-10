"use strict";

import * as ansy            from "ansy";
import * as stack           from "callsite";
import {sprintf as sprintf} from "sprintf-js";
import * as util            from "util";
import * as moment          from "moment";

const TAG_WIDTH: number = 40;
const TAG_FORMAT: string = "[(%s) %s:%d]";
const MSG_FORMAT: string = "%-" + TAG_WIDTH + "s %s%s";
const FORMATS: Map<string, string> = new Map();
const STYLE_REGEX = /(<[#\w-]*>|<\/[#\w-]*>|<\/\/>)/g;
const COLOR_FN_MAP: Map<string, (str: string) => string> = new Map();

const stdout = console.log;
const stderr = console.error;

let tagPlaceholder: string = "";

for (let i = 0; i < TAG_WIDTH; i++) {
	tagPlaceholder += " ";
}

COLOR_FN_MAP.set("black",   (x) => "\x1b[30m" + x + "\x1b[39m");
COLOR_FN_MAP.set("red",     (x) => "\x1b[31m" + x + "\x1b[39m");
COLOR_FN_MAP.set("green",   (x) => "\x1b[32m" + x + "\x1b[39m");
COLOR_FN_MAP.set("yellow",  (x) => "\x1b[33m" + x + "\x1b[39m");
COLOR_FN_MAP.set("blue",    (x) => "\x1b[34m" + x + "\x1b[39m");
COLOR_FN_MAP.set("magenta", (x) => "\x1b[35m" + x + "\x1b[39m");
COLOR_FN_MAP.set("cyan",    (x) => "\x1b[36m" + x + "\x1b[39m");
COLOR_FN_MAP.set("white",   (x) => "\x1b[37m" + x + "\x1b[39m");
COLOR_FN_MAP.set("gray",    (x) => "\x1b[30m" + x + "\x1b[39m");
COLOR_FN_MAP.set("default", (x) => "\x1b[39m" + x + "\x1b[39m");

COLOR_FN_MAP.set("blink", (x) => "\x1b[5m" + x + "\x1b[0m");

const INDENT_WIDTH: number = 4;

let oneIndent: string = "";

for (let i = 0; i < INDENT_WIDTH; i++) {
	oneIndent += " ";
}

let fullIndent: string = "";

function print(str: string, printfn: (s: string) => void, color: (s: string) => string): void {
	let caller = stack()[2];
	let tag = sprintf(TAG_FORMAT,
		caller.getFunctionName() || "anonymous",
		caller.getFileName().split("/").pop(),
		caller.getLineNumber());

	str = str.replace(/\n/g, "\n" + tagPlaceholder + fullIndent);

	let toPrint: string = sprintf(MSG_FORMAT, tag, fullIndent, str);

	printfn(color(toPrint));
}

function inspect(arg: any): string {
	if (typeof arg === "object") {
		return util.inspect(arg, { colors: true });
	} else if (arg === undefined) {
		return "undefined";
	} else {
		return arg;
	}
}

export function verbose(...args: any[]): void {
	print(args.map(inspect).join(" "), stdout, getColorFn("gray"));
}

export function log(...args: any[]): void {
	print(args.map(inspect).join(" "), stdout, colorize);
}

export function info(...args: any[]): void {
	print(args.map(inspect).join(" "), stdout, getColorFn("blue"));
}

export function warn(...args: any[]): void {
	print(args.map(inspect).join(" "), stdout, getColorFn("yellow"));
}

export function error(...args: any[]): void {
	print(args.map(inspect).join(" "), stderr, getColorFn("red"));
}

export function ok(...args: any[]): void {
	print(args.map(inspect).join(" "), stdout, getColorFn("green"));
}

export function indent(amount?: number) {
	if (amount === undefined) {
		amount = 1;
	}

	for (let i = 0; i < amount; i++) {
		fullIndent += oneIndent;
	}
}

export function unindent(amount?: number) {
	if (amount === undefined) {
		amount = 1;
	}

	let rem = INDENT_WIDTH * amount;

	fullIndent = fullIndent.substring(rem);
}

export function divider(text: string, divider?: string): void {
	if (divider === undefined) {
		divider = "#";
	}

	let outputBuffer: any = process.stdout;
	text = " " + text + " ";
	let len: number = outputBuffer.getWindowSize()[0];

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

export function timestamp(): void {
	print(moment().format("YYYY-MM-DD HH:mm:ss"), stdout, colorize);
}

export function logf(format: string, ...args: any[]): void {
	if (FORMATS.has(format)) {
		print(sprintf(FORMATS.get(format), ...args), stdout, colorize);
	} else {
		print(sprintf(format, ...args), stdout, colorize);
	}
}

export function line(count?: number): void {
	if (count === undefined) {
		count = 1;
	}

	for (let i = 0; i < count; i++) {
		stdout("\n");
	}
}

export function addFormat(name: string, format: string): void {
	FORMATS.set(name, format);
}

export function addColor(name: string, color: string): void {
	COLOR_FN_MAP.set(name, (x) => ansy.fg.hex(color) + x + "\x1b[39m");
}

function getColorFn(name: string): (str: string) => string {
	if (COLOR_FN_MAP.has(name)) {
		return COLOR_FN_MAP.get(name);
	} else {
		return (x) => ansy.fg.hex(name) + x + "\x1b[39m";
	}
}

function colorize(str: string): string {
	let parts: string[] = str.split(STYLE_REGEX);
	let stack: string[] = [];
	let result: string = "";

	parts.forEach((part: string) => {
		if (STYLE_REGEX.exec(part)) {
			let color = part.substring(1, part.length - 1);
			if (color.charAt(0) === "/") {
				color = color.substring(1);

				if (color === "" || stack[stack.length - 1] === color) {
					stack.pop();
				} else if (color === "/") {
					stack = [];
				} else {
					throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag closed with </" + color + ">");
				}
			} else {
				stack.push(color);
			}
		} else {
			if (stack.length === 0) {
				result += part;
			} else {
				let colorfn: (str: string) => string = getColorFn(stack[stack.length - 1]);
				result += colorfn(part);
			}
		}
	});

	if (stack.length > 0) {
		throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag has no closing tag");
	}

	return result;
}