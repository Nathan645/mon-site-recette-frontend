const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");
const filters = document.querySelectorAll("#filters button");
const recipeCount = document.getElementById("recipe-count");
const sortButtons = document.querySelectorAll(".sort-btn");

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

// Ajouter recette
addRecipeBtn.addEventListener("click", () => modal.style.display = "block");
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if(e.target === modal) modal.style.display = "none"; });

form.addEventListener("submit", async e => {
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
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRecipe)
    });
    if(!res.ok) throw new Error();
    form.reset();
    modal.style.display = "none";
    showNotification("Recette ajoutée !");
    filterRecipes();
  } catch {
    showNotification("Erreur lors de l'ajout", "error");
  }
});

// Filtrage optimisé côté backend
function filterRecipes() {
  const category = document.querySelector("#filters button.active").dataset.category;
  const title = document.getElementById("search-title").value;
  const ingredient = document.getElementById("search-ingredient").value;

  const params = new URLSearchParams();
  if(category) params.append("category", category);
  if(title) params.append("title", title);
  if(ingredient) params.append("ingredient", ingredient);

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => renderRecipes(data));
}

// Gestion des filtres
filters.forEach(btn => btn.addEventListener("click", () => {
  filters.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  filterRecipes();
}));

// Recherche
const titleInput = document.getElementById("search-title");
const ingredientInput = document.getElementById("search-ingredient");
const clearTitleBtn = document.getElementById("clear-title");
const clearIngredientBtn = document.getElementById("clear-ingredient");

[titleInput, ingredientInput].forEach(input => input.addEventListener("input", filterRecipes));

clearTitleBtn.addEventListener("click", () => { titleInput.value=""; filterRecipes(); });
clearIngredientBtn.addEventListener("click", () => { ingredientInput.value=""; filterRecipes(); });

// Tri
sortButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    sortButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const order = btn.dataset.sort;
    const recipes = Array.from(recipesContainer.children).map(card => card.dataset.id);
    recipes.sort((a,b) => order==="asc"? a.localeCompare(b): b.localeCompare(a));
    filterRecipes();
  });
});

// Initial render
filterRecipes();
