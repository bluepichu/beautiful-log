interface LoggerMessageData {
	logger: string;
	callsite?: string;
	message: string;
	delta?: number;
}

interface LoggerCreationData {
	logger: string;
}