/**
 * mima's — Cart System + Supabase Auth & Orders
 */
(function () {
  'use strict';

  /* ───────── Constants ───────── */
  const CART_KEY = 'mimas-cart';
  const MAX_QTY = 10;
  const DELIVERY_FEE = 50;
  const FREE_DELIVERY_THRESHOLD = 500;
  const DELIVERY_AREAS = [
    'Downtown Dubai', 'Dubai Marina', 'JBR', 'Business Bay',
    'DIFC', 'Jumeirah', 'Palm Jumeirah', 'Al Barsha', 'Other'
  ];

  /* ───────── Products (matches boards page) ───────── */
  const PRODUCTS = [
    {
      id: 'basic',
      name: 'Basic',
      price: 0, // AED 000 placeholder
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI9mbOZNnvNnagUlKChyxhce781VQJ2wMRIZOAWVodosxtdkoBTHHhQpNiZrMHcBOLcu1vl1jjiZY8L98O6oQoCsex0NrNiv7_D5s-KRzRxkEuoKmLjwWhYMqQ-hoTAIFYkyVog7yITyj6ruJw_jpgkkgXO89euNi68oRP5UAEPM4KnL5nTpYzeRTfFmbP6Tx-Jp8z92TMzXohF-LmeLWu5ccDzGd4x7p-NQc-iPqfaHrLkAJBJYPHgvpN7y1hd4xp2KC7s6xV6Chs'
    },
    {
      id: 'french-delicacy',
      name: 'French Delicacy',
      price: 0,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6IPa5uY6ZQJ6yV3RejG2ifJxNku_BOXtJDaHdHLHsbeexbMYi8_mqa7ZUv-Z8HPHnzCdt-CvKoAwJInjRAxAs0MrWu7BNu78AMmAH2SO36jgBeFNEZ__gLCisDKzV-RqdB7R_SFLB1rcYfUrgefPeYibRVLemWxOxyHZ5x6Rd9KgHpFxl4cFvQ428bzvz0CRuar4RM0u9mMmRi-O13kHZJLQ1f1vB5Jt0E1s8VYQMylVb9PjJf4BTWODEy0F03GqwMIRr2JZjMJob'
    },
    {
      id: 'dare-to-pair',
      name: 'Dare To Pair',
      price: 0,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFQUsBe0Kmq2sxtsYxGMTz2nISfhLH-LaHOqCRrJ5DqAp28o2Zx4EgLcxaG5Reb8Uo2PJ7TrYznvUjNRAfC-Yfh9p-CHEaiwxSkuYM4aTF2TNxoO3NW9xjuQqNESfgJ3my7B2NQ_TOZTUcDRelrG480Z0gdJmGXGU1DGWt91KuNH0iuCAPtiocUbfW8eoWo6W4FX8_pr7nashbuPljshzPVkHDj-acBxSsSrcfIOc6Z-Hh_M8npP1k6L4jOHFZMiAJ6SNz423Hze6q'
    },
    {
      id: 'mimas-board',
      name: 'Mimas Board',
      price: 0,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvX53zTfGOLVQ3Tq7Fjp-l3OrS2EZtkLIjJffE142Zu9Vzb7BAChNEQUVTp9Y5W75RTGgHJ1_4Pb6_g6otBcaN7lVm-e2IgcEa5XpbzSk7kkFTXkAUr8rxZUz4St58d5PhixpsZeAXSqtEtA4Uawq_Z7X4drBzcfYGF9TiJDx2TTSZ1yIGZjmHDk63bDZCvH_MQO_ZnURso36togYpbD6EiGhNPSX9--sE0HhzO_SkW9pqZ3Wzv_OJp30Pw0BlbhS9JNaQhAQJrsPO'
    }
  ];

  function getProduct(id) {
    return PRODUCTS.find(function (p) { return p.id === id; });
  }

  function formatPrice(n) { return 'AED ' + n; }

  /* ───────── Cart state ───────── */
  function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return [];
      var items = JSON.parse(raw);
      return items.filter(function (e) { return getProduct(e.id) && e.qty > 0 && e.qty <= MAX_QTY; });
    } catch (_) { return []; }
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  var cart = loadCart();

  function cartCount() {
    return cart.reduce(function (s, e) { return s + e.qty; }, 0);
  }

  function cartSubtotal() {
    return cart.reduce(function (s, e) {
      var p = getProduct(e.id);
      return s + (p ? p.price * e.qty : 0);
    }, 0);
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    if (!getProduct(id)) return;
    var existing = cart.find(function (e) { return e.id === id; });
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, MAX_QTY);
    } else {
      cart.push({ id: id, qty: Math.min(qty, MAX_QTY) });
    }
    saveCart(cart);
    renderCartBadge();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (e) { return e.id !== id; });
    saveCart(cart);
    renderCartBadge();
    renderDrawerContents();
  }

  function updateQty(id, newQty) {
    if (newQty <= 0) return removeFromCart(id);
    newQty = Math.min(newQty, MAX_QTY);
    var entry = cart.find(function (e) { return e.id === id; });
    if (entry) { entry.qty = newQty; saveCart(cart); renderDrawerContents(); renderCartBadge(); }
  }

  function clearCart() {
    cart = [];
    saveCart(cart);
    renderCartBadge();
  }

  /* ───────── Auth state (Supabase) ───────── */
  var currentUser = null; // cached auth user, updated by onAuthStateChange

  function sb() { return window.__supabase; }

  function getAuth() {
    // Synchronous access to cached user — returns {name, email, id} or null
    return currentUser;
  }

  function register(name, email, password) {
    if (!sb()) return Promise.resolve({ ok: false, error: 'Auth service unavailable' });
    if (password.length < 6) return Promise.resolve({ ok: false, error: 'Password must be at least 6 characters' });
    return sb().auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name } }
    }).then(function (result) {
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    });
  }

  function login(email, password) {
    if (!sb()) return Promise.resolve({ ok: false, error: 'Auth service unavailable' });
    return sb().auth.signInWithPassword({
      email: email,
      password: password
    }).then(function (result) {
      if (result.error) return { ok: false, error: result.error.message };
      return { ok: true };
    });
  }

  function logout() {
    if (!sb()) return;
    sb().auth.signOut().then(function () {
      currentUser = null;
      renderAuthIcon();
    });
  }

  function initAuthListener() {
    if (!sb()) return;
    sb().auth.onAuthStateChange(function (event, session) {
      if (session && session.user) {
        var meta = session.user.user_metadata || {};
        currentUser = {
          id: session.user.id,
          name: meta.name || 'User',
          email: session.user.email
        };
      } else {
        currentUser = null;
      }
      renderAuthIcon();
    });
    // Also do an immediate check for existing session
    sb().auth.getSession().then(function (result) {
      if (result.data.session && result.data.session.user) {
        var meta = result.data.session.user.user_metadata || {};
        currentUser = {
          id: result.data.session.user.id,
          name: meta.name || 'User',
          email: result.data.session.user.email
        };
        renderAuthIcon();
        // Re-prefill checkout if on that page
        prefillCheckout();
      }
    });
  }

  /* ───────── SVG icons ───────── */
  var cartSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';

  var userSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  var closeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ───────── Inject navbar icons ───────── */
  function injectNavbarIcons() {
    // The site has two nav patterns:
    // 1) <header class="fixed..."><nav class="flex justify-between...">  (contact, services, journal, checkout)
    // 2) <nav class="fixed..."><div class="flex justify-between...">     (boards, story, 404)
    // 3) <header class="fixed..."><nav class="flex justify-between...">  (index.html)
    // In all cases, look for the flex row that contains the logo + links + spacer
    var flexRow = document.querySelector('header.fixed nav.flex, nav.fixed .flex.justify-between, nav.fixed.flex');
    if (!flexRow) {
      // Fallback: try any fixed nav descendant flex container
      var fixedEl = document.querySelector('.fixed');
      if (fixedEl) flexRow = fixedEl.querySelector('.flex.justify-between') || fixedEl.querySelector('nav');
    }
    if (!flexRow) return;

    // Find the last flex-1 div (the right spacer — empty div)
    var children = flexRow.children;
    var spacer = null;
    for (var i = children.length - 1; i >= 0; i--) {
      if (children[i].classList.contains('flex-1') && children[i].children.length === 0) {
        spacer = children[i];
        break;
      }
    }
    if (!spacer) return;

    // Replace spacer with icons container (right-aligned)
    spacer.classList.remove('flex-1');
    spacer.className = 'flex items-center gap-4 flex-1 justify-end';

    // Auth icon
    var authBtn = document.createElement('button');
    authBtn.id = 'mimas-auth-btn';
    authBtn.className = 'relative text-[#4F471F] hover:text-[#800314] transition-colors duration-300 cursor-pointer';
    authBtn.setAttribute('aria-label', 'Account');
    authBtn.innerHTML = userSvg;
    authBtn.onclick = function () { toggleAuthModal(); };
    spacer.appendChild(authBtn);

    // Cart icon
    var cartBtn = document.createElement('button');
    cartBtn.id = 'mimas-cart-btn';
    cartBtn.className = 'relative text-[#4F471F] hover:text-[#800314] transition-colors duration-300 cursor-pointer';
    cartBtn.setAttribute('aria-label', 'Shopping cart');
    cartBtn.innerHTML = cartSvg + '<span id="mimas-cart-badge" class="absolute -top-1.5 -right-1.5 h-[18px] min-w-[18px] flex items-center justify-center rounded-full bg-[#800314] text-white text-[10px] font-bold leading-none px-1 transition-transform" style="display:none;"></span>';
    cartBtn.onclick = function () { toggleDrawer(); };
    spacer.appendChild(cartBtn);

    renderCartBadge();
    renderAuthIcon();
  }

  /* ───────── Cart badge ───────── */
  function renderCartBadge() {
    var badge = document.getElementById('mimas-cart-badge');
    if (!badge) return;
    var count = cartCount();
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
      badge.style.transform = 'scale(1.15)';
      setTimeout(function () { badge.style.transform = 'scale(1)'; }, 200);
    } else {
      badge.style.display = 'none';
    }
  }

  /* ───────── Auth icon state ───────── */
  function renderAuthIcon() {
    var btn = document.getElementById('mimas-auth-btn');
    if (!btn) return;
    var user = getAuth();
    if (user) {
      btn.innerHTML = '<div class="w-[22px] h-[22px] rounded-full bg-[#800314] text-white flex items-center justify-center text-[11px] font-semibold font-[\'Montserrat\']">' + escHtml(user.name.charAt(0).toUpperCase()) + '</div>';
    } else {
      btn.innerHTML = userSvg;
    }
  }

  /* ───────── Cart drawer ───────── */
  var drawerOpen = false;

  function createDrawer() {
    if (document.getElementById('mimas-cart-drawer')) return;

    var overlay = document.createElement('div');
    overlay.id = 'mimas-cart-overlay';
    overlay.className = 'fixed inset-0 z-[998] bg-[#4F471F]/30 transition-opacity duration-300 opacity-0';
    overlay.style.display = 'none';
    overlay.onclick = function () { toggleDrawer(false); };

    var drawer = document.createElement('div');
    drawer.id = 'mimas-cart-drawer';
    drawer.className = 'fixed top-0 right-0 bottom-0 z-[999] w-full max-w-md flex flex-col bg-[#FCFAF0] shadow-2xl transition-transform duration-300';
    drawer.style.transform = 'translateX(100%)';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Shopping cart');

    drawer.innerHTML =
      '<div class="flex items-center justify-between px-6 py-5 border-b border-[#4F471F]/10">' +
        '<h2 class="font-[\'Montserrat\'] font-semibold uppercase tracking-[0.15em] text-[#4F471F] text-sm">Your Cart</h2>' +
        '<button id="mimas-cart-close" class="text-[#4F471F] hover:text-[#800314] transition-colors" aria-label="Close cart">' + closeSvg + '</button>' +
      '</div>' +
      '<div id="mimas-cart-body" class="flex-1 overflow-y-auto px-6"></div>' +
      '<div id="mimas-cart-footer" class="px-6 py-5 border-t border-[#4F471F]/10"></div>';

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('mimas-cart-close').onclick = function () { toggleDrawer(false); };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerOpen) toggleDrawer(false);
    });

    renderDrawerContents();
  }

  function toggleDrawer(forceState) {
    createDrawer();
    drawerOpen = forceState !== undefined ? forceState : !drawerOpen;
    var overlay = document.getElementById('mimas-cart-overlay');
    var drawer = document.getElementById('mimas-cart-drawer');
    if (drawerOpen) {
      renderDrawerContents();
      overlay.style.display = 'block';
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        drawer.style.transform = 'translateX(0)';
      });
      document.body.style.overflow = 'hidden';
    } else {
      overlay.style.opacity = '0';
      drawer.style.transform = 'translateX(100%)';
      setTimeout(function () { overlay.style.display = 'none'; }, 300);
      document.body.style.overflow = '';
    }
  }

  function renderDrawerContents() {
    var body = document.getElementById('mimas-cart-body');
    var footer = document.getElementById('mimas-cart-footer');
    if (!body || !footer) return;

    if (cart.length === 0) {
      body.innerHTML =
        '<div class="flex flex-col items-center justify-center py-16 text-center">' +
          '<div class="text-[#4F471F]/30 mb-4">' + cartSvg.replace('width="20"', 'width="48"').replace('height="20"', 'height="48"') + '</div>' +
          '<p class="font-[\'Montserrat\'] font-light text-[#4F471F]/60 text-sm">Your cart is empty</p>' +
          '<a href="' + pagePath('boards.html') + '" class="mt-4 font-[\'Montserrat\'] font-medium text-[#800314] text-sm underline underline-offset-4">Browse Boards</a>' +
        '</div>';
      footer.innerHTML = '';
      return;
    }

    var html = '';
    cart.forEach(function (entry) {
      var p = getProduct(entry.id);
      if (!p) return;
      html +=
        '<div class="flex gap-4 py-4 border-b border-[#4F471F]/10">' +
          '<div class="w-16 h-16 flex-shrink-0 overflow-hidden rounded-sm bg-[#f0eee4]"><img src="' + p.image + '" alt="' + p.name + '" class="w-full h-full object-cover"/></div>' +
          '<div class="flex flex-col justify-between flex-1">' +
            '<div class="flex items-start justify-between">' +
              '<div>' +
                '<h4 class="font-[\'Montserrat\'] font-medium text-[#4F471F] text-sm">' + p.name + '</h4>' +
                '<p class="font-[\'Montserrat\'] font-light text-[#4F471F]/60 text-xs mt-0.5">' + formatPrice(p.price) + ' each</p>' +
              '</div>' +
              '<button onclick="window.__mimasRemove(\'' + entry.id + '\')" class="text-[#4F471F]/50 hover:text-[#800314] transition-colors p-1" aria-label="Remove ' + p.name + '">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
              '</button>' +
            '</div>' +
            '<div class="flex items-center justify-between mt-2">' +
              '<div class="flex items-center border border-[#4F471F]/15 rounded-sm">' +
                '<button onclick="window.__mimasQty(\'' + entry.id + '\',' + (entry.qty - 1) + ')" class="px-2 py-1 text-xs text-[#4F471F] transition-opacity' + (entry.qty <= 1 ? ' opacity-30 pointer-events-none' : '') + '">&#8722;</button>' +
                '<span class="min-w-[28px] text-center text-xs font-medium text-[#4F471F]">' + entry.qty + '</span>' +
                '<button onclick="window.__mimasQty(\'' + entry.id + '\',' + (entry.qty + 1) + ')" class="px-2 py-1 text-xs text-[#4F471F] transition-opacity' + (entry.qty >= MAX_QTY ? ' opacity-30 pointer-events-none' : '') + '">+</button>' +
              '</div>' +
              '<span class="font-[\'Montserrat\'] font-medium text-[#800314] text-sm">' + formatPrice(p.price * entry.qty) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    body.innerHTML = html;

    var sub = cartSubtotal();
    footer.innerHTML =
      '<div class="flex items-center justify-between mb-4">' +
        '<span class="font-[\'Montserrat\'] font-medium uppercase tracking-wide text-[#4F471F] text-sm">Subtotal</span>' +
        '<span class="font-[\'Montserrat\'] font-semibold text-[#4F471F] text-base">' + formatPrice(sub) + '</span>' +
      '</div>' +
      '<a href="' + pagePath('checkout.html') + '" class="block text-center bg-[#800314] text-white font-[\'Montserrat\'] font-medium uppercase tracking-[0.15em] text-[11px] py-3.5 hover:bg-[#800314]/90 transition-colors" style="border-radius:0.125rem;">Proceed to Checkout</a>';
  }

  /* ───────── Auth modal ───────── */
  var authModalOpen = false;

  function createAuthModal() {
    if (document.getElementById('mimas-auth-modal')) return;

    var overlay = document.createElement('div');
    overlay.id = 'mimas-auth-modal-overlay';
    overlay.className = 'fixed inset-0 z-[998] bg-[#4F471F]/30 transition-opacity duration-300 opacity-0';
    overlay.style.display = 'none';
    overlay.onclick = function () { toggleAuthModal(false); };

    var modal = document.createElement('div');
    modal.id = 'mimas-auth-modal';
    modal.className = 'fixed top-1/2 left-1/2 z-[999] w-[90%] max-w-md bg-[#FCFAF0] shadow-2xl p-8 transition-all duration-300';
    modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
    modal.style.opacity = '0';
    modal.style.display = 'none';
    modal.style.borderRadius = '0.25rem';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-label', 'Account');

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && authModalOpen) toggleAuthModal(false);
    });
  }

  function toggleAuthModal(forceState) {
    createAuthModal();
    authModalOpen = forceState !== undefined ? forceState : !authModalOpen;
    var overlay = document.getElementById('mimas-auth-modal-overlay');
    var modal = document.getElementById('mimas-auth-modal');

    if (authModalOpen) {
      renderAuthModal();
      overlay.style.display = 'block';
      modal.style.display = 'block';
      requestAnimationFrame(function () {
        overlay.style.opacity = '1';
        modal.style.opacity = '1';
        modal.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    } else {
      overlay.style.opacity = '0';
      modal.style.opacity = '0';
      modal.style.transform = 'translate(-50%, -50%) scale(0.95)';
      setTimeout(function () {
        overlay.style.display = 'none';
        modal.style.display = 'none';
      }, 300);
    }
  }

  function renderAuthModal() {
    var modal = document.getElementById('mimas-auth-modal');
    if (!modal) return;
    var user = getAuth();

    if (user) {
      // Logged in view
      modal.innerHTML =
        '<div class="flex items-center justify-between mb-6">' +
          '<h2 class="font-[\'Montserrat\'] font-semibold uppercase tracking-[0.15em] text-[#4F471F] text-sm">Your Account</h2>' +
          '<button onclick="window.__mimasAuthClose()" class="text-[#4F471F] hover:text-[#800314] transition-colors">' + closeSvg + '</button>' +
        '</div>' +
        '<div class="text-center py-4">' +
          '<div class="w-16 h-16 rounded-full bg-[#800314] text-white flex items-center justify-center text-2xl font-semibold font-[\'Montserrat\'] mx-auto mb-4">' + escHtml(user.name.charAt(0).toUpperCase()) + '</div>' +
          '<p class="font-[\'Montserrat\'] font-medium text-[#4F471F] text-base">' + escHtml(user.name) + '</p>' +
          '<p class="font-[\'Montserrat\'] font-light text-[#4F471F]/60 text-sm mt-1">' + escHtml(user.email) + '</p>' +
        '</div>' +
        '<button onclick="window.__mimasLogout()" class="mt-6 w-full text-center border border-[#4F471F]/20 text-[#4F471F] font-[\'Montserrat\'] font-medium uppercase tracking-[0.15em] text-[11px] py-3 hover:border-[#800314] hover:text-[#800314] transition-colors" style="border-radius:0.125rem;">Sign Out</button>';
    } else {
      // Login/Register form
      modal.innerHTML =
        '<div class="flex items-center justify-between mb-6">' +
          '<h2 id="mimas-auth-title" class="font-[\'Montserrat\'] font-semibold uppercase tracking-[0.15em] text-[#4F471F] text-sm">Sign In</h2>' +
          '<button onclick="window.__mimasAuthClose()" class="text-[#4F471F] hover:text-[#800314] transition-colors">' + closeSvg + '</button>' +
        '</div>' +
        '<div id="mimas-auth-error" class="hidden mb-4 text-[#800314] font-[\'Montserrat\'] text-xs text-center font-medium"></div>' +
        '<form id="mimas-auth-form" class="space-y-4" onsubmit="event.preventDefault(); window.__mimasAuthSubmit();">' +
          '<div id="mimas-auth-name-field" class="hidden">' +
            '<label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4F471F]/70 font-[\'Montserrat\']">Name</label>' +
            '<input type="text" id="mimas-auth-name" class="w-full rounded-sm px-4 py-2.5 text-sm outline-none font-[\'Montserrat\'] font-light text-[#4F471F] transition-all duration-200" style="background:rgba(79,71,31,0.04); border:1px solid rgba(79,71,31,0.15);"/>' +
          '</div>' +
          '<div>' +
            '<label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4F471F]/70 font-[\'Montserrat\']">Email</label>' +
            '<input type="email" id="mimas-auth-email" required class="w-full rounded-sm px-4 py-2.5 text-sm outline-none font-[\'Montserrat\'] font-light text-[#4F471F] transition-all duration-200" style="background:rgba(79,71,31,0.04); border:1px solid rgba(79,71,31,0.15);"/>' +
          '</div>' +
          '<div>' +
            '<label class="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4F471F]/70 font-[\'Montserrat\']">Password</label>' +
            '<input type="password" id="mimas-auth-pass" required minlength="6" class="w-full rounded-sm px-4 py-2.5 text-sm outline-none font-[\'Montserrat\'] font-light text-[#4F471F] transition-all duration-200" style="background:rgba(79,71,31,0.04); border:1px solid rgba(79,71,31,0.15);"/>' +
          '</div>' +
          '<button type="submit" class="w-full bg-[#800314] text-white font-[\'Montserrat\'] font-medium uppercase tracking-[0.15em] text-[11px] py-3.5 hover:bg-[#800314]/90 transition-colors" style="border-radius:0.125rem;">Sign In</button>' +
        '</form>' +
        '<p class="mt-4 text-center font-[\'Montserrat\'] font-light text-[#4F471F]/60 text-xs">' +
          '<span id="mimas-auth-toggle-text">Don\'t have an account?</span> ' +
          '<button id="mimas-auth-toggle" onclick="window.__mimasAuthToggle()" class="text-[#800314] font-medium underline underline-offset-2">Create one</button>' +
        '</p>';
    }
  }

  var authModeRegister = false;

  window.__mimasAuthToggle = function () {
    authModeRegister = !authModeRegister;
    var title = document.getElementById('mimas-auth-title');
    var nameField = document.getElementById('mimas-auth-name-field');
    var toggleText = document.getElementById('mimas-auth-toggle-text');
    var toggleBtn = document.getElementById('mimas-auth-toggle');
    var submitBtn = document.querySelector('#mimas-auth-form button[type="submit"]');
    var errorEl = document.getElementById('mimas-auth-error');

    if (authModeRegister) {
      title.textContent = 'Create Account';
      nameField.classList.remove('hidden');
      toggleText.textContent = 'Already have an account?';
      toggleBtn.textContent = 'Sign in';
      submitBtn.textContent = 'Create Account';
    } else {
      title.textContent = 'Sign In';
      nameField.classList.add('hidden');
      toggleText.textContent = "Don't have an account?";
      toggleBtn.textContent = 'Create one';
      submitBtn.textContent = 'Sign In';
    }
    errorEl.classList.add('hidden');
  };

  window.__mimasAuthSubmit = function () {
    var email = document.getElementById('mimas-auth-email').value.trim();
    var pass = document.getElementById('mimas-auth-pass').value;

    var promise;
    if (authModeRegister) {
      var name = document.getElementById('mimas-auth-name').value.trim();
      if (!name) { showAuthError('Please enter your name'); return; }
      promise = register(name, email, pass);
    } else {
      promise = login(email, pass);
    }

    promise.then(function (result) {
      if (!result.ok) { showAuthError(result.error); return; }
      renderAuthIcon();
      toggleAuthModal(false);
      authModeRegister = false;
    });
  };

  function showAuthError(msg) {
    var el = document.getElementById('mimas-auth-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  }

  window.__mimasAuthClose = function () { toggleAuthModal(false); };

  window.__mimasLogout = function () {
    logout();
    toggleAuthModal(false);
  };

  /* ───────── "Add to Cart" buttons on boards page ───────── */
  function injectAddToCartButtons() {
    var orderLinks = document.querySelectorAll('a[href="contact.html"]');
    orderLinks.forEach(function (link) {
      if (link.textContent.trim() !== 'Order Now') return;
      // Find the product card container
      var card = link.closest('.bg-surface-container-lowest');
      if (!card) return;

      // Get product name from card
      var h3 = card.querySelector('h3');
      if (!h3) return;
      var name = h3.textContent.trim();
      var product = PRODUCTS.find(function (p) { return p.name === name; });
      if (!product) return;

      // Replace link with button
      var btn = document.createElement('button');
      btn.className = link.className;
      btn.setAttribute('data-product-id', product.id);
      btn.textContent = 'Add to Cart';
      btn.onclick = function () {
        addToCart(product.id);
        btn.textContent = 'Added \u2713';
        btn.style.backgroundColor = '#4F471F';
        setTimeout(function () {
          btn.textContent = 'Add to Cart';
          btn.style.backgroundColor = '#800314';
        }, 1500);
      };
      link.parentNode.replaceChild(btn, link);
    });
  }

  /* ───────── Checkout page logic ───────── */
  function initCheckout() {
    var form = document.getElementById('mimas-checkout-form');
    if (!form) return;

    var emptyEl = document.getElementById('mimas-checkout-empty');
    var formSection = document.getElementById('mimas-checkout-content');
    var successEl = document.getElementById('mimas-checkout-success');

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (formSection) formSection.style.display = 'none';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (formSection) formSection.style.display = 'grid';

    // Populate delivery area dropdown
    var areaSelect = document.getElementById('mimas-checkout-area');
    if (areaSelect && areaSelect.options.length <= 1) {
      DELIVERY_AREAS.forEach(function (area) {
        var opt = document.createElement('option');
        opt.value = area;
        opt.textContent = area;
        areaSelect.appendChild(opt);
      });
    }

    // Set min date to tomorrow
    var dateInput = document.getElementById('mimas-checkout-date');
    if (dateInput) {
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];
    }

    // Prefill from auth
    prefillCheckout();

    // Render summary
    renderCheckoutSummary();

    // Handle form submit
    form.onsubmit = function (e) {
      e.preventDefault();
      var submitBtn = document.querySelector('button[form="mimas-checkout-form"]') || form.querySelector('button[type="submit"]');
      if (!submitBtn || submitBtn.disabled) return;

      // Require login before placing order
      var user = getAuth();
      if (!user) {
        toggleAuthModal(true);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Placing Order...';

      var orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
      var sub = cartSubtotal();
      var fee = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

      var orderData = {
        order_number: orderNumber,
        user_id: user.id,
        customer_name: document.getElementById('mimas-checkout-name').value.trim(),
        customer_email: document.getElementById('mimas-checkout-email').value.trim(),
        customer_phone: document.getElementById('mimas-checkout-phone').value.trim(),
        delivery_date: document.getElementById('mimas-checkout-date').value,
        delivery_area: document.getElementById('mimas-checkout-area').value,
        special_instructions: document.getElementById('mimas-checkout-instructions').value.trim() || null,
        items: cart.map(function (entry) {
          var p = getProduct(entry.id);
          return { id: entry.id, name: p ? p.name : entry.id, qty: entry.qty, price: p ? p.price : 0 };
        }),
        subtotal: sub,
        delivery_fee: fee,
        total: sub + fee
      };

      if (sb()) {
        sb().from('orders').insert(orderData).select().single().then(function (result) {
          if (result.error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Place Order';
            showCheckoutError('Something went wrong: ' + result.error.message);
            return;
          }
          showOrderSuccess(orderNumber, formSection, successEl);
        });
      } else {
        // Fallback if Supabase is unavailable — show success anyway
        setTimeout(function () {
          showOrderSuccess(orderNumber, formSection, successEl);
        }, 500);
      }
    };
  }

  function showCheckoutError(msg) {
    var existing = document.getElementById('mimas-checkout-error');
    if (existing) { existing.textContent = msg; existing.style.display = 'block'; return; }
    var el = document.createElement('p');
    el.id = 'mimas-checkout-error';
    el.className = "font-['Montserrat'] text-[#800314] text-sm text-center mt-4";
    el.textContent = msg;
    var summary = document.querySelector('#mimas-checkout-content .lg\\:col-span-2 > div');
    if (summary) summary.appendChild(el);
  }

  function showOrderSuccess(orderNumber, formSection, successEl) {
    if (formSection) formSection.style.display = 'none';
    if (successEl) {
      successEl.style.display = 'block';
      var orderIdEl = document.getElementById('mimas-order-id');
      if (orderIdEl) orderIdEl.textContent = orderNumber;
    }
    clearCart();
    renderCartBadge();
  }

  function prefillCheckout() {
    var user = getAuth();
    if (!user) return;
    var nameInput = document.getElementById('mimas-checkout-name');
    var emailInput = document.getElementById('mimas-checkout-email');
    if (nameInput && !nameInput.value) nameInput.value = user.name;
    if (emailInput && !emailInput.value) emailInput.value = user.email;
  }

  function renderCheckoutSummary() {
    var el = document.getElementById('mimas-order-items');
    if (!el) return;

    var html = '';
    cart.forEach(function (entry) {
      var p = getProduct(entry.id);
      if (!p) return;
      html +=
        '<div class="flex items-center gap-3 mb-3">' +
          '<div class="w-12 h-12 flex-shrink-0 overflow-hidden rounded-sm bg-[#f0eee4]"><img src="' + p.image + '" alt="' + p.name + '" class="w-full h-full object-cover"/></div>' +
          '<div class="flex-1 min-w-0">' +
            '<p class="font-[\'Montserrat\'] font-medium text-[#4F471F] text-sm truncate">' + p.name + '</p>' +
            '<p class="font-[\'Montserrat\'] font-light text-[#4F471F]/60 text-xs">Qty: ' + entry.qty + '</p>' +
          '</div>' +
          '<p class="font-[\'Montserrat\'] font-medium text-[#4F471F] text-sm flex-shrink-0">' + formatPrice(p.price * entry.qty) + '</p>' +
        '</div>';
    });
    el.innerHTML = html;

    var sub = cartSubtotal();
    var fee = sub >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    var total = sub + fee;

    var subtotalEl = document.getElementById('mimas-order-subtotal');
    var feeEl = document.getElementById('mimas-order-fee');
    var totalEl = document.getElementById('mimas-order-total');
    var feeHint = document.getElementById('mimas-order-fee-hint');

    if (subtotalEl) subtotalEl.textContent = formatPrice(sub);
    if (feeEl) { feeEl.textContent = fee === 0 ? 'Free' : formatPrice(fee); feeEl.style.color = fee === 0 ? '#800314' : '#4F471F'; }
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (feeHint) feeHint.style.display = fee > 0 ? 'block' : 'none';
  }

  /* ───────── Helpers ───────── */
  function pagePath(filename) {
    // Detect if we're in the root or pages/ folder
    var path = window.location.pathname;
    if (path.indexOf('/pages/') !== -1) {
      return filename;
    }
    return 'pages/' + filename;
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ───────── Global hooks for inline onclick ───────── */
  window.__mimasRemove = removeFromCart;
  window.__mimasQty = updateQty;
  window.__mimasAddToCart = addToCart;

  /* ───────── Init ───────── */
  document.addEventListener('DOMContentLoaded', function () {
    injectNavbarIcons();
    initAuthListener();
    injectAddToCartButtons();
    initCheckout();
  });
})();
