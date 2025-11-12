export interface Rates {
	[currencyCode: string]: number;
}

export interface Currencies {
	[currencyCode: string]: string;
}

export interface Currency {
	amount: number;
	base: string;
	date: string;
	rates: Rates;
}


export interface InputValues {
	amount: number;
	from: string;
	to: string;
}
