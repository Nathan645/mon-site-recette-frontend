const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");

const filters = document.querySelectorAll("#filters button[data-category]");
const combinatoryBtns = {
  favorite: document.getElementById("filter-favorite"),
  gluten: document.getElementById("filter-gluten"),
  vege: document.getElementById("filter-vege"),
  grogros: document.getElementById("filter-grogros")
};
const sortButtons = document.querySelectorAll(".sort-controls .sort-btn");

const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");

const modalFavoriteIcon = document.getElementById("modal-favorite-icon");
const modalFavoriteCheckbox = document.getElementById("favorite-checkbox");

const recipeCount = document.getElementById("recipe-count");
const paginationContainer = document.getElementById("pagination");

let allRecipes = [];
let currentCategory = "all";
let currentSort = "asc";
let currentTitle = "";
let currentIngredient = "";
let currentPage = 1;
const recipesPerPage = 12;

let combinatoryFilters = {
  favorite: false,
  gluten: false,
  vege: false,
  grogros: false
};

// --- Notification ---
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = "";
  notif.classList.add("show", type);
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// --- Toggle favori modal ---
if (modalFavoriteIcon && modalFavoriteCheckbox) {
  modalFavoriteIcon.addEventListener("click", () => {
    modalFavoriteIcon.classList.toggle("active");
    modalFavoriteCheckbox.checked = modalFavoriteIcon.classList.contains("active");
  });
}

// --- Fetch recettes ---
async function fetchRecipes() {
  try {
    const res = await fetch(API_URL);
    allRecipes = await res.json();
    applyFiltersAndRender();
  } catch (err) {
    console.error("Erreur récupération :", err);
  }
}

// --- Render ---
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";
  if (recipes.length === 0) {
    recipesContainer.innerHTML = `<p>Aucune recette trouvée.</p>`;
  } else {
    const start = (currentPage-1)*recipesPerPage;
    const end = start+recipesPerPage;
    const recipesToShow = recipes.slice(start,end);

    recipesToShow.forEach(r => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      const favHtml = r.favorite ? `<span class="favorite-icon">★</span>` : "";
      card.innerHTML = `
        ${r.image ? `<img src="${r.image}" alt="Image de ${r.title}">` : ""}
        ${favHtml}
        <div class="card-content">
          <h2>${r.title}</h2>
          <p><strong>Catégorie :</strong> ${r.category}</p>
          <p><strong>Temps :</strong> ${r.time}</p>
          <h3>Ingrédients :</h3>
          <ul>${r.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
        </div>
      `;
      card.addEventListener("click", () => window.location.href = `recette.html?id=${r._id}`);
      recipesContainer.appendChild(card);
    });

    renderPagination(recipes.length);
  }
  recipeCount.textContent = `${recipes.length} recette(s) trouvée(s)`;
}

// --- Pagination ---
function renderPagination(totalRecipes) {
  paginationContainer.innerHTML = "";
  const totalPages = Math.ceil(totalRecipes / recipesPerPage);
  if (totalPages <= 1) return;
  for (let i=1; i<=totalPages; i++){
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.toggle("active", i===currentPage);
    btn.addEventListener("click", () => { currentPage=i; applyFiltersAndRender(); });
    paginationContainer.appendChild(btn);
  }
}

// --- Appliquer filtres et tri ---
function applyFiltersAndRender() {
  let filtered = [...allRecipes];

  // Catégorie
  if (currentCategory !== "all") filtered = filtered.filter(r => r.category === currentCategory);

  // Recherche
  if (currentTitle) filtered = filtered.filter(r => r.title.toLowerCase().includes(currentTitle));
  if (currentIngredient) filtered = filtered.filter(r => r.ingredients.some(i => i.toLowerCase().includes(currentIngredient)));

  // Filtres combinatoires
  if (combinatoryFilters.favorite) filtered = filtered.filter(r => r.favorite);
  if (combinatoryFilters.gluten) filtered = filtered.filter(r => r.glutenFree);
  if (combinatoryFilters.vege) filtered = filtered.filter(r => r.vege);
  if (combinatoryFilters.grogros) filtered = filtered.filter(r => r.grogros);

  // Tri
  switch(currentSort){
    case "asc": filtered.sort((a,b)=>a.title.localeCompare(b.title)); break;
    case "desc": filtered.sort((a,b)=>b.title.localeCompare(a.title)); break;
    case "newest": filtered.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); break;
    case "oldest": filtered.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)); break;
  }

  const totalPages = Math.ceil(filtered.length / recipesPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  renderRecipes(filtered);
}

// --- Filtres catégorie ---
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    currentPage = 1;
    applyFiltersAndRender();
  });
});

// --- Filtres combinatoires ---
function toggleFilter(key, btn){
  combinatoryFilters[key] = !combinatoryFilters[key];
  btn.classList.toggle("active");
  currentPage=1;
  applyFiltersAndRender();
}
Object.entries(combinatoryBtns).forEach(([key, btn]) => btn.addEventListener("click", () => toggleFilter(key, btn)));

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

// --- Recherche ---
titleInput.addEventListener("input", ()=>{
  currentTitle = titleInput.value.toLowerCase();
  clearTitleBtn.classList.toggle("show", currentTitle.length>0);
  currentPage=1;
  applyFiltersAndRender();
});
ingredientInput.addEventListener("input", ()=>{
  currentIngredient = ingredientInput.value.toLowerCase();
  clearIngredientBtn.classList.toggle("show", currentIngredient.length>0);
  currentPage=1;
  applyFiltersAndRender();
});
clearTitleBtn.addEventListener("click", ()=>{
  titleInput.value=""; currentTitle=""; clearTitleBtn.classList.remove("show"); currentPage=1; applyFiltersAndRender();
});
clearIngredientBtn.addEventListener("click", ()=>{
  ingredientInput.value=""; currentIngredient=""; clearIngredientBtn.classList.remove("show"); currentPage=1; applyFiltersAndRender();
});

// --- Modal ajout ---
addRecipeBtn.addEventListener("click", ()=> modal.style.display="block");
closeBtn.addEventListener("click", ()=> modal.style.display="none");
window.addEventListener("click", e => { if(e.target===modal) modal.style.display="none"; });

// Ajouter recette
form.addEventListener("submit", async e=>{
  e.preventDefault();
  const newRecipe = {
    title: form.title.value,
    category: form.category.value,
    time: form.time.value,
    ingredients: form.ingredients.value.split(",").map(i=>i.trim()),
    description: form.description.value,
    image: form.image.value||"",
    favorite: modalFavoriteCheckbox.checked,
    glutenFree: document.getElementById("recipe-gluten").checked,
    vege: document.getElementById("recipe-vege").checked,
    grogros: document.getElementById("recipe-grogros").checked
  };
  try {
    const res = await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(newRecipe)
    });
    const created = await res.json();
    allRecipes.push(created);
    showNotification("Recette ajoutée !");
    form.reset();
    modal.style.display="none";
    modalFavoriteIcon.classList.remove("active");
    applyFiltersAndRender();
  } catch(err){
    console.error(err);
    showNotification("Erreur lors de l'ajout","error");
  }
});

// --- Démarrage ---
fetchRecipes();
