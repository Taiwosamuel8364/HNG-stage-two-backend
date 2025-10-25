const axios = require("axios");

const countryData = async () => {
  const data = await axios
    .get(
      "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
    )
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error fetching country data:", err);
      return [];
    });
  return data;
};

const exchangeData = async () => {
  const data = await axios
    .get(`https://api.exchangerate-api.com/v4/latest/USD`)
    .then((res) => res.data)
    .catch((err) => {
      console.error("Error fetching exchange data:", err);
      return null;
    });

  return data;
};

const countryWithExchangeRate = async () => {
  const countries = await countryData();
  const exchangeRates = await exchangeData();

  try {
    if (!exchangeRates) {
      return countries.map((country) => ({
        name: country.name,
        capital: country.capital,
        region: country.region,
        population: country.population,
        currency_code: country.currencies?.[0]?.code,
        exchange_rate: null,
        estimated_gdp:
          (country.population * (Math.random() * 1830)) /
          (exchangeRates.rates[country.currencies?.[0]?.code] || 1),
        flag_url: country.flag,
        last_refreshed_at: new Date().toISOString(),
      }));
    }

    return countries.map((country) => ({
      name: country.name,
      capital: country.capital,
      region: country.region,
      population: country.population,
      currency_code: country.currencies?.[0]?.code,
      exchange_rate: exchangeRates.rates[country.currencies?.[0]?.code] || null,
      estimated_gdp:
        (country.population * (Math.random() * 1600)) /
        (exchangeRates.rates[country.currencies?.[0]?.code] || 1),
      flag_url: country.flag,
      // last_refreshed_at: new Date().toISOString(),
    }));
  } catch (error) {
    res.status(503).json({
      error: "External data source unavailable",
      details: "Could not fetch data from external APIs",
    });
  }
};

// const filteredData = async () => {
//     const countries = await countryWithExchangeRate();
//     console.log(countries);
// }
// filteredData();
module.exports = { countryWithExchangeRate };
