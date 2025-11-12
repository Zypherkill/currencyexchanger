const form = document.querySelector('.converter__form');
let currencies = {};
const getInput = () => {
    const amountInput = document.querySelector('.converter__input');
    const from = document.querySelector('.converter__input--currency-from');
    const to = document.querySelector('.converter__input--currency-to');
    return {
        amount: parseFloat(amountInput.value),
        from: from.value.trim(),
        to: to.value.trim(),
    };
};
const fetchCurrency = async (from, to) => {
    try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Kunde inte hämta valutadata:', error);
        throw error;
    }
};
const handleConversion = async () => {
    const { amount, from, to } = getInput();
    const currencyData = await fetchCurrency(from, to);
    const rate = currencyData.rates[to];
    const resultText = document.querySelector('.converter__result');
    if (rate !== undefined && resultText) {
        const converted = amount * rate;
        resultText.textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
    }
    else if (resultText) {
        resultText.textContent = `Kunde inte hitta kurs för ${to}`;
    }
};
form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await handleConversion();
});
const setupDropdown = (input, dropdown) => {
    input.addEventListener('input', () => {
        const search = input.value.trim().toUpperCase();
        dropdown.innerHTML = '';
        if (!search)
            return (dropdown.style.display = 'none');
        const matches = Object.entries(currencies)
            .filter(([code, name]) => typeof name === 'string' &&
            (code.toUpperCase().includes(search) ||
                name.toUpperCase().includes(search)))
            .slice(0, 20);
        for (const [code, name] of matches) {
            const li = document.createElement('li');
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
            const [code] = (dropdown.firstElementChild.textContent ?? '').split(' - ');
            input.value = code ?? '';
            dropdown.style.display = 'none';
            event.preventDefault();
        }
    });
};
const resetStorage = 1000 * 60 * 60 * 24;
const localCurrency = 'localCurrency';
const getCachedCurrencies = async () => {
    const getStorage = localStorage.getItem(localCurrency);
    if (getStorage) {
        const { data, timestamp } = JSON.parse(getStorage);
        if (Date.now() - timestamp < resetStorage) {
            return data;
        }
    }
    const response = await fetch('https://api.frankfurter.app/currencies');
    const data = await response.json();
    localStorage.setItem(localCurrency, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
};
const fillCurrencyList = async () => {
    currencies = await getCachedCurrencies();
    const fromInput = document.querySelector('.converter__input--currency-from');
    const toInput = document.querySelector('.converter__input--currency-to');
    if (fromInput) {
        const fromDropdown = document.querySelector('.converter__dropdown--from');
        setupDropdown(fromInput, fromDropdown);
    }
    if (toInput) {
        const toDropdown = document.querySelector('.converter__dropdown--to');
        setupDropdown(toInput, toDropdown);
    }
};
document.addEventListener('DOMContentLoaded', () => {
    fillCurrencyList();
});
export {};
