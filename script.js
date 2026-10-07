/* =====================================================================
   script.js - logic for the Online Bookstore
   1) Book data 2) Cart storage 3) Top-frame badge 4) Catalogue 5) Cart
   6) Validation rules 7) Registration 8) Login 9) Payment
   ===================================================================== */
"use strict";

/* 1) BOOK DATA (first four are the books named in the lab sheet) ------- */
const BOOKS = [
  { id: 1,  title: "XML Bible",          author: "Winston",   publisher: "Wiley",            price: 40.5, branch: "CSE",   color: "#0f766e" },
  { id: 2,  title: "AI",                 author: "S. Russel", publisher: "Princeton Hall",   price: 63,   branch: "CSE",   color: "#7c3aed" },
  { id: 3,  title: "Java 2",             author: "Watson",    publisher: "BPB Publications", price: 35.5, branch: "CSE",   color: "#c2410c" },
  { id: 4,  title: "HTML in 24 Hours",   author: "Sam Peter", publisher: "Sam Publication",  price: 50,   branch: "CSE",   color: "#0369a1" },
  { id: 5,  title: "Digital Signal Processing", author: "J. G. Proakis", publisher: "Pearson",     price: 59,   branch: "ECE",   color: "#be123c" },
  { id: 6,  title: "Electronic Circuits", author: "Millman",  publisher: "McGraw-Hill",      price: 47.5, branch: "ECE",   color: "#047857" },
  { id: 7,  title: "Electrical Machines", author: "P. S. Bimbhra", publisher: "Khanna",      price: 43,   branch: "EEE",   color: "#b45309" },
  { id: 8,  title: "Power Systems",      author: "C. L. Wadhwa", publisher: "New Age",       price: 41,   branch: "EEE",   color: "#1d4ed8" },
  { id: 9,  title: "Structural Analysis", author: "R. C. Hibbeler", publisher: "Pearson",   price: 62,   branch: "CIVIL", color: "#4d7c0f" },
  { id: 10, title: "Surveying Vol. 1",   author: "B. C. Punmia", publisher: "Laxmi",         price: 38,   branch: "CIVIL", color: "#9d174d" }
];
const $ = id => document.getElementById(id);
const money = n => "$" + n.toFixed(2);

/* Book cover drawn as an SVG data-URI, so no image files are needed */
function coverSrc(book) {
  const t = book.title.length > 22 ? book.title.slice(0, 20) + "…" : book.title;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='210'>` +
    `<rect width='160' height='210' rx='6' fill='${book.color}'/>` +
    `<rect x='10' y='10' width='140' height='190' rx='3' fill='none' stroke='white' stroke-opacity='.6'/>` +
    `<text x='80' y='100' font-family='Georgia,serif' font-size='16' font-weight='bold' fill='white' text-anchor='middle'>${t}</text>` +
    `<text x='80' y='182' font-family='Arial' font-size='11' fill='white' text-anchor='middle'>${book.branch}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/* 2) CART STORAGE - localStorage, shape { bookId: quantity }.
   localStorage is shared by every frame of the site, so the cart added in
   the right frame is visible to the top frame (badge) as well. */
function getCart() { try { return JSON.parse(localStorage.getItem("bs_cart")) || {}; } catch (e) { return {}; } }
function saveCart(cart) { try { localStorage.setItem("bs_cart", JSON.stringify(cart)); } catch (e) {} }
function addToCart(id) { const c = getCart(); c[id] = (c[id] || 0) + 1; saveCart(c); }
function cartLines() {
  const cart = getCart();
  return Object.keys(cart).filter(id => cart[id] > 0).map(id => {
    const book = BOOKS.find(b => b.id === Number(id));
    return { book, qty: cart[id], amount: book.price * cart[id] };
  });
}
const cartTotal = () => cartLines().reduce((s, l) => s + l.amount, 0);

/* 3) TOP FRAME: cart badge (refreshes when another frame changes the cart) */
function initBadge() {
  const badge = $("cart-count");
  if (!badge) return;
  const update = () => (badge.textContent = Object.values(getCart()).reduce((a, b) => a + b, 0));
  update();
  window.addEventListener("storage", update);
  setInterval(update, 1000);                      /* fallback for browsers without storage events across frames */
}

/* 4) CATALOGUE PAGE ---------------------------------------------------- */
function initCatalogue() {
  const body = $("catalogue-body");
  if (!body) return;
  const branch = new URLSearchParams(location.search).get("branch");
  const list = branch ? BOOKS.filter(b => b.branch === branch) : BOOKS;
  $("catalogue-title").textContent = branch ? `Catalogue - ${branch} books` : "Catalogue - all books";
  body.innerHTML = list.map(b => `
    <tr>
      <td><img class="book-cover" src="${coverSrc(b)}" alt="Cover of ${b.title}"></td>
      <td><div>Book: <strong>${b.title}</strong></div><div>Author: ${b.author}</div><div>Publication: ${b.publisher}</div></td>
      <td class="price">${money(b.price)}</td>
      <td><button class="btn btn-warning btn-sm add-btn" data-id="${b.id}" type="button">Add to cart</button></td>
    </tr>`).join("") || `<tr><td colspan="4" class="text-center text-muted">No books found.</td></tr>`;
  body.addEventListener("click", e => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;
    addToCart(Number(btn.dataset.id));
    btn.textContent = "Added ✓";
    setTimeout(() => (btn.textContent = "Add to cart"), 900);
  });
}

