export interface LoggerOptions {
    color?: string;
    showDelta?: boolean;
    showCallsite?: boolean;
}
export default function makeLogger(namespace: string, options?: LoggerOptions): CallableLogger;
export interface CallableLogger extends Logger {
    (...args: any[]): void;
}
export declare class Logger {
    private colormap;
    private silent;
    namespace: string;
    color: (str: string) => string;
    showDelta: boolean;
    lastTime: number;
    showCallsite: boolean;
    indentLevel: number;
    constructor(namespace: string, options: LoggerOptions);
    announce(): void;
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    ok(...args: any[]): void;
    verbose(...args: any[]): void;
    line(amount?: number): void;
    divider(text: string, divider?: string): void;
    timestamp(): void;
    indent(amount?: number): void;
    unindent(amount?: number): void;
    setColor(name: string, color: string): void;
    private getColorFn(name);
    private colorize(str);
}
