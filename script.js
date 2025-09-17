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

if (modalFavoriteIcon && modalFavoriteCheckbox) {
  modalFavoriteIcon.addEventListener("click", () => {
    modalFavoriteIcon.classList.toggle("active");
    modalFavoriteCheckbox.checked = modalFavoriteIcon.classList.contains("active");
  });
}

let allRecipes = [];
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let filterFavorites = false;

// --- Pagination ---
let currentPage = 1;
const recipesPerPage = 12; // nombre de cartes par page
const paginationContainer = document.getElementById("pagination");

function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// Afficher les recettes
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    recipesContainer.innerHTML = `<p>Aucune recette trouvée.</p>`;
  } else {
    // Calculer les recettes à afficher sur la page actuelle
    const start = (currentPage - 1) * recipesPerPage;
    const end = start + recipesPerPage;
    const recipesToShow = recipes.slice(start, end);

    recipesToShow.forEach(recipe => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      let favoriteHtml = recipe.favorite ? `<span class="favorite-icon">★</span>` : "";
      card.innerHTML = `
        ${recipe.image ? `<img src="${recipe.image}" alt="Image de ${recipe.title}">` : ""}
        ${favoriteHtml}
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

    renderPagination(recipes.length);
  }
  recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

// Générer la pagination
function renderPagination(totalRecipes) {
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

// Appliquer filtres et tri
function applyFiltersAndRender() {
  let filtered = [...allRecipes];

  if (currentCategory !== "all") filtered = filtered.filter(r => r.category === currentCategory);
  if (currentTitle) filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle));
  if (currentIngredient) filtered = filtered.filter(r => r.ingredients.some(i => i.toLowerCase().includes(currentIngredient)));
  if (filterFavorites) filtered = filtered.filter(r => r.favorite);

  switch(currentSort) {
    case "asc":
      filtered.sort((a,b) => a.title.localeCompare(b.title));
      break;
    case "desc":
      filtered.sort((a,b) => b.title.localeCompare(a.title));
      break;
    case "newest":
      filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      break;
    case "oldest":
      filtered.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
      break;
  }

  // reset page si la page actuelle dépasse le nombre de pages
  const totalPages = Math.ceil(filtered.length / recipesPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  renderRecipes(filtered);
}

// Récupérer toutes les recettes
async function fetchRecipes() {
  try {
    const response = await fetch(API_URL);
    allRecipes = await response.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
  }
}

// --- Modal ajout ---
addRecipeBtn.addEventListener("click", () => modal.style.display = "block");
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

// Ajouter recette
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newRecipe = {
    title: form.title.value,
    category: form.category.value,
    time: form.time.value,
    ingredients: form.ingredients.value.split(",").map(i => i.trim()),
    description: form.description.value,
    image: form.image.value || "",
    favorite: modalFavoriteCheckbox.checked
  };
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    });
    const created = await res.json();
    allRecipes.push(created);
    showNotification("Recette ajoutée !");
    form.reset();
    modal.style.display = "none";
    modalFavoriteIcon.classList.remove("active");
    applyFiltersAndRender();
  } catch (err) {
    console.error("Erreur lors de l'ajout :", err);
    showNotification("Erreur lors de l'ajout", "error");
  }
});

// --- Filtre catégorie ---
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// Filtre favoris
favoriteFilterBtn.addEventListener("click", () => {
  filterFavorites = !filterFavorites;
  favoriteFilterBtn.classList.toggle("active");
  currentPage = 1;
  applyFiltersAndRender();
});

// Tri
sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// Recherche
titleInput.addEventListener("input", () => {
  currentTitle = titleInput.value.toLowerCase();
  clearTitleBtn.classList.toggle("show", currentTitle.length > 0);
  currentPage = 1;
  applyFiltersAndRender();
});
ingredientInput.addEventListener("input", () => {
  currentIngredient = ingredientInput.value.toLowerCase();
  clearIngredientBtn.classList.toggle("show", currentIngredient.length > 0);
  currentPage = 1;
  applyFiltersAndRender();
});
clearTitleBtn.addEventListener("click", () => {
  titleInput.value = "";
  currentTitle = "";
  clearTitleBtn.classList.remove("show");
  currentPage = 1;
  applyFiltersAndRender();
});
clearIngredientBtn.addEventListener("click", () => {
  ingredientInput.value = "";
  currentIngredient = "";
  clearIngredientBtn.classList.remove("show");
  currentPage = 1;
  applyFiltersAndRender();
});

// --- Démarrage ---
fetchRecipes();
