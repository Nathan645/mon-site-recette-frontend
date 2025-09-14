// script.js
const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");
const filters = document.querySelectorAll("#filters button");
const recipeCount = document.getElementById("recipe-count");
const sortButtons = document.querySelectorAll(".sort-btn");

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
  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${recipe.image ? `<img src="${recipe.image}" alt="Image de ${recipe.title}">` : ""}
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
  recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

// --- Récupérer toutes les recettes depuis le backend ---
async function fetchRecipes() {
  try {
    const response = await fetch(API_URL);
    const recipes = await response.json();
    renderRecipes(recipes);
  } catch (err) {
    console.error("Erreur lors de la récupération des recettes :", err);
  }
}

// --- Ajouter une recette ---
addRecipeBtn.addEventListener("click", () => modal.style.display = "block");
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newRecipe = {
    title: form.title.value,
    category: form.category.value,
    time: form.time.value,
    ingredients: form.ingredients.value.split(",").map(i => i.trim()),
    description: form.description.value,
    image: form.image.value || ""
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    });
    showNotification("Recette ajoutée !");
    form.reset();
    modal.style.display = "none";
    fetchRecipes();
  } catch (err) {
    console.error("Erreur lors de l'ajout :", err);
    showNotification("Erreur lors de l'ajout", "error");
  }
});

// --- Filtrer par catégorie ---
filters.forEach(btn => {
  btn.addEventListener("click", async () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    try {
      const response = await fetch(API_URL);
      let recipes = await response.json();
      const category = btn.dataset.category;
      if(category !== "all") {
        recipes = recipes.filter(r => r.category === category);
      }
      renderRecipes(recipes);
    } catch (err) {
      console.error(err);
    }
  });
});

// --- Trier par titre ---
sortButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    try {
      const response = await fetch(API_URL);
      let recipes = await response.json();
      const order = btn.dataset.sort;
      recipes.sort((a, b) => order === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
      renderRecipes(recipes);
    } catch (err) {
      console.error(err);
    }
  });
});

// --- Recherche par titre et ingrédient ---
function setupSearch() {
  const titleInput = document.getElementById("search-title");
  const ingredientInput = document.getElementById("search-ingredient");
  const clearTitleBtn = document.getElementById("clear-title");
  const clearIngredientBtn = document.getElementById("clear-ingredient");

  async function filterRecipes() {
    try {
      const response = await fetch(API_URL);
      let recipes = await response.json();
      const title = titleInput.value.toLowerCase();
      const ingredient = ingredientInput.value.toLowerCase();
      recipes = recipes.filter(r =>
        r.title.toLowerCase().includes(title) &&
        r.ingredients.some(i => i.toLowerCase().includes(ingredient))
      );
      renderRecipes(recipes);
    } catch (err) {
      console.error(err);
    }
  }

  titleInput.addEventListener("input", () => {
    clearTitleBtn.classList.toggle("show", titleInput.value.length > 0);
    filterRecipes();
  });
  ingredientInput.addEventListener("input", () => {
    clearIngredientBtn.classList.toggle("show", ingredientInput.value.length > 0);
    filterRecipes();
  });
  clearTitleBtn.addEventListener("click", () => {
    titleInput.value = "";
    clearTitleBtn.classList.remove("show");
    filterRecipes();
  });
  clearIngredientBtn.addEventListener("click", () => {
    ingredientInput.value = "";
    clearIngredientBtn.classList.remove("show");
    filterRecipes();
  });
}

setupSearch();
fetchRecipes();