/* 5) CART PAGE --------------------------------------------------------- */
function renderCart() {
  const lines = cartLines();
  $("cart-body").innerHTML = lines.length ? lines.map(({ book, qty, amount }) => `
    <tr>
      <td>${book.title}</td>
      <td>${money(book.price)}</td>
      <td><input type="number" min="1" max="20" value="${qty}" class="form-control qty-input" data-id="${book.id}" aria-label="Quantity for ${book.title}"></td>
      <td class="price">${money(amount)}</td>
      <td><button class="btn btn-sm btn-outline-danger remove-btn" data-id="${book.id}" type="button">Remove</button></td>
    </tr>`).join("")
    : `<tr><td colspan="5" class="text-center text-muted py-4">Your cart is empty. <a href="catalogue.html">Go to the catalogue</a>.</td></tr>`;
  $("cart-total").textContent = money(cartTotal());
  $("pay-btn").classList.toggle("disabled", !lines.length);
}
function initCart() {
  if (!$("cart-body")) return;
  renderCart();
  $("cart-body").addEventListener("change", e => {
    if (!e.target.classList.contains("qty-input")) return;
    const c = getCart();
    c[e.target.dataset.id] = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1));
    saveCart(c); renderCart();
  });
  $("cart-body").addEventListener("click", e => {
    const btn = e.target.closest(".remove-btn");
    if (!btn) return;
    const c = getCart(); delete c[btn.dataset.id]; saveCart(c); renderCart();
  });
  $("clear-cart").addEventListener("click", () => { saveCart({}); renderCart(); });
}

/* 6) VALIDATION RULES --------------------------------------------------
   REGEX CHEAT-SHEET:  ^ start   $ end   [A-Za-z] a letter   \d a digit
   {6,} six or more   {10} exactly ten   [^\s@]+ one or more chars that are not space or @ */
const RULES = {
  name:  { re: /^[A-Za-z]{6,}$/,                   msg: "Name must be alphabets only, at least 6 letters (no spaces or digits)." },
  email: { re: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,  msg: "Enter a valid email like name@domain.com." },
  phone: { re: /^\d{10}$/,                         msg: "Phone number must be exactly 10 digits." }
};
function setError(id, message) {
  const field = $(id), err = $(id + "-error");
  if (err) err.textContent = message;
  if (field) {
    field.classList.toggle("is-invalid", !!message);
    field.classList.toggle("is-valid", !message && field.value !== "");
  }
  return !message;
}

/* 7) REGISTRATION ------------------------------------------------------ */
function initRegister() {
  const form = $("register-form");
  if (!form) return;
  const day = $("dob-day"), month = $("dob-month"), year = $("dob-year");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  day.innerHTML   = `<option value="">Day</option>`   + Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join("");
  month.innerHTML = `<option value="">Month</option>` + months.map((m, i) => `<option value="${i + 1}">${m}</option>`).join("");
  const y0 = new Date().getFullYear();
  year.innerHTML  = `<option value="">Year</option>`  + Array.from({ length: 70 }, (_, i) => `<option>${y0 - 10 - i}</option>`).join("");

  const checks = {
    name:     () => setError("name", RULES.name.re.test($("name").value.trim()) ? "" : RULES.name.msg),
    password: () => setError("password", $("password").value.length >= 6 ? "" : "Password must be at least 6 characters."),
    email:    () => setError("email", RULES.email.re.test($("email").value.trim()) ? "" : RULES.email.msg),
    phone:    () => setError("phone", RULES.phone.re.test($("phone").value.trim()) ? "" : RULES.phone.msg),
    address:  () => setError("address", $("address").value.trim().length >= 5 ? "" : "Please enter your address."),
    sex: () => {
      const ok = !!form.querySelector("input[name='sex']:checked");
      $("sex-error").textContent = ok ? "" : "Please select one option.";
      return ok;
    },
    dob: () => {
      const d = +day.value, m = +month.value, y = +year.value;
      let msg = "";
      if (!d || !m || !y) msg = "Select day, month and year.";
      else if (new Date(y, m - 1, d).getMonth() !== m - 1) msg = "This date does not exist.";   /* 31 Feb rolls into March */
      $("dob-error").textContent = msg;
      return !msg;
    },
    languages: () => {
      const ok = form.querySelectorAll("input[name='lang']:checked").length > 0;
      $("lang-error").textContent = ok ? "" : "Select at least one language.";
      return ok;
    }
  };
  ["name", "password", "email", "phone", "address"].forEach(k => $(k).addEventListener("input", checks[k]));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const results = Object.values(checks).map(fn => fn());      /* run all checks so every error shows */
    if (results.every(Boolean)) { $("success-box").classList.remove("d-none"); form.classList.add("d-none"); }
  });
  form.addEventListener("reset", () => {
    form.querySelectorAll(".is-valid,.is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
    form.querySelectorAll(".form-error").forEach(el => (el.textContent = ""));
  });
}

