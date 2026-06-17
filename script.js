const STORAGE_KEY = "amazon-in-clone-cart";
const HERO_INTERVAL_MS = 5000;

const pageData = JSON.parse(document.getElementById("pageData").textContent);

const navLinks = document.getElementById("navLinks");
const heroTrack = document.getElementById("heroTrack");
const heroDots = document.getElementById("heroDots");
const cardGrid = document.getElementById("cardGrid");
const dealTrack = document.getElementById("dealTrack");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchCategory = document.getElementById("searchCategory");
const searchSuggestions = document.getElementById("searchSuggestions");
const searchHint = document.getElementById("searchHint");
const cartDrawer = document.getElementById("cartDrawer");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const backdrop = document.getElementById("backdrop");
const menuToggle = document.getElementById("menuToggle");

let currentSlide = 0;
let heroTimer = null;
let cart = loadCart();

function formatRupees(value) {
  return `Rs.${value.toLocaleString("en-IN")}`;
}

function loadCart() {
  const savedCart = localStorage.getItem(STORAGE_KEY);

  if (!savedCart) {
    return [];
  }

  try {
    return JSON.parse(savedCart);
  } catch (error) {
    console.error("Could not parse saved cart", error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function renderNavLinks() {
  pageData.navLinks.forEach((label) => {
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = label;
    navLinks.appendChild(link);
  });
}

function renderHero() {
  heroTrack.innerHTML = "";
  heroDots.innerHTML = "";

  pageData.heroSlides.forEach((slide, index) => {
    const slideElement = document.createElement("div");
    slideElement.className = "hero__slide";
    slideElement.innerHTML = `<img src="${slide.image}" alt="${slide.alt}">`;
    heroTrack.appendChild(slideElement);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => {
      currentSlide = index;
      updateHeroPosition();
      restartHeroTimer();
    });
    heroDots.appendChild(dot);
  });

  updateHeroPosition();
}

function updateHeroPosition() {
  heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

  Array.from(heroDots.children).forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentSlide);
  });
}

function goToNextSlide() {
  currentSlide = (currentSlide + 1) % pageData.heroSlides.length;
  updateHeroPosition();
}

function goToPreviousSlide() {
  currentSlide =
    (currentSlide - 1 + pageData.heroSlides.length) % pageData.heroSlides.length;
  updateHeroPosition();
}

function startHeroTimer() {
  heroTimer = window.setInterval(goToNextSlide, HERO_INTERVAL_MS);
}

function restartHeroTimer() {
  window.clearInterval(heroTimer);
  startHeroTimer();
}

function createQuadCard(card) {
  const article = document.createElement("article");
  article.className = "home-card";
  article.id = `card-${card.id}`;
  article.dataset.searchText = [card.title, card.category]
    .concat(card.items.map((item) => item.label))
    .join(" ")
    .toLowerCase();
  article.dataset.category = card.category;

  article.innerHTML = `
    <h2>${card.title}</h2>
    <div class="home-card__grid">
      ${card.items
        .map(
          (item) => `
            <a class="home-card__tile" href="#">
              <img src="${item.image}" alt="${item.label}">
              <span>${item.label}</span>
            </a>
          `
        )
        .join("")}
    </div>
    <a class="home-card__footer" href="#">${card.footer}</a>
  `;

  return article;
}

function createFeatureCard(card) {
  const article = document.createElement("article");
  article.className = "home-card feature-card";
  article.id = `card-${card.id}`;
  article.dataset.searchText = [card.title, card.category, card.heroLabel, card.meta]
    .concat(card.items.map((item) => item.label))
    .join(" ")
    .toLowerCase();
  article.dataset.category = card.category;

  article.innerHTML = `
    <h2>${card.title}</h2>
    <div class="feature-card__hero">
      <img src="${card.heroImage}" alt="${card.heroLabel}">
      <strong>${card.heroLabel}</strong>
      <span class="feature-card__meta">${card.meta}</span>
    </div>
    <div class="feature-card__thumbs">
      ${card.items
        .map(
          (item) => `
            <a class="feature-card__thumb" href="#">
              <img src="${item.image}" alt="${item.label}">
              <span>${item.label}</span>
            </a>
          `
        )
        .join("")}
    </div>
    <a class="home-card__footer" href="#">${card.footer}</a>
  `;

  return article;
}

function renderCards() {
  cardGrid.innerHTML = "";

  pageData.cards.forEach((card) => {
    const cardElement =
      card.type === "feature" ? createFeatureCard(card) : createQuadCard(card);
    cardGrid.appendChild(cardElement);
  });
}

function renderDeals() {
  dealTrack.innerHTML = "";

  pageData.deals.forEach((deal) => {
    const article = document.createElement("article");
    article.className = "deal-tile";
    article.id = `deal-${deal.id}`;
    article.dataset.searchText = [deal.title, deal.category, deal.badge]
      .join(" ")
      .toLowerCase();
    article.dataset.category = deal.category;
    article.innerHTML = `
      <img src="${deal.image}" alt="${deal.title}">
      <span class="deal-tile__badge">${deal.badge}</span>
      <div class="deal-tile__title">${deal.title}</div>
      <div class="deal-tile__meta">
        <strong>${formatRupees(deal.price)}</strong>
        <span>${formatRupees(deal.mrp)}</span>
      </div>
      <button class="deal-tile__button" type="button" data-deal-id="${deal.id}">
        Add to cart
      </button>
    `;
    dealTrack.appendChild(article);
  });
}

