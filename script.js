// URL de l'API
const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

// --- Éléments DOM ---
const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");
const filters = document.querySelectorAll("#filters button");
const recipeCount = document.getElementById("recipe-count");
const sortButtons = document.querySelectorAll(".sort-btn");
const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");

// --- State ---
let allRecipes = [];
let currentFilter = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";

// --- Notification ---
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// --- Afficher les recettes ---
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    recipesContainer.innerHTML = `<p>Aucune recette trouvée.</p>`;
  } else {
    recipes.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.innerHTML = `
        ${recipe.image ? `<img src="${recipe.image}" alt="Image de ${recipe.title}" loading="lazy">` : ""}
        <div class="card-content">
          <h2>${recipe.title}</h2>
          <p><strong>Catégorie :</strong> ${recipe.category}</p>
          <p><strong>Temps :</strong> ${recipe.time}</p>
          <h3>Ingrédients :</h3>
          <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>
      `;
      card.addEventListener("click", () => {
        window.location.href = `recette.html?id=${recipe._id}`;
      });
      recipesContainer.appendChild(card);
    });
  }
  recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

// --- Filtrage et tri ---
function applyFiltersAndRender() {
  let filtered = [...allRecipes];

  if (currentFilter !== "all") {
    filtered = filtered.filter(r => r.category === currentFilter);
  }

  if (currentTitle) {
    filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle));
  }

  if (currentIngredient) {
    filtered = filtered.filter(r =>
      r.ingredients.some(i => i.toLowerCase().includes(currentIngredient))
    );
  }

  filtered.sort((a, b) =>
    currentSort === "asc"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  renderRecipes(filtered);
}

// --- Récupérer les recettes depuis le backend ---
async function fetchRecipes() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Impossible de récupérer les recettes");
    allRecipes = await response.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
    recipesContainer.innerHTML = `<p class="error">Erreur lors de la récupération des recettes.</p>`;
    showNotification("Impossible de charger les recettes", "error");
  }
}

// --- Modal ajout/édition ---
addRecipeBtn.addEventListener("click", () => {
  modal.style.display = "block";
  form.querySelector("input, textarea").focus();
});

closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// --- Ajouter recette ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newRecipe = {
    title: form.title.value.trim(),
    category: form.category.value,
    time: form.time.value.trim(),
    ingredients: form.ingredients.value.split(",").map(i => i.trim()).filter(Boolean),
    description: form.description.value.trim(),
    image: form.image.value.trim() || ""
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    });
    if (!res.ok) throw new Error("Erreur serveur");
    const created = await res.json();
    allRecipes.push(created);
    showNotification("Recette ajoutée !");
    form.reset();
    modal.style.display = "none";
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
    showNotification("Erreur lors de l'ajout", "error");
  }
});

// --- Filtre par catégorie ---
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.category;
    applyFiltersAndRender();
  });
});

// --- Tri par titre ---
sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    applyFiltersAndRender();
  });
});

// --- Recherche titre/ingrédients ---
titleInput.addEventListener("input", () => {
  currentTitle = titleInput.value.toLowerCase();
  clearTitleBtn.classList.toggle("show", currentTitle.length > 0);
  applyFiltersAndRender();
});

ingredientInput.addEventListener("input", () => {
  currentIngredient = ingredientInput.value.toLowerCase();
  clearIngredientBtn.classList.toggle("show", currentIngredient.length > 0);
  applyFiltersAndRender();
});

clearTitleBtn.addEventListener("click", () => {
  titleInput.value = "";
  currentTitle = "";
  clearTitleBtn.classList.remove("show");
  applyFiltersAndRender();
});

clearIngredientBtn.addEventListener("click", () => {
  ingredientInput.value = "";
  currentIngredient = "";
  clearIngredientBtn.classList.remove("show");
  applyFiltersAndRender();
});

// --- Initialisation ---
fetchRecipes();
