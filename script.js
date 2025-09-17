const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("add-recipe-modal");
const closeBtn = modal.querySelector(".close-btn");
const form = document.getElementById("add-recipe-form");
const filters = document.querySelectorAll("#filters button");
const recipeCount = document.getElementById("recipe-count");
const sortButtons = document.querySelectorAll(".sort-btn");
const favoriteFilterBtn = document.getElementById("filter-favorite");

const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");

const modalFavoriteIcon = document.getElementById("add-modal-favorite-icon");
const modalFavoriteCheckbox = document.getElementById("add-favorite-checkbox");

modalFavoriteIcon.addEventListener("click", () => {
  modalFavoriteIcon.classList.toggle("active");
  modalFavoriteCheckbox.checked = modalFavoriteIcon.classList.contains("active");
});

let allRecipes = [];
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let filterFavorites = false;

function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    recipesContainer.innerHTML = `<p>Aucune recette trouvée.</p>`;
  } else {
    recipes.forEach(recipe => {
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
      card.addEventListener("click", (e) => {
        if (!e.target.classList.contains("favorite-icon")) {
          window.location.href = `recette.html?id=${recipe._id}`;
        }
      });
      recipesContainer.appendChild(card);
    });
  }
  recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

function applyFiltersAndRender() {
  let filtered = [...allRecipes];
  if (currentCategory !== "all") filtered = filtered.filter(r => r.category === currentCategory);
  if (currentTitle) filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle));
  if (currentIngredient) filtered = filtered.filter(r => r.ingredients.some(i => i.toLowerCase().includes(currentIngredient)));
  if (filterFavorites) filtered = filtered.filter(r => r.favorite);
  filtered.sort((a, b) => currentSort === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
  renderRecipes(filtered);
}

async function fetchRecipes() {
  try {
    const response = await fetch(API_URL);
    allRecipes = await response.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error("Erreur lors de la récupération :", err);
  }
}

// Gestion modale
addRecipeBtn.addEventListener("click", () => modal.style.display = "block");
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newRecipe = {
    title: document.getElementById("add-title").value,
    category: document.getElementById("add-category").value,
    time: document.getElementById("add-time").value,
    ingredients: document.getElementById("add-ingredients").value.split(",").map(i => i.trim()),
    description: document.getElementById("add-description").value,
    image: document.getElementById("add-image").value || "",
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

// Filtres et tri
filters.forEach(btn => btn.addEventListener("click", () => {
  filters.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = btn.dataset.category;
  applyFiltersAndRender();
}));

favoriteFilterBtn.addEventListener("click", () => {
  filterFavorites = !filterFavorites;
  favoriteFilterBtn.classList.toggle("active");
  applyFiltersAndRender();
});

sortButtons.forEach(btn => btn.addEventListener("click", () => {
  sortButtons.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentSort = btn.dataset.sort;
  applyFiltersAndRender();
}));

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

fetchRecipes();
