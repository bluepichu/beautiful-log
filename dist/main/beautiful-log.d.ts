export declare function init(appName: string, mode: "disabled" | "console" | "ipc"): void;
export declare function make(loggerName: string): CallableLogger;
export interface CallableLogger extends Logger {
    (...args: any[]): void;
}
export declare class Logger {
    private colormap;
    silent: boolean;
    name: string;
    showDelta: boolean;
    lastTime: number;
    showCallsite: boolean;
    indentLevel: number;
    constructor(name: string);
    announce(): void;
    private transform;
    private send;
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    ok(...args: any[]): void;
    verbose(...args: any[]): void;
    line(amount?: number): void;
    timestamp(): void;
    indent(amount?: number): void;
    unindent(amount?: number): void;
    setColor(name: string, color: string): void;
    private getColorFn;
    private colorize;
    private inspect;
}
