const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const RECIPES_FILE = path.join(__dirname, "data", "recipes.json");
const FAVORITES_FILE = path.join(__dirname, "data", "favorites.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Match recipes against the ingredients the user has
app.post("/api/match", (req, res) => {
  const have = (req.body.ingredients || []).map((i) => i.trim().toLowerCase()).filter(Boolean);
  const recipes = readJSON(RECIPES_FILE);

  const results = recipes
    .map((recipe) => {
      const needed = recipe.ingredients.map((i) => i.toLowerCase());
      const matched = needed.filter((i) => have.includes(i));
      const missing = needed.filter((i) => !have.includes(i));
      const matchPercent = Math.round((matched.length / needed.length) * 100);
      return { ...recipe, matched, missing, matchPercent };
    })
    .filter((r) => r.matched.length > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent);

  res.json(results);
});

// Get all favorites
app.get("/api/favorites", (req, res) => {
  res.json(readJSON(FAVORITES_FILE));
});

// Save a favorite
app.post("/api/favorites", (req, res) => {
  const recipe = req.body;
  const favorites = readJSON(FAVORITES_FILE);
  if (!favorites.find((f) => f.id === recipe.id)) {
    favorites.push(recipe);
    writeJSON(FAVORITES_FILE, favorites);
  }
  res.json(favorites);
});

// Remove a favorite
app.delete("/api/favorites/:id", (req, res) => {
  const id = Number(req.params.id);
  let favorites = readJSON(FAVORITES_FILE);
  favorites = favorites.filter((f) => f.id !== id);
  writeJSON(FAVORITES_FILE, favorites);
  res.json(favorites);
});

app.listen(PORT, () => {
  console.log(`LeftoverChef running at http://localhost:${PORT}`);
});
