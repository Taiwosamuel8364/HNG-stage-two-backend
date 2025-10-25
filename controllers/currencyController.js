const { countryWithExchangeRate } = require("../service");
const db = require("../db");
const { createCanvas } = require("canvas");
const path = require("path");
const fs = require("fs");

const refreshCountries = async (req, res) => {
  try {
    const countries = await countryWithExchangeRate();

    const insertQuery = `
            INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE
                capital = VALUES(capital),
                region = VALUES(region),
                population = VALUES(population),
                currency_code = VALUES(currency_code),
                exchange_rate = VALUES(exchange_rate),
                estimated_gdp = VALUES(estimated_gdp),
                flag_url = VALUES(flag_url)
        `;

    // Wait for all inserts to complete
    const insertPromises = countries.map((country) => {
      const values = [
        country.name || null,
        country.capital || null,
        country.region || null,
        country.population || null,
        country.currency_code || null,
        country.exchange_rate || null,
        country.estimated_gdp || null,
        country.flag_url || null,
      ];
      return db.query(insertQuery, values);
    });

    await Promise.all(insertPromises);

    // Generate summary image after saving countries
    await generateSummaryImage();

    res.status(200).json(await db.query("SELECT * FROM countries"));
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getAllCountries = async (req, res) => {
  // Getting alll country using filtering and sorting
  const { region, sort, currency } = req.query;

  let query = "SELECT * FROM countries";
  const conditions = [];
  const values = [];
  if (region) {
    conditions.push("region = ?");
    values.push(region);
  }
  if (currency) {
    conditions.push("currency_code = ?");
    values.push(currency);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  if (sort) {
    query += " ORDER BY " + sort + " DESC";
  }

  try {
    res.status(200).json(await db.query(query, values));
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const getCountryByName = async (req, res) => {
  const { name } = req.params;
  try {
    const results = await db.query("SELECT * FROM countries WHERE name = ?", [
      name,
    ]);
    if (results.length === 0) {
      return res.status(404).json({
        error: "Country not found",
      });
    }
    res.status(200).json(results[0]);
  } catch (error) {
    res.status(404).json({
      error: "Country not found",
    });
  }
};

const deleteCountryByName = async (req, res) => {
  const { name } = req.params;
  try {
    const results = await db.query("DELETE FROM countries WHERE name = ?", [
      name,
    ]);
    if (results.affectedRows === 0) {
      return res.status(404).json({
        error: "Country not found",
      });
    }
    return res.status(200).json({ message: "Country deleted successfully" });
  } catch (error) {
    return res.status(404).json({
      error: "Country not found",
    });
  }
};

const getStatus = async (req, res) => {
  try {
    const results = await db.query(
      "SELECT COUNT(*) AS country_count, MAX(last_refreshed_at) AS last_refreshed_at FROM countries"
    );
    res.status(200).json({
      total_countries: results[0].country_count,
      last_refreshed_at: results[0].last_refreshed_at,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

const generateSummaryImage = async () => {
  try {
    // Get total countries
    const countResult = await db.query(
      "SELECT COUNT(*) AS total FROM countries"
    );
    const totalCountries = countResult[0].total;

    // Get top 5 countries by GDP
    const topCountries = await db.query(
      "SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5"
    );

    // Get last refreshed timestamp
    const refreshResult = await db.query(
      "SELECT MAX(last_refreshed_at) AS last_refreshed FROM countries"
    );
    const lastRefreshed =
      refreshResult[0].last_refreshed || new Date().toISOString();

    // Create canvas
    const width = 800;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = "#000000";
    ctx.font = "bold 32px Arial";
    ctx.fillText("Countries Summary", 50, 60);

    // Total countries
    ctx.font = "24px Arial";
    ctx.fillText(`Total Countries: ${totalCountries}`, 50, 120);

    // Top 5 countries
    ctx.font = "bold 24px Arial";
    ctx.fillText("Top 5 Countries by GDP:", 50, 180);

    ctx.font = "20px Arial";
    topCountries.forEach((country, index) => {
      const gdp = country.estimated_gdp
        ? `$${(country.estimated_gdp / 1e9).toFixed(2)}B`
        : "N/A";
      ctx.fillText(
        `${index + 1}. ${country.name}: ${gdp}`,
        70,
        220 + index * 40
      );
    });

    // Last refreshed
    ctx.font = "20px Arial";
    ctx.fillText(
      `Last Refreshed: ${new Date(lastRefreshed).toLocaleString()}`,
      50,
      480
    );

    // Save image
    const imagesDir = path.join(__dirname, "..", "images");
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const imagePath = path.join(imagesDir, "summary.png");
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(imagePath, buffer);

    console.log("Summary image generated successfully");
  } catch (error) {
    console.error("Error generating summary image:", error);
  }
};

const getCountriesImage = async (req, res) => {
  try {
    const imagePath = path.join(__dirname, "..", "images", "summary.png");

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        error: "summary image not found",
      });
    }

    res.status(200).json({
      image_path: imagePath,
    });
  } catch (error) {
    res.status(404).json({
      error: "summary image not found",
    });
  }
};

module.exports = {
  refreshCountries,
  getAllCountries,
  getCountryByName,
  deleteCountryByName,
  generateSummaryImage,
  getCountriesImage,
  getStatus,
};
