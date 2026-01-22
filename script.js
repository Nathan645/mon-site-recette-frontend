const API_URL = "https://mon-site-recette-backend.onrender.com/recipes";

const container = document.getElementById("recipe-list");
const searchBar = document.getElementById("search-bar");
const clearBtn = document.getElementById("clear-search");
const addBtn = document.getElementById("add-recipe-btn");
const modal = document.getElementById("add-modal");
const closeBtn = document.querySelector(".close-btn");
const form = document.getElementById("add-form");
const categoryBtns = document.querySelectorAll("[data-category]");
const sortBtns = document.querySelectorAll(".sort-btn");
const favoriteBtn = document.getElementById("filter-favorite");
const combiBtns = document.querySelectorAll(".combi-filter");

let allRecipes = [];
let filters = { category: "all", search: "", favorite: false, combi: [] };

function render(recipes) {
  container.innerHTML = "";
  recipes.forEach(r => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${r.image ? `<img src="${r.image}">` : ""}
      <div class="card-content">
        <h2>${r.title}</h2>
        <p>${r.time}</p>
      </div>
    `;
    card.onclick = () => location.href = `recette.html?id=${r._id}`;
    container.appendChild(card);
  });
}

function applyFilters() {
  let res = [...allRecipes];
  if (filters.category !== "all")
    res = res.filter(r => r.category === filters.category);
  if (filters.search)
    res = res.filter(r => r.title.toLowerCase().includes(filters.search));
  if (filters.favorite)
    res = res.filter(r => r.favorite);
  filters.combi.forEach(f => res = res.filter(r => r[f]));
  render(res);
}

fetch(API_URL).then(r => r.json()).then(d => { allRecipes = d; applyFilters(); });

searchBar.oninput = e => {
  filters.search = e.target.value.toLowerCase();
  clearBtn.classList.toggle("show", filters.search);
  applyFilters();
};

clearBtn.onclick = () => {
  searchBar.value = "";
  filters.search = "";
  clearBtn.classList.remove("show");
  applyFilters();
};

categoryBtns.forEach(b => b.onclick = () => {
  categoryBtns.forEach(x => x.classList.remove("active"));
  b.classList.add("active");
  filters.category = b.dataset.category;
  applyFilters();
});

favoriteBtn.onclick = () => {
  filters.favorite = !filters.favorite;
  favoriteBtn.classList.toggle("active");
  applyFilters();
};

combiBtns.forEach(b => b.onclick = () => {
  b.classList.toggle("active");
  const f = b.dataset.filter;
  filters.combi.includes(f)
    ? filters.combi = filters.combi.filter(x => x !== f)
    : filters.combi.push(f);
  applyFilters();
});

addBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";

form.onsubmit = async e => {
  e.preventDefault();
  const data = {
    title: title.value,
    category: category.value,
    time: time.value,
    ingredients: ingredients.value.split(",").map(i => i.trim()),
    description: description.value,
    image: image.value,
    favorite: favorite.checked,
    vege: vege.checked,
    gluten: gluten.checked,
    grogros: grogros.checked
  };
  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  modal.style.display = "none";
  location.reload();
};
