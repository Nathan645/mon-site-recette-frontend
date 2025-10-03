const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");
const filters = document.querySelectorAll("#filters button[data-category]");
const recipeCount = document.getElementById("recipe-count");
const sortButtons = document.querySelectorAll(".sort-btn");
const favoriteFilterBtn = document.getElementById("filter-favorite");

const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");

const modalFavoriteIcon = document.getElementById("modal-favorite-icon");
const modalFavoriteCheckbox = document.getElementById("favorite-checkbox");

// combi filters modale (checkboxes)
const modalGluten = document.getElementById("modal-gluten");
const modalVege = document.getElementById("modal-vege");
const modalGrogros = document.getElementById("modal-grogros");

// combi buttons on page
const combiFilterButtons = document.querySelectorAll(".combi-filter");
let activeCombiFilters = [];

let allRecipes = [];
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let filterFavorites = false;

let currentPage = 1;
const recipesPerPage = 12;

// Notification
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// helper: détecte gluten free via ingrédients si flag absent
function detectGlutenFree(recipe) {
  if (typeof recipe.gluten === "boolean") return recipe.gluten;
  if (!Array.isArray(recipe.ingredients)) return false;
  const text = recipe.ingredients.join(" ").toLowerCase();
  return !(/blé|farine|pâte|wheat|flour|orge|rye|seigle|barley/.test(text));
}

// helper: détecte végé via ingrédients si flag absent
function detectVege(recipe) {
  if (typeof recipe.vege === "boolean") return recipe.vege;
  if (!Array.isArray(recipe.ingredients)) return false;
  const text = recipe.ingredients.join(" ").toLowerCase();
  return !(/viande|poulet|poisson|poisson|boeuf|porc|agneau|bacon|jambon|saucisse|saumon|thon/.test(text));
}

