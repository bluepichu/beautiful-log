"use strict";

import * as stack           from "callsite";
import * as colors          from "colors";
import {sprintf as sprintf} from "sprintf-js";
import * as util            from "util";
import * as moment          from "moment";

const TAG_WIDTH: number = 40;
const TAG_FORMAT: string = "[(%s) %s:%d]";
const MSG_FORMAT: string = "%-" + TAG_WIDTH + "s %s%s";
const FORMATS: Map<string, string> = new Map();
const COLOR_REGEX = /(<black>|<red>|<green>|<yellow>|<blue>|<magenta>|<cyan>|<white>|<gray>|<grey>|<\/black>|<\/red>|<\/green>|<\/yellow>|<\/blue>|<\/magenta>|<\/cyan>|<\/white>|<\/gray>|<\/grey>)/g;
const COLOR_FN_MAP: Map<string, (str: string) => string> = new Map();

const INDENT_WIDTH: number = 4;
let INDENT: number = 0;

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

function print(str: string, printfn: (s: string) => void, colorize: (s: string) => string): void {
	let caller = stack()[2];
	let tag = sprintf(TAG_FORMAT,
		caller.getFunctionName() || "anonymous",
		caller.getFileName().split("/").pop(),
		caller.getLineNumber());

	let oneIndent: string = "";

	for (let i = 0; i < INDENT_WIDTH; i++) {
		oneIndent += " ";
	}

	let fullIndent: string = "";

	for (let i = 0; i < INDENT; i++) {
		fullIndent += oneIndent;
	}

	let toPrint: string = sprintf(MSG_FORMAT, tag, fullIndent, str);

	printfn(colorize(toPrint));
}

function inspect(arg: any): string {
	if (typeof arg === "object") {
		return util.inspect(arg, {colors: true});
	} else {
		return arg.toString();
	}
}

export function verbose(...args: any[]): void {
	print(args.map(inspect).join(" "), console.log, colors.gray);
}

export function log(...args: any[]): void {
	print(args.map(inspect).join(" "), console.log, colorize);
}

export function info(...args: any[]): void {
	print(args.map(inspect).join(" "), console.info, colors.blue);
}

export function warn(...args: any[]): void {
	print(args.map(inspect).join(" "), console.warn, colors.yellow);
}

export function error(...args: any[]): void {
	print(args.map(inspect).join(" "), console.error, colors.red);
}

export function ok(...args: any[]): void {
	print(args.map(inspect).join(" "), console.error, colors.green);
}

export function indent(amount?: number) {
	if (amount === undefined) {
		amount = 1;
	}

	INDENT += amount;
}

export function unindent(amount?: number) {
	if (amount === undefined) {
		amount = 1;
	}

	INDENT -= amount;
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

	line();
	line();
	console.log(text);
	line();
}

export function timestamp(): void {
	print(moment().format("YYYY-MM-DD HH:mm:ss"), console.log, colorize);
}

export function logf(format: string, ...args: any[]): void {
	if (FORMATS.has(format)) {
		print(sprintf(FORMATS.get(format), ...args), console.log, colorize);
	} else {
		print(sprintf(format, ...args), console.log, colorize);
	}
}

export function line(): void {
	console.log();
}

export function addFormat(name: string, format: string): void {
	FORMATS.set(name, format);
}

function colorize(str: string): string {
	let parts: string[] = str.split(COLOR_REGEX);
	let stack: string[] = [];
	let result: string = "";

	parts.forEach((part: string) => {
		if (COLOR_REGEX.exec(part)) {
			let color = part.substring(1, part.length - 1);
			if (color.charAt(0) === "/") {
				color = color.substring(1);

				if (stack[stack.length - 1] === color) {
					stack.pop();
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
				let colorfn: (str: string) => string = COLOR_FN_MAP.get(stack[stack.length - 1]);
				result += colorfn(part);
			}
		}
	});

	if (stack.length > 0) {
		throw new SyntaxError("Tag mismatch - <" + stack[stack.length - 1] + "> tag has no closing tag");
	}

	return result;
}