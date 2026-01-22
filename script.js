const API_URL = "https://mon-site-recette-backend.onrender.com";

// DOM Elements
const recipeList = document.getElementById("recipe-list");
const addBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("add-modal");
const closeModal = document.getElementById("close-modal");
const addForm = document.getElementById("add-form");
const notif = document.getElementById("notification");

const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const timeInput = document.getElementById("time");
const ingredientsInput = document.getElementById("ingredients");
const descriptionInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const favoriteCheckbox = document.getElementById("favorite-checkbox");

let allRecipes = [];

// ---------------- Notification ----------------
function showNotification(message, type="success") {
  notif.textContent = message;
  notif.className = `show ${type}`;
  setTimeout(() => notif.className = "", 3000);
}

// ---------------- Fetch Recipes ----------------
async function fetchRecipes() {
  try {
    const res = await fetch(API_URL);
    allRecipes = await res.json();
    renderRecipes();
  } catch (err) {
    console.error(err);
    showNotification("Impossible de charger les recettes", "error");
  }
}

// ---------------- Render Recipes ----------------
function renderRecipes() {
  recipeList.innerHTML = "";
  if (!allRecipes.length) {
    recipeList.innerHTML = "<p>Aucune recette trouvée.</p>";
    return;
  }

  allRecipes.forEach(recipe => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}">` : ""}
      ${recipe.favorite ? `<span class="favorite-icon">★</span>` : ""}
      <h2>${recipe.title}</h2>
      <p><strong>Catégorie:</strong> ${recipe.category}</p>
      <p><strong>Temps:</strong> ${recipe.time}</p>
      <ul>${recipe.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>
      <p>${recipe.description}</p>
    `;
    recipeList.appendChild(card);
  });
}

// ---------------- Open/Close Modal ----------------
addBtn.onclick = () => modal.style.display = "block";
closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// ---------------- Add Recipe ----------------
addForm.onsubmit = async (e) => {
  e.preventDefault();

  const newRecipe = {
    title: titleInput.value,
    category: categoryInput.value,
    time: timeInput.value,
    ingredients: ingredientsInput.value.split(",").map(i=>i.trim()).filter(Boolean),
    description: descriptionInput.value,
    image: imageInput.value,
    favorite: favoriteCheckbox.checked
  };

  try {
    const res = await fetch(API_URL, {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(newRecipe)
    });

    if (!res.ok) throw new Error("Erreur lors de l'ajout");
    addForm.reset();
    favoriteCheckbox.checked = false;
    modal.style.display = "none";
    showNotification("Recette ajoutée !");
    fetchRecipes();
  } catch (err) {
    console.error(err);
    showNotification("Impossible d'ajouter la recette", "error");
  }
};

// ---------------- Initial Fetch ----------------
fetchRecipes();
