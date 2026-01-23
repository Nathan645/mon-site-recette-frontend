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

// --- Mode édition ---
let editingRecipeId = null; // null = création, sinon id de la recette à modifier

// --- Notification ---
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// --- Helpers combinatoires ---
function detectGlutenFree(recipe) {
  if (typeof recipe.gluten === "boolean") return recipe.gluten;
  if (!Array.isArray(recipe.ingredients)) return false;
  const text = recipe.ingredients.join(" ").toLowerCase();
  return !(/blé|farine|pâte|wheat|flour|orge|rye|seigle|barley/.test(text));
}

function detectVege(recipe) {
  if (typeof recipe.vege === "boolean") return recipe.vege;
  if (!Array.isArray(recipe.ingredients)) return false;
  const text = recipe.ingredients.join(" ").toLowerCase();
  return !(/viande|poulet|poisson|boeuf|porc|agneau|bacon|jambon|saucisse|saumon|thon/.test(text));
}

function detectGrogros(recipe) {
  if (typeof recipe.grogros === "boolean") return recipe.grogros;
  if (!Array.isArray(recipe.ingredients)) return false;
  return recipe.ingredients.length >= 8;
}

// --- Render recettes ---
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

// --- Appliquer filtres + tri ---
function applyFiltersAndRender() {
  let filtered = [...allRecipes];

  if (currentCategory !== "all") filtered = filtered.filter(r => r.category === currentCategory);
  if (currentTitle.trim() !== "") filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle.toLowerCase()));
  if (currentIngredient.trim() !== "") filtered = filtered.filter(r => Array.isArray(r.ingredients) && r.ingredients.some(i => i.toLowerCase().includes(currentIngredient.toLowerCase())));
  if (filterFavorites) filtered = filtered.filter(r => r.favorite);

  if (activeCombiFilters.length > 0) {
    activeCombiFilters.forEach(f => {
      if (f === "gluten") filtered = filtered.filter(r => detectGlutenFree(r));
      if (f === "vege") filtered = filtered.filter(r => detectVege(r));
      if (f === "grogros") filtered = filtered.filter(r => detectGrogros(r));
    });
  }

  if (currentSort === "asc") filtered.sort((a, b) => a.title.localeCompare(b.title));
  else if (currentSort === "desc") filtered.sort((a, b) => b.title.localeCompare(a.title));
  else if (currentSort === "newest") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  else if (currentSort === "oldest") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  renderRecipes(filtered);
}

// --- Fetch recettes ---
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

// --- Modal toggle favori ---
if (modalFavoriteIcon && modalFavoriteCheckbox) {
  modalFavoriteIcon.addEventListener("click", () => {
    modalFavoriteIcon.classList.toggle("active");
    modalFavoriteCheckbox.checked = modalFavoriteIcon.classList.contains("active");
  });
}

// --- Ouvrir modal création ---
addRecipeBtn.addEventListener("click", () => {
  editingRecipeId = null; // mode création
  form.reset();
  modalFavoriteIcon.classList.remove("active");
  modalGluten.checked = false;
  modalVege.checked = false;
  modalGrogros.checked = false;
  modal.style.display = "block";
});

// --- Fermer modal ---
if (closeBtn) closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// --- Ouvrir modal édition ---
async function openEditModal(recipeId) {
  try {
    const res = await fetch(`${API_URL}/${recipeId}`);
    if (!res.ok) throw new Error("Recette introuvable");
    const recipe = await res.json();

    document.getElementById("title").value = recipe.title;
    document.getElementById("category").value = recipe.category;
    document.getElementById("time").value = recipe.time;
    document.getElementById("ingredients").value = recipe.ingredients.join(", ");
    document.getElementById("description").value = recipe.description;
    document.getElementById("image").value = recipe.image || "";
    modalFavoriteCheckbox.checked = recipe.favorite;
    modalFavoriteIcon.classList.toggle("active", recipe.favorite);
    modalGluten.checked = recipe.gluten;
    modalVege.checked = recipe.vege;
    modalGrogros.checked = recipe.grogros;

    editingRecipeId = recipeId;
    modal.style.display = "block";
  } catch (err) {
    console.error(err);
    showNotification("Impossible de charger la recette", "error");
  }
}

// --- Form submit (création + édition) ---
form.addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
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
    let res;
    if (editingRecipeId) {
      res = await fetch(`${API_URL}/${editingRecipeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      showNotification(editingRecipeId ? "Recette modifiée !" : "Recette ajoutée !");
      form.reset();
      modalFavoriteIcon.classList.remove("active");
      modal.style.display = "none";
      editingRecipeId = null;
      fetchRecipes();
    } else {
      const data = await res.json();
      showNotification(data.error || "Erreur serveur", "error");
    }
  } catch (err) {
    console.error(err);
    showNotification("Erreur serveur", "error");
  }
});

// --- Category filters ---
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// --- Favorite filter ---
if (favoriteFilterBtn) {
  favoriteFilterBtn.addEventListener("click", () => {
    favoriteFilterBtn.classList.toggle("active");
    filterFavorites = !filterFavorites;
    currentPage = 1;
    applyFiltersAndRender();
  });
}

// --- Combi filters ---
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

// --- Search title ---
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

// --- Search ingredient ---
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

// --- Tri ---
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