// helper: détecte grogros si flag absent
function detectGrogros(recipe) {
  if (typeof recipe.grogros === "boolean") return recipe.grogros;
  if (!Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients.length >= 8;
}

// Render recettes
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    recipesContainer.innerHTML = `<p>Aucune recette trouvée.</p>`;
    if (recipeCount) recipeCount.textContent = `0 recette(s) trouvée(s)`;
    return;
  }

  const start = (currentPage - 1) * recipesPerPage;
  const end = start + recipesPerPage;
  const recipesToShow = recipes.slice(start, end);

  recipesToShow.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    const favoriteHtml = recipe.favorite ? `<span class="favorite-icon">★</span>` : "";
    card.innerHTML = `
      ${recipe.image ? `<img src="${recipe.image}" alt="Image de ${recipe.title}">` : ""}
      ${favoriteHtml}
      <div class="card-content">
        <h2>${recipe.title}</h2>
        <p><strong>Catégorie :</strong> ${recipe.category}</p>
        <p><strong>Temps :</strong> ${recipe.time}</p>
        <h3>Ingrédients :</h3>
        <ul>${Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i=>`<li>${i}</li>`).join("") : ""}</ul>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `recette.html?id=${recipe._id}`;
    });
    recipesContainer.appendChild(card);
  });

  renderPagination(recipes.length);
  if (recipeCount) recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

function renderPagination(totalRecipes) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(totalRecipes / recipesPerPage);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.toggle("active", i === currentPage);
    btn.addEventListener("click", () => {
      currentPage = i;
      applyFiltersAndRender();
    });
    paginationContainer.appendChild(btn);
  }
}

// Apply filters + tri
function applyFiltersAndRender() {
  let filtered = [...allRecipes];

  if (currentCategory !== "all") {
    filtered = filtered.filter(r => r.category === currentCategory);
  }

  if (currentTitle.trim() !== "") {
    filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle.toLowerCase()));
  }

  if (currentIngredient.trim() !== "") {
    filtered = filtered.filter(r => Array.isArray(r.ingredients) && r.ingredients.some(i => i.toLowerCase().includes(currentIngredient.toLowerCase())));
  }

  if (filterFavorites) filtered = filtered.filter(r => r.favorite);

  if (activeCombiFilters.length > 0) {
    activeCombiFilters.forEach(f => {
      if (f === "gluten") {
        filtered = filtered.filter(r => detectGlutenFree(r));
      }
      if (f === "vege") {
        filtered = filtered.filter(r => detectVege(r));
      }
      if (f === "grogros") {
        filtered = filtered.filter(r => detectGrogros(r));
      }
    });
  }

  if (currentSort === "asc") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (currentSort === "desc") filtered.sort((a, b) => b.title.localeCompare(a.title));
  else if (currentSort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (currentSort === "oldest") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  renderRecipes(filtered);
}

// Fetch recipes
async function fetchRecipes() {
  try {
    const res = await fetch(API_URL);
    allRecipes = await res.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error(err);
    showNotification("Impossible de charger les recettes", "error");
  }
}

// Events
if (modalFavoriteIcon && modalFavoriteCheckbox) {
  modalFavoriteIcon.addEventListener("click", () => {
    modalFavoriteIcon.classList.toggle("active");
    modalFavoriteCheckbox.checked = modalFavoriteIcon.classList.contains("active");
  });
}

addRecipeBtn.addEventListener("click", () => { modal.style.display = "block"; });
if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// Create recipe
form.addEventListener("submit", async e => {
  e.preventDefault();
  const newRecipe = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    time: document.getElementById("time").value,
    ingredients: document.getElementById("ingredients").value.split(",").map(i => i.trim()).filter(Boolean),
    description: document.getElementById("description").value,
    image: document.getElementById("image").value || "",
    favorite: modalFavoriteCheckbox.checked,
    gluten: modalGluten ? modalGluten.checked : false,
    vege: modalVege ? modalVege.checked : false,
    grogros: modalGrogros ? modalGrogros.checked : false
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    });
    if (res.ok) {
      showNotification("Recette ajoutée !");
      form.reset();
      if (modalFavoriteIcon) modalFavoriteIcon.classList.remove("active");
      modal.style.display = "none";
      fetchRecipes();
    } else {
      const data = await res.json();
      showNotification(data.error || "Erreur lors de l'ajout", "error");
    }
  } catch (err) {
    showNotification("Erreur serveur", "error");
  }
});

// category filters
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// favorite filter
if (favoriteFilterBtn) {
  favoriteFilterBtn.addEventListener("click", () => {
    favoriteFilterBtn.classList.toggle("active");
    filterFavorites = !filterFavorites;
    currentPage = 1;
    applyFiltersAndRender();
  });
}

// combi filters on page
combiFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    const filter = btn.dataset.filter;
    if (btn.classList.contains("active")) activeCombiFilters.push(filter);
    else activeCombiFilters = activeCombiFilters.filter(f => f !== filter);
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// search title
if (titleInput) {
  titleInput.addEventListener("input", () => {
    currentTitle = titleInput.value;
    clearTitleBtn.classList.toggle("show", currentTitle.length > 0);
    currentPage = 1;
    applyFiltersAndRender();
  });
  clearTitleBtn.addEventListener("click", () => {
    titleInput.value = "";
    currentTitle = "";
    clearTitleBtn.classList.remove("show");
    applyFiltersAndRender();
  });
}

// search ingredient
if (ingredientInput) {
  ingredientInput.addEventListener("input", () => {
    currentIngredient = ingredientInput.value;
    clearIngredientBtn.classList.toggle("show", currentIngredient.length > 0);
    currentPage = 1;
    applyFiltersAndRender();
  });
  clearIngredientBtn.addEventListener("click", () => {
    ingredientInput.value = "";
    currentIngredient = "";
    clearIngredientBtn.classList.remove("show");
    applyFiltersAndRender();
  });
}

// tri
sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

fetchRecipes();
