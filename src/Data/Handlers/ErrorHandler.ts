interface Error {
	message: string;
	timestamp: Date;
}

export class ErrorHandler {
	private error: Error = {
		message:
			"Lorem ipsum, dolor sit amet consectetur adipisicing elit. Praesentium aut ratione sint, amet, quis, veritatis obcaecati minus a esse quidem vel ex magni laudantium reiciendis hic qui possimus nihil. Officiis.",
		timestamp: new Date(),
	};

	public getError(): Error {
		return this.error;
	}

	public setError(message: string): void {
		this.error = {
			message: message,
			timestamp: new Date(),
		};
	}
}
