const API_URL = "http://localhost:3000/recipes";

let allRecipes = [];
let currentPage = 1;
let recipesPerPage = 6;
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let filterFavorites = false;

// --- Sélecteurs DOM ---
const recipesContainer = document.getElementById("recipes");
const paginationContainer = document.getElementById("pagination");
const recipeCount = document.getElementById("recipe-count");

const filters = document.querySelectorAll("#filters button");
const sortButtons = document.querySelectorAll(".sort-btn");
const favoriteFilterBtn = document.getElementById("filter-favorite");

const titleInput = document.getElementById("search-title");
const clearTitleBtn = document.getElementById("clear-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearIngredientBtn = document.getElementById("clear-ingredient");

// --- Récupération des recettes ---
async function fetchRecipes(page = 1) {
  try {
    const params = new URLSearchParams({
      page,
      limit: recipesPerPage,
      sort: currentSort,
    });

    if (currentCategory !== "all") params.append("category", currentCategory);
    if (currentTitle) params.append("title", currentTitle);
    if (currentIngredient) params.append("ingredient", currentIngredient);
    if (filterFavorites) params.append("favorite", "true");

    const response = await fetch(`${API_URL}?${params.toString()}`);
    const data = await response.json();

    allRecipes = data.recipes;
    currentPage = data.page;
    renderRecipes(data.recipes);
    renderPagination(data.pages, data.page);
    recipeCount.textContent = `${data.total} recette(s) trouvée(s)`;
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
  }
}

// --- Affichage des recettes ---
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";

  if (recipes.length === 0) {
    recipesContainer.innerHTML = "<p>Aucune recette trouvée.</p>";
    return;
  }

  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.classList.add("recipe-card");
    card.innerHTML = `
      <img src="${recipe.image || "placeholder.jpg"}" alt="${recipe.title}">
      <div class="card-content">
        <h2>${recipe.title}</h2>
        <p><strong>Catégorie:</strong> ${recipe.category}</p>
        <p><strong>Temps:</strong> ${recipe.time}</p>
      </div>
      <span class="favorite-icon ${recipe.favorite ? "active" : ""}">★</span>
    `;

    card.addEventListener("click", () => {
      window.location.href = `recette.html?id=${recipe._id}`;
    });

    recipesContainer.appendChild(card);
  });
}

// --- Pagination ---
function renderPagination(totalPages, currentPage) {
  paginationContainer.innerHTML = "";
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.toggle("active", i === currentPage);
    btn.addEventListener("click", () => {
      fetchRecipes(i);
    });
    paginationContainer.appendChild(btn);
  }
}

// --- Événements filtres ---
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    fetchRecipes(1);
  });
});

sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    fetchRecipes(1);
  });
});

favoriteFilterBtn.addEventListener("click", () => {
  filterFavorites = !filterFavorites;
  favoriteFilterBtn.classList.toggle("active", filterFavorites);
  fetchRecipes(1);
});

// --- Recherche ---
titleInput.addEventListener("input", () => {
  currentTitle = titleInput.value.trim();
  clearTitleBtn.classList.toggle("show", currentTitle.length > 0);
  fetchRecipes(1);
});

clearTitleBtn.addEventListener("click", () => {
  titleInput.value = "";
  currentTitle = "";
  clearTitleBtn.classList.remove("show");
  fetchRecipes(1);
});

ingredientInput.addEventListener("input", () => {
  currentIngredient = ingredientInput.value.trim();
  clearIngredientBtn.classList.toggle("show", currentIngredient.length > 0);
  fetchRecipes(1);
});

clearIngredientBtn.addEventListener("click", () => {
  ingredientInput.value = "";
  currentIngredient = "";
  clearIngredientBtn.classList.remove("show");
  fetchRecipes(1);
});

// --- Init ---
fetchRecipes();
