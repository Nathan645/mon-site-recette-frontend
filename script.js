const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const recipesContainer = document.getElementById("recipes-container");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("recipe-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("recipe-form");

const modalFavoriteCheckbox = document.getElementById("favorite-checkbox");
const modalVege = document.getElementById("modal-vege");
const modalGrogros = document.getElementById("modal-grogros");

let allRecipes = [];
let editingRecipeId = null;

// --- Notification ---
function showNotification(message, type = "success") {
  const notif = document.getElementById("notification");
  notif.textContent = message;
  notif.className = `show ${type}`;
  setTimeout(() => notif.classList.remove("show"), 3000);
}

// --- Render ---
function renderRecipes(recipes) {
  recipesContainer.innerHTML = "";

  recipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      ${recipe.favorite ? `<span class="favorite-icon">★</span>` : ""}
      <div class="card-content">
        <h2>${recipe.title}</h2>
        <p><strong>Catégorie :</strong> ${recipe.category}</p>
        <p><strong>Temps :</strong> ${recipe.time}</p>
        <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}</ul>
      </div>
    `;

    card.addEventListener("click", () => {
      openEditModal(recipe._id);
    });

    recipesContainer.appendChild(card);
  });
}

// --- Fetch ---
async function fetchRecipes() {
  const res = await fetch(API_URL);
  allRecipes = await res.json();
  renderRecipes(allRecipes);
}

// --- Modal open création ---
addRecipeBtn.addEventListener("click", () => {
  editingRecipeId = null;
  form.reset();
  modal.style.display = "block";
});

// --- Modal open édition ---
async function openEditModal(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const recipe = await res.json();

  document.getElementById("title").value = recipe.title;
  document.getElementById("category").value = recipe.category;
  document.getElementById("time").value = recipe.time;
  document.getElementById("ingredients").value = recipe.ingredients.join(", ");
  document.getElementById("description").value = recipe.description;
  modalFavoriteCheckbox.checked = recipe.favorite;
  modalVege.checked = recipe.vege;
  modalGrogros.checked = recipe.grogros;

  editingRecipeId = id;
  modal.style.display = "block";
}

// --- Submit ---
form.addEventListener("submit", async e => {
  e.preventDefault();

  const payload = {
    title: title.value,
    category: category.value,
    time: time.value,
    ingredients: ingredients.value.split(",").map(i => i.trim()),
    description: description.value,
    favorite: modalFavoriteCheckbox.checked,
    vege: modalVege.checked,
    grogros: modalGrogros.checked
  };

  const method = editingRecipeId ? "PUT" : "POST";
  const url = editingRecipeId ? `${API_URL}/${editingRecipeId}` : API_URL;

  await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  showNotification(editingRecipeId ? "Recette modifiée" : "Recette ajoutée");
  modal.style.display = "none";
  editingRecipeId = null;
  fetchRecipes();
});

// --- Close modal ---
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

fetchRecipes();