function getSearchMatches(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const selectedCategory = searchCategory.value;

  if (!normalizedQuery && selectedCategory === "All Categories") {
    return [];
  }

  const cardMatches = pageData.cards
    .map((card) => ({
      label: card.title,
      category: card.category,
      type: "Department",
      targetId: `card-${card.id}`,
      searchableText: [card.title, card.category]
        .concat(card.items.map((item) => item.label))
        .join(" ")
        .toLowerCase()
    }))
    .filter((item) => {
      const categoryOk =
        selectedCategory === "All Categories" || item.category === selectedCategory;
      const queryOk =
        !normalizedQuery || item.searchableText.includes(normalizedQuery);

      return categoryOk && queryOk;
    });

  const dealMatches = pageData.deals
    .map((deal) => ({
      label: deal.title,
      category: deal.category,
      type: "Deal",
      targetId: `deal-${deal.id}`,
      searchableText: [deal.title, deal.category, deal.badge]
        .join(" ")
        .toLowerCase()
    }))
    .filter((item) => {
      const categoryOk =
        selectedCategory === "All Categories" || item.category === selectedCategory;
      const queryOk =
        !normalizedQuery || item.searchableText.includes(normalizedQuery);

      return categoryOk && queryOk;
    });

  return cardMatches.concat(dealMatches);
}

function renderSuggestions(matches) {
  searchSuggestions.innerHTML = "";

  if (matches.length === 0) {
    searchSuggestions.hidden = true;
    return;
  }

  matches.slice(0, 6).forEach((match) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.targetId = match.targetId;
    button.innerHTML = `
      <span>${match.label}</span>
      <small>${match.type}</small>
    `;
    searchSuggestions.appendChild(button);
  });

  searchSuggestions.hidden = false;
}

function clearHighlights() {
  document.querySelectorAll(".search-highlight").forEach((element) => {
    element.classList.remove("search-highlight");
  });
}

function focusSearchResult(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  clearHighlights();
  target.classList.add("search-highlight");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function runSearch() {
  const query = searchInput.value.trim();
  const matches = getSearchMatches(query);

  if (matches.length === 0) {
    clearHighlights();
    searchHint.textContent =
      "No exact matches found. Try Electronics, Home & Kitchen, or Automotive.";
    return;
  }

  const categoryText =
    searchCategory.value === "All Categories"
      ? "all categories"
      : searchCategory.value;
  searchHint.textContent = `Showing ${matches.length} match${
    matches.length === 1 ? "" : "es"
  } in ${categoryText}.`;
  focusSearchResult(matches[0].targetId);
}

function addToCart(dealId) {
  const deal = pageData.deals.find((item) => item.id === dealId);

  if (!deal) {
    return;
  }

  cart.push(deal);
  saveCart();
  updateCart();
  openCart();
}

function removeFromCart(indexToRemove) {
  cart = cart.filter((item, index) => index !== indexToRemove);
  saveCart();
  updateCart();
}

function updateCart() {
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-drawer__empty">
        Your cart is empty. Add a few homepage deals and they will stay saved after refresh.
      </div>
    `;
  } else {
    cart.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img src="${item.image}" alt="${item.title}">
        <div>
          <strong>${item.title}</strong>
          <span>${item.badge}</span>
          <span>${formatRupees(item.price)}</span>
        </div>
        <button type="button" data-remove-index="${index}">Remove</button>
      `;
      cartItems.appendChild(row);
    });
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = formatRupees(total);
  cartCount.textContent = cart.length;
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  document.body.classList.remove("cart-open");
}

document.getElementById("heroPrev").addEventListener("click", () => {
  goToPreviousSlide();
  restartHeroTimer();
});

document.getElementById("heroNext").addEventListener("click", () => {
  goToNextSlide();
  restartHeroTimer();
});

searchInput.addEventListener("input", () => {
  const matches = getSearchMatches(searchInput.value);
  renderSuggestions(matches);
});

searchCategory.addEventListener("change", () => {
  const matches = getSearchMatches(searchInput.value);
  renderSuggestions(matches);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderSuggestions([]);
  runSearch();
});

searchSuggestions.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest("button");

  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  focusSearchResult(button.dataset.targetId);
  searchSuggestions.hidden = true;
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Node)) {
    return;
  }

  if (!searchForm.contains(target)) {
    searchSuggestions.hidden = true;
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const placeholderLink = target.closest('a[href="#"]');

  if (placeholderLink instanceof HTMLAnchorElement) {
    event.preventDefault();
  }
});

dealTrack.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const dealId = target.dataset.dealId;

  if (dealId) {
    addToCart(dealId);
  }
});

cartItems.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const removeIndex = Number(target.dataset.removeIndex);

  if (!Number.isNaN(removeIndex)) {
    removeFromCart(removeIndex);
  }
});

document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
document.getElementById("clearCart").addEventListener("click", () => {
  cart = [];
  saveCart();
  updateCart();
});
document.getElementById("backdrop").addEventListener("click", closeCart);

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("is-open");
});

document.getElementById("dealPrev").addEventListener("click", () => {
  dealTrack.scrollBy({ left: -472, behavior: "smooth" });
});

document.getElementById("dealNext").addEventListener("click", () => {
  dealTrack.scrollBy({ left: 472, behavior: "smooth" });
});

document.getElementById("backToTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    searchSuggestions.hidden = true;
  }
});

renderNavLinks();
renderHero();
renderCards();
renderDeals();
updateCart();
startHeroTimer();