/* 8) LOGIN ------------------------------------------------------------- */
function initLogin() {
  const form = $("login-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const okU = setError("login-user", $("login-user").value.trim().length >= 3 ? "" : "Enter your user name (min 3 characters).");
    const okP = setError("login-password", $("login-password").value.length >= 6 ? "" : "Password must be at least 6 characters.");
    $("login-ok").classList.toggle("d-none", !(okU && okP));
  });
  form.addEventListener("reset", () => {
    form.querySelectorAll(".is-valid,.is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
    form.querySelectorAll(".form-error").forEach(el => (el.textContent = ""));
    $("login-ok").classList.add("d-none");
  });
}

/* 9) PAYMENT ------------------------------------------------------------
   Four options: card, UPI, net banking, cash on delivery. Only the panel
   of the chosen method is shown and validated. DEMO ONLY: nothing is sent
   anywhere and no card data is stored.                                   */
function initPayment() {
  const form = $("pay-form");
  if (!form) return;
  const lines = cartLines();
  if (!lines.length) { $("empty-box").classList.remove("d-none"); form.classList.add("d-none"); return; }
  $("summary-body").innerHTML = lines.map(l =>
    `<tr><td>${l.book.title}</td><td class="text-end">${l.qty} × ${money(l.book.price)}</td><td class="text-end">${money(l.amount)}</td></tr>`).join("");
  const total = cartTotal();
  $("pay-total").textContent = money(total);

  const methodOf = () => form.querySelector("input[name='method']:checked").value;
  const showPanel = () => document.querySelectorAll(".pay-panel").forEach(p => p.classList.toggle("d-none", p.dataset.method !== methodOf()));
  form.querySelectorAll("input[name='method']").forEach(r => r.addEventListener("change", showPanel));
  showPanel();

  /* group card number as 1234 5678 9012 3456 while typing */
  $("card-number").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  });

  const validators = {
    card: () => {
      const okN = setError("card-number", /^\d{16}$/.test($("card-number").value.replace(/\s/g, "")) ? "" : "Card number must be 16 digits.");
      const okH = setError("card-name", /^[A-Za-z ]{3,}$/.test($("card-name").value.trim()) ? "" : "Enter the name printed on the card.");
      const exp = $("card-expiry").value.trim();
      let msg = /^(0[1-9]|1[0-2])\/\d{2}$/.test(exp) ? "" : "Use MM/YY format.";
      if (!msg) {                                              /* card is valid until the END of the expiry month */
        const [mm, yy] = exp.split("/").map(Number);
        if (new Date(2000 + yy, mm, 1) <= new Date()) msg = "This card has expired.";
      }
      const okE = setError("card-expiry", msg);
      const okC = setError("card-cvv", /^\d{3}$/.test($("card-cvv").value) ? "" : "CVV must be 3 digits.");
      return okN && okH && okE && okC;
    },
    upi:        () => setError("upi-id", /^[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}$/.test($("upi-id").value.trim()) ? "" : "Enter a valid UPI ID like name@bank."),
    netbanking: () => setError("bank", $("bank").value ? "" : "Please choose your bank."),
    cod:        () => true
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    const okA = setError("pay-address", $("pay-address").value.trim().length >= 5 ? "" : "Enter your delivery address.");
    const okM = validators[methodOf()]();
    if (!(okA && okM)) return;
    const labels = { card: "Credit / Debit card", upi: "UPI", netbanking: "Net banking", cod: "Cash on delivery" };
    $("order-id").textContent = "BS" + Date.now().toString().slice(-8);
    $("order-method").textContent = labels[methodOf()];
    $("order-total").textContent = money(total);
    $("order-box").classList.remove("d-none");
    form.classList.add("d-none");
    saveCart({});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initBadge(); initCatalogue(); initCart(); initRegister(); initLogin(); initPayment();
});
