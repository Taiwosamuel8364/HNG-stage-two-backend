const router = require("express").Router();
const currencyController = require("../controllers/currencyController");

router.post("/countries/refresh", currencyController.refreshCountries);

// Getting all countries and support filters and sorting.
router.get("/countries", currencyController.getAllCountries);
// Getting status
router.get("/status", currencyController.getStatus);
// Getting a specific country by its name.
// Get a countries image
router.get("/countries/image", currencyController.getCountriesImage);
router.get("/countries/:name", currencyController.getCountryByName);
//Delete a country by its name
router.delete("/countries/:name", currencyController.deleteCountryByName);

module.exports = router;
