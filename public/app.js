let ingredients = [];
let favorites = [];

const input = document.getElementById("ingredientInput");
const chipsEl = document.getElementById("chips");
const resultsEl = document.getElementById("results");
const favListEl = document.getElementById("favoritesList");
const favCountEl = document.getElementById("favCount");

// --- Ingredient chips ---
function addIngredient() {
  const val = input.value.trim().toLowerCase();
  if (val && !ingredients.includes(val)) {
    ingredients.push(val);
    renderChips();
  }
  input.value = "";
  input.focus();
}

function removeIngredient(name) {
  ingredients = ingredients.filter((i) => i !== name);
  renderChips();
}

function renderChips() {
  chipsEl.innerHTML = ingredients
    .map(
      (i) => `<span class="chip">${i}<button onclick="removeIngredient('${i}')">×</button></span>`
    )
    .join("");
}

document.getElementById("addBtn").onclick = addIngredient;
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addIngredient();
});

document.getElementById("clearBtn").onclick = () => {
  ingredients = [];
  renderChips();
  resultsEl.innerHTML = "";
};

// --- Find recipes ---
document.getElementById("findBtn").onclick = async () => {
  if (ingredients.length === 0) {
    resultsEl.innerHTML = `<div class="empty"><div class="big">Add some ingredients first</div>Tell us what's in your kitchen and we'll do the rest.</div>`;
    return;
  }
  const res = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  const recipes = await res.json();
  renderResults(recipes, resultsEl);
};

function recipeCard(r, isFav) {
  const saved = favorites.find((f) => f.id === r.id);
  const have = (r.matched || []).map((i) => `<span class="tag have">${i}</span>`).join("");
  const need = (r.missing || []).map((i) => `<span class="tag need">${i}</span>`).join("");

  return `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">${r.name}</div>
          <div class="card-meta">${r.cuisine} · ${r.time} min</div>
        </div>
        ${
          r.matchPercent !== undefined
            ? `<div class="match-badge"><div class="pct">${r.matchPercent}%</div><div class="lbl">match</div></div>`
            : ""
        }
      </div>

      ${
        have
          ? `<div class="ing-section"><div class="ing-label">You have</div><div class="ing-list">${have}</div></div>`
          : ""
      }
      ${
        need
          ? `<div class="ing-section"><div class="ing-label">You'll need</div><div class="ing-list">${need}</div></div>`
          : ""
      }

      <div class="steps" id="steps-${isFav ? "f" : "r"}-${r.id}">
        <div class="ing-label">Method</div>
        <ol>${r.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      </div>

      <div class="card-actions">
        <button class="btn-sm" onclick="toggleSteps('${isFav ? "f" : "r"}', ${r.id})">View recipe</button>
        <button class="btn-sm ${saved ? "saved" : ""}" onclick='toggleFav(${JSON.stringify(
          r
        ).replace(/'/g, "&#39;")})'>${saved ? "★ Saved" : "☆ Save"}</button>
      </div>
    </div>`;
}

function renderResults(recipes, target) {
  if (!recipes.length) {
    target.innerHTML = `<div class="empty"><div class="big">No matches yet</div>Try adding a couple more common ingredients.</div>`;
    return;
  }
  target.innerHTML = recipes.map((r) => recipeCard(r, target === favListEl)).join("");
}

function toggleSteps(prefix, id) {
  document.getElementById(`steps-${prefix}-${id}`).classList.toggle("open");
}

// --- Favorites ---
async function loadFavorites() {
  const res = await fetch("/api/favorites");
  favorites = await res.json();
  favCountEl.textContent = favorites.length;
}

async function toggleFav(recipe) {
  const exists = favorites.find((f) => f.id === recipe.id);
  if (exists) {
    await fetch(`/api/favorites/${recipe.id}`, { method: "DELETE" });
  } else {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
  }
  await loadFavorites();
  // re-render whichever view is active
  if (!document.getElementById("favoritesView").classList.contains("hidden")) {
    renderResults(favorites, favListEl);
  } else if (resultsEl.innerHTML) {
    document.getElementById("findBtn").click();
  }
}

// --- Tabs ---
document.querySelectorAll(".tab").forEach((tab) => {
  tab.onclick = () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const view = tab.dataset.view;
    document.getElementById("cookView").classList.toggle("hidden", view !== "cook");
    document.getElementById("favoritesView").classList.toggle("hidden", view !== "favorites");
    if (view === "favorites") renderResults(favorites, favListEl);
  };
});

loadFavorites();
