import type { Currency, InputValues, Currencies } from './interfaces/index.js';

const form = document.querySelector('.converter__form') as HTMLFormElement;
let currencies: Currencies = {};

const getInput = (): InputValues => {
	const amountInput = document.querySelector(
		'.converter__input'
	) as HTMLInputElement;
	const from = document.querySelector(
		'.converter__input--currency-from'
	) as HTMLInputElement;
	const to = document.querySelector(
		'.converter__input--currency-to'
	) as HTMLInputElement;

	return {
		amount: parseFloat(amountInput.value),
		from: from.value.trim(),
		to: to.value.trim(),
	};
};

const fetchCurrency = async (from: string, to: string): Promise<Currency> => {
	try {
		const response = await fetch(
			`https://api.frankfurter.app/latest?from=${from}&to=${to}`
		);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data: Currency = await response.json();
		return data;
	} catch (error) {
		console.error('Kunde inte hämta valutadata:', error);
		throw error;
	}
};

const handleConversion = async () => {
	const { amount, from, to } = getInput();

	const currencyData = await fetchCurrency(from, to);

	const rate: number | undefined = currencyData.rates[to];
	const resultText = document.querySelector(
		'.converter__result'
	) as HTMLElement;
	if (rate !== undefined && resultText) {
		const converted: number = amount * rate;
		resultText.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
	} else if (resultText) {
		resultText.textContent = `Kunde inte hitta kurs för ${to}`;
	}
};

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	await handleConversion();
});

const setupDropdown = (input: HTMLInputElement, dropdown: HTMLElement) => {
	input.addEventListener('input', () => {
		const search : string = input.value.trim().toUpperCase();
		dropdown.innerHTML = '';

		if (!search) return (dropdown.style.display = 'none');

		const matches = Object.entries(currencies)
			.filter(
				([code, name]) =>
					typeof name === 'string' &&
					(code.toUpperCase().includes(search) ||
						name.toUpperCase().includes(search))
			)
			.slice(0, 20);

		for (const [code, name] of matches) {
			const li = document.createElement('li') as HTMLLIElement;
			li.textContent = `${code} - ${name}`;
			li.tabIndex = 0;
			li.addEventListener('click', () => {
				input.value = code;
				dropdown.style.display = 'none';
			});
			dropdown.appendChild(li);
		}

		dropdown.style.display = matches.length ? 'block' : 'none';
	});

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' && dropdown.firstElementChild) {
			const [code] = (dropdown.firstElementChild.textContent ?? '').split(
				' - '
			);
			input.value = code ?? '';
			dropdown.style.display = 'none';
			event.preventDefault();
		}
	});
};

const resetStorage = 1000 * 60 * 60 * 24;
const localCurrency = 'localCurrency';

const getCachedCurrencies = async (): Promise<Currencies> => {
	const getStorage = localStorage.getItem(localCurrency);

	if (getStorage) {
		const { data, timestamp } = JSON.parse(getStorage) as {
			data: Currencies;
			timestamp: number;
		};

		if (Date.now() - timestamp < resetStorage) {
			return data;
		}
	}

	const response = await fetch('https://api.frankfurter.app/currencies');
	const data: Currencies = await response.json();

	localStorage.setItem(
		localCurrency,
		JSON.stringify({ data, timestamp: Date.now() })
	);

	return data;
};



const fillCurrencyList = async () => {
	
	currencies = await getCachedCurrencies();

	const fromInput = document.querySelector(
		'.converter__input--currency-from'
	) as HTMLInputElement | null;
	const toInput = document.querySelector(
		'.converter__input--currency-to'
	) as HTMLInputElement | null;

	if (fromInput) {
		const fromDropdown = document.querySelector(
			'.converter__dropdown--from'
		) as HTMLUListElement;
		setupDropdown(fromInput, fromDropdown);
	}

	if (toInput) {
		const toDropdown = document.querySelector(
			'.converter__dropdown--to'
		) as HTMLUListElement;
		setupDropdown(toInput, toDropdown);
	}
};


document.addEventListener('DOMContentLoaded', () => {
	fillCurrencyList();
});
