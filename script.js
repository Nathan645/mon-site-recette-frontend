// --- Variables globales ---
let recipes = [];
let activeCategory = null;
let activeCombiFilters = new Set();
const API_URL = "http://localhost:3000/recipes";

// --- DOM Elements ---
const searchTitleInput = document.getElementById("search-title");
const searchIngredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");
const recipeContainer = document.getElementById("recipe-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const recipeModal = document.getElementById("recipe-modal");
const closeModal = document.getElementById("close-modal");
const recipeForm = document.getElementById("recipe-form");
const modalTitle = document.getElementById("modal-title");
const recipeIdInput = document.getElementById("recipe-id");
const modalFavoriteIcon = document.getElementById("modal-favorite-icon");
const modalFavoriteWrapper = document.getElementById("modal-favorite");

const filters = document.querySelectorAll(".category-buttons button[data-category]");
const combiFilters = document.querySelectorAll(".combi-filter");

// --- Fonctions utilitaires ---
function openModal(title) {
  modalTitle.textContent = title;
  recipeModal.style.display = "block";
}
function closeModalFunc() {
  recipeModal.style.display = "none";
  recipeForm.reset();
  recipeIdInput.value = "";
  modalFavoriteIcon.classList.remove("active");
}
function getFilteredRecipes() {
  let filtered = [...recipes];

  const titleTerm = searchTitleInput.value.toLowerCase();
  const ingredientTerm = searchIngredientInput.value.toLowerCase();

  if (activeCategory) {
    filtered = filtered.filter(r => r.category === activeCategory);
  }

  if (activeCombiFilters.has("gluten")) {
    filtered = filtered.filter(r =>
      !r.ingredients.some(i =>
        i.toLowerCase().includes("blé") ||
        i.toLowerCase().includes("farine") ||
        i.toLowerCase().includes("pâte") ||
        i.toLowerCase().includes("pâtes") ||
        i.toLowerCase().includes("biscuit") ||
        i.toLowerCase().includes("pain")
      )
    );
  }

  if (activeCombiFilters.has("vege")) {
    filtered = filtered.filter(r =>
      !r.ingredients.some(i =>
        i.toLowerCase().includes("viande") ||
        i.toLowerCase().includes("poulet") ||
        i.toLowerCase().includes("poisson") ||
        i.toLowerCase().includes("boeuf") ||
        i.toLowerCase().includes("porc") ||
        i.toLowerCase().includes("dinde") ||
        i.toLowerCase().includes("agneau")
      )
    );
  }

  if (titleTerm) {
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(titleTerm)
    );
  }

  if (ingredientTerm) {
    filtered = filtered.filter(r =>
      r.ingredients.some(i => i.toLowerCase().includes(ingredientTerm))
    );
  }

  return filtered;
}

function renderRecipes(list) {
  recipeContainer.innerHTML = "";
  if (list.length === 0) {
    recipeContainer.innerHTML = "<p>Aucune recette trouvée.</p>";
    return;
  }
  list.forEach(r => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <img src="${r.image || 'https://via.placeholder.com/300x200'}" alt="${r.title}">
      <div class="card-content">
        <h2>${r.title}</h2>
        <p><strong>Catégorie:</strong> ${r.category}</p>
        <p><strong>Temps:</strong> ${r.time}</p>
        <p>${r.description.substring(0, 100)}...</p>
        <span class="favorite-icon">${r.favorite ? "★" : "☆"}</span>
      </div>
    `;

    card.querySelector(".favorite-icon").addEventListener("click", async (e) => {
      e.stopPropagation();
      await fetch(`${API_URL}/${r._id}/favorite`, { method: "PUT" });
      fetchRecipes();
    });

    card.addEventListener("click", () => openEditModal(r));

    recipeContainer.appendChild(card);
  });
}

function applyFiltersAndRender() {
  const filtered = getFilteredRecipes();
  renderRecipes(filtered);
}

// --- CRUD ---
async function fetchRecipes() {
  const res = await fetch(API_URL);
  recipes = await res.json();
  applyFiltersAndRender();
}

function openEditModal(r) {
  openModal("Modifier Recette");
  recipeIdInput.value = r._id;
  document.getElementById("title").value = r.title;
  document.getElementById("category").value = r.category;
  document.getElementById("time").value = r.time;
  document.getElementById("ingredients").value = r.ingredients.join(", ");
  document.getElementById("description").value = r.description;
  document.getElementById("image").value = r.image || "";
  if (r.favorite) modalFavoriteIcon.classList.add("active");
  else modalFavoriteIcon.classList.remove("active");
}

recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = recipeIdInput.value;
  const body = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    time: document.getElementById("time").value,
    ingredients: document.getElementById("ingredients").value.split(",").map(i => i.trim()),
    description: document.getElementById("description").value,
    image: document.getElementById("image").value,
    favorite: modalFavoriteIcon.classList.contains("active")
  };
  if (id) {
    await fetch(`${API_URL}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } else {
    await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }
  closeModalFunc();
  fetchRecipes();
});

// --- Event Listeners ---
addRecipeBtn.addEventListener("click", () => openModal("Ajouter Recette"));
closeModal.addEventListener("click", closeModalFunc);
window.addEventListener("click", (e) => { if (e.target === recipeModal) closeModalFunc(); });

searchTitleInput.addEventListener("input", () => {
  clearTitleBtn.classList.toggle("show", searchTitleInput.value.length > 0);
  applyFiltersAndRender();
});
clearTitleBtn.addEventListener("click", () => {
  searchTitleInput.value = "";
  clearTitleBtn.classList.remove("show");
  applyFiltersAndRender();
});

searchIngredientInput.addEventListener("input", () => {
  clearIngredientBtn.classList.toggle("show", searchIngredientInput.value.length > 0);
  applyFiltersAndRender();
});
clearIngredientBtn.addEventListener("click", () => {
  searchIngredientInput.value = "";
  clearIngredientBtn.classList.remove("show");
  applyFiltersAndRender();
});

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    if (activeCategory === btn.dataset.category) {
      activeCategory = null;
      btn.classList.remove("active");
    } else {
      filters.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
    }
    applyFiltersAndRender();
  });
});

combiFilters.forEach(btn => {
  btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    if (activeCombiFilters.has(f)) {
      activeCombiFilters.delete(f);
      btn.classList.remove("active");
    } else {
      activeCombiFilters.add(f);
      btn.classList.add("active");
    }
    applyFiltersAndRender();
  });
});

modalFavoriteWrapper.addEventListener("click", () => {
  modalFavoriteIcon.classList.toggle("active");
});

// --- Init ---
fetchRecipes();
