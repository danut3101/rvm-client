import { EventEmitter, Injectable } from '@angular/core';
@Injectable()
/**
	* Error service to show http error message in console
*/
export class ErrorMessageService {
	private _errors: ErrorModel.ErrorMessageObject[] = [];
	public errors$ = new EventEmitter<ErrorModel.ErrorMessageObject[]>();

	constructor() {}
	/*
		* return errors
*/
	get errors(): ErrorModel.ErrorMessageObject[] {
		return this._errors;
	}
	/**
	* Add error to errors list
*/
	public set(error: string, type: string, serviceUrl: string) {
		this._errors.push({
			id: Date.now(),
			error: error,
			type: type,
			serviceUrl: serviceUrl
		});
		console.log(this._errors);
		this.errors$.emit(this._errors);
	}
/**
	* Clear all errors from error list
*/
	public clear() {
		this._errors = [];
		this.errors$.emit(this._errors);
	}
}
