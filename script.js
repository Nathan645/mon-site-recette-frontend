const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipe-list");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("add-modal");
const closeBtn = document.querySelector("#add-modal .close-btn");
const form = document.getElementById("add-form");
const filters = document.querySelectorAll("#filters button[data-category]");
const sortButtons = document.querySelectorAll(".sort-btn");
const favoriteFilterBtn = document.getElementById("filter-favorite");
const combiFilterButtons = document.querySelectorAll(".combi-filter");
const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");
const modalFavoriteCheckbox = document.getElementById("favorite-checkbox");
const modalVege = document.getElementById("modal-vege");
const modalGluten = document.getElementById("modal-gluten");
const modalGrogros = document.getElementById("modal-grogros");

let allRecipes = [];
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let filterFavorites = false;
let activeCombiFilters = [];
let currentPage = 1;
const recipesPerPage = 12;

function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = `show ${type}`;
  setTimeout(() => notif.className = "", 3000);
}

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

function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (!recipes.length) {
    recipesContainer.innerHTML = "<p>Aucune recette trouvée.</p>";
    return;
  }

  const start = (currentPage - 1) * recipesPerPage;
  const end = start + recipesPerPage;
  const recipesToShow = recipes.slice(start, end);

  recipesToShow.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    const favHtml = recipe.favorite ? `<span class="favorite-icon">★</span>` : "";
    card.innerHTML = `
      ${recipe.image ? `<img src="${recipe.image}" alt="Image de ${recipe.title}">` : ""}
      ${favHtml}
      <div class="card-content">
        <h2>${recipe.title}</h2>
        <p><strong>Catégorie :</strong> ${recipe.category}</p>
        <p><strong>Temps :</strong> ${recipe.time}</p>
        <ul>${Array.isArray(recipe.ingredients) ? recipe.ingredients.map(i=>`<li>${i}</li>`).join("") : ""}</ul>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `recette.html?id=${recipe._id}`;
    });
    recipesContainer.appendChild(card);
  });

  renderPagination(recipes.length);
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
    btn.onclick = () => { currentPage = i; applyFiltersAndRender(); };
    paginationContainer.appendChild(btn);
  }
}

function applyFiltersAndRender() {
  let filtered = [...allRecipes];
  if (currentCategory !== "all") filtered = filtered.filter(r => r.category === currentCategory);
  if (currentTitle.trim()) filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle.toLowerCase()));
  if (currentIngredient.trim()) filtered = filtered.filter(r => r.ingredients.some(i => i.toLowerCase().includes(currentIngredient.toLowerCase())));
  if (filterFavorites) filtered = filtered.filter(r => r.favorite);
  activeCombiFilters.forEach(f => {
    if (f === "gluten") filtered = filtered.filter(detectGlutenFree);
    if (f === "vege") filtered = filtered.filter(detectVege);
    if (f === "grogros") filtered = filtered.filter(detectGrogros);
  });

  if (currentSort === "asc") filtered.sort((a,b) => a.title.localeCompare(b.title));
  if (currentSort === "desc") filtered.sort((a,b) => b.title.localeCompare(a.title));
  if (currentSort === "newest") filtered.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  if (currentSort === "oldest") filtered.sort((a,b) => new Date(a.createdAt)-new Date(b.createdAt));

  renderRecipes(filtered);
}

async function fetchRecipes() {
  try {
    const res = await fetch(API_URL);
    allRecipes = await res.json();
    applyFiltersAndRender();
  } catch {
    showNotification("Impossible de charger les recettes", "error");
  }
}

/* ================= EVENTS ================= */
addRecipeBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

form.onsubmit = async e => {
  e.preventDefault();
  const newRecipe = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    time: document.getElementById("time").value,
    ingredients: document.getElementById("ingredients").value.split(",").map(i=>i.trim()).filter(Boolean),
    description: document.getElementById("description").value,
    image: document.getElementById("image").value,
    favorite: modalFavoriteCheckbox.checked,
    vege: modalVege.checked,
    gluten: modalGluten.checked,
    grogros: modalGrogros.checked
  };
  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(newRecipe)
    });
    if (!res.ok) throw new Error();
    form.reset();
    modalFavoriteCheckbox.checked = false;
    modal.style.display = "none";
    fetchRecipes();
    showNotification("Recette ajoutée !");
  } catch {
    showNotification("Erreur lors de l'ajout", "error");
  }
};

/* Category filters */
filters.forEach(btn => btn.onclick = () => {
  filters.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = btn.dataset.category;
  currentPage = 1;
  applyFiltersAndRender();
});

/* Favorite filter */
favoriteFilterBtn.onclick = () => {
  filterFavorites = !filterFavorites;
  favoriteFilterBtn.classList.toggle("active");
  currentPage = 1;
  applyFiltersAndRender();
};

/* Combifilters */
combiFilterButtons.forEach(btn => btn.onclick = () => {
  const f = btn.dataset.filter;
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) activeCombiFilters.push(f);
  else activeCombiFilters = activeCombiFilters.filter(v => v!==f);
  currentPage=1; applyFiltersAndRender();
});

/* Search */
titleInput.oninput = () => { currentTitle=titleInput.value; currentPage=1; applyFiltersAndRender(); };
ingredientInput.oninput = () => { currentIngredient=ingredientInput.value; currentPage=1; applyFiltersAndRender(); };

/* Sort */
sortButtons.forEach(btn => btn.onclick = () => {
  sortButtons.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  currentSort = btn.dataset.sort;
  currentPage=1; applyFiltersAndRender();
});

fetchRecipes();
