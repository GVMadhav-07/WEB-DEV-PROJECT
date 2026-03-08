document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let allProducts = [];
    let filteredProducts = [];
    let cart = [];

    // DOM Elements
    const productGrid = document.getElementById('productGrid');
    const productCount = document.getElementById('productCount');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');

    // Filter Elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const sortSelect = document.getElementById('sortSelect');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    const applyPriceBtn = document.getElementById('applyPriceFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // Cart Elements
    const cartOpenBtn = document.getElementById('cartOpenBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSubtotal = document.getElementById('cartSubtotal');
    const cartBadge = document.getElementById('cartBadge');

    // Pagination (Simple)
    let displayLimit = 20;

    // ----- Initialization -----

    // Fetch JSON data
    fetch('data/products.json')
        .then(response => {
            if (!response.ok) {
                // If fetching fails via HTTP, attempt to generate dummy if it fails
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            allProducts = data;
            filteredProducts = [...allProducts];
            initApp();
        })
        .catch(err => {
            console.error('Error fetching products, falling back to empty state or dummy.', err);
            // In a real environment, or if local file access fails in the browser, 
            // the user might see empty grid. We handle graceful degradation.
            productGrid.innerHTML = '<p style="text-align:center;width:100%;padding:20px;">Could not load products. Ensure you are running a server.</p>';
        });

    function initApp() {
        applyFilters(); // Renders initial products
        loadCartFromStorage();
        setupEventListeners();
    }

    // ----- Event Listeners -----

    function setupEventListeners() {
        // Search
        searchBtn.addEventListener('click', applyFilters);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') applyFilters();
        });

        // Category Radios
        categoryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Synchronize nav links
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.dataset.section === e.target.value ||
                        (e.target.value === 'All' && link.dataset.section === 'all')) {
                        link.classList.add('active');
                    }
                });
                applyFilters();
            });
        });

        // Nav Links Category
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');

                const cat = target.dataset.section;

                // Sync radio buttons
                categoryRadios.forEach(radio => {
                    if (radio.value === cat || (cat === 'all' && radio.value === 'All')) {
                        radio.checked = true;
                    }
                });

                applyFilters();

                // Scroll to products
                document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Sorting
        sortSelect.addEventListener('change', applyFilters);

        // Price Filter
        applyPriceBtn.addEventListener('click', applyFilters);

        // Load More
        loadMoreBtn.addEventListener('click', () => {
            displayLimit += 20;
            renderProducts();
        });

        // Cart Toggles
        cartOpenBtn.addEventListener('click', toggleCart);
        cartCloseBtn.addEventListener('click', toggleCart);
        cartOverlay.addEventListener('click', toggleCart);
    }

    // ----- Filtering & Sorting Logic -----

    function applyFilters() {
        let results = [...allProducts];

        // 1. Search
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            results = results.filter(p =>
                p.title.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        }

        // 2. Category Filter
        const selectedRadio = document.querySelector('input[name="category"]:checked');
        const category = selectedRadio ? selectedRadio.value : 'All';

        if (category !== 'All') {
            results = results.filter(p => p.category === category);
            currentCategoryTitle.textContent = category + ' Products';
        } else {
            currentCategoryTitle.textContent = 'All Products';
        }

        // 3. Price Filter
        const minP = parseFloat(minPriceInput.value);
        const maxP = parseFloat(maxPriceInput.value);
        if (!isNaN(minP)) results = results.filter(p => p.price >= minP);
        if (!isNaN(maxP)) results = results.filter(p => p.price <= maxP);

        // 4. Sorting
        const sortVal = sortSelect.value;
        if (sortVal === 'price-asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sortVal === 'price-desc') {
            results.sort((a, b) => b.price - a.price);
        } else if (sortVal === 'rating-desc') {
            results.sort((a, b) => b.rating - a.rating);
        }

        filteredProducts = results;
        displayLimit = 20; // reset pagination
        renderProducts();
    }

    // ----- Rendering -----

    function renderProducts() {
        productGrid.innerHTML = '';

        productCount.textContent = `Showing ${Math.min(displayLimit, filteredProducts.length)} of ${filteredProducts.length} Results`;

        if (filteredProducts.length === 0) {
            productGrid.innerHTML = '<p class="no-results">No products found matching your criteria.</p>';
            loadMoreBtn.classList.add('hidden');
            return;
        }

        const toDisplay = filteredProducts.slice(0, displayLimit);

        toDisplay.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // Generate Stars
            const fullStars = Math.floor(product.rating);
            const halfStar = product.rating % 1 >= 0.5 ? 1 : 0;
            const emptyStars = 5 - fullStars - halfStar;

            let starsHTML = '';
            for (let i = 0; i < fullStars; i++) starsHTML += '<i class="fas fa-star"></i>';
            if (halfStar) starsHTML += '<i class="fas fa-star-half-alt"></i>';
            for (let i = 0; i < emptyStars; i++) starsHTML += '<i class="far fa-star"></i>';

            // Generate options HTML
            let colorOptionsHTML = product.colors.map(c => `<option value="${c}">${c}</option>`).join('');
            let sizeOptionsHTML = product.sizes.map(s => `<option value="${s}">${s}</option>`).join('');

            card.innerHTML = `
                <div class="product-img-wrapper">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title" title="${product.title}">${product.title}</h3>
                    <div class="product-price-row">
                        <span class="product-price">&#8377;${product.price.toLocaleString('en-IN')}</span>
                        <div class="product-rating" title="${product.rating}">
                            ${starsHTML}
                        </div>
                    </div>
                    
                    <div class="product-options">
                        ${product.colors.length > 0 && product.colors[0] !== 'None' ?
                    `<div class="option-group">
                             <select id="color-${product.id}">
                               ${colorOptionsHTML}
                             </select>
                           </div>` : ''}
                        
                        ${product.sizes.length > 0 && product.sizes[0] !== 'One Size' ?
                    `<div class="option-group">
                             <select id="size-${product.id}">
                               ${sizeOptionsHTML}
                             </select>
                           </div>` : ''}
                    </div>
                    
                    <button class="add-to-cart-btn" onclick="window.addToCartFromCard('${product.id}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;

            productGrid.appendChild(card);
        });

        if (displayLimit < filteredProducts.length) {
            loadMoreBtn.classList.remove('hidden');
        } else {
            loadMoreBtn.classList.add('hidden');
        }
    }

    // ----- Cart Logic -----

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
    }

    // Expose to window so onclick in HTML strings can access it
    window.addToCartFromCard = function (productId) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        // Get selected options if they exist
        const colorSelect = document.getElementById(`color-${productId}`);
        const sizeSelect = document.getElementById(`size-${productId}`);

        const selectedColor = colorSelect ? colorSelect.value : (product.colors[0] || 'None');
        const selectedSize = sizeSelect ? sizeSelect.value : (product.sizes[0] || 'One Size');

        // Check if already in cart
        const existingItem = cart.find(item =>
            item.product.id === productId &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                product,
                quantity: 1,
                selectedColor,
                selectedSize
            });
        }

        saveCartAndRender();
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    };

    window.updateCartQuantity = function (index, delta) {
        if (cart[index]) {
            cart[index].quantity += delta;
            if (cart[index].quantity <= 0) {
                cart.splice(index, 1);
            }
            saveCartAndRender();
        }
    };

    window.removeFromCart = function (index) {
        if (cart[index]) {
            cart.splice(index, 1);
            saveCartAndRender();
        }
    };

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty. Try adding some items!</div>';
            cartBadge.textContent = '0';
            cartBadge.style.display = 'none';
            cartSubtotal.innerHTML = '&#8377;0';
            return;
        }

        let totalItems = 0;
        let totalPrice = 0;
        let html = '';

        cart.forEach((item, index) => {
            totalItems += item.quantity;
            totalPrice += (item.product.price * item.quantity);

            const optionsText = [];
            if (item.selectedColor !== 'None') optionsText.push(item.selectedColor);
            if (item.selectedSize !== 'One Size') optionsText.push(item.selectedSize);
            const desc = optionsText.join(' - ');

            html += `
                <div class="cart-item">
                    <img src="${item.product.image}" alt="${item.product.title}" class="cart-item-img">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.product.title}</div>
                        ${desc ? `<div class="cart-item-desc">${desc}</div>` : ''}
                        <div class="cart-item-price">&#8377;${item.product.price.toLocaleString('en-IN')}</div>
                        <div class="cart-item-actions">
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="window.updateCartQuantity(${index}, -1)"><i class="fas fa-minus"></i></button>
                                <input type="number" class="qty-input" value="${item.quantity}" readonly>
                                <button class="qty-btn" onclick="window.updateCartQuantity(${index}, 1)"><i class="fas fa-plus"></i></button>
                            </div>
                            <button class="remove-btn" onclick="window.removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });

        cartItemsContainer.innerHTML = html;
        cartBadge.textContent = totalItems;
        cartBadge.style.display = 'flex';
        cartSubtotal.innerHTML = '&#8377;' + totalPrice.toLocaleString('en-IN');
    }

    function saveCartAndRender() {
        localStorage.setItem('luxeStoreCart', JSON.stringify(cart));
        renderCart();
    }

    function loadCartFromStorage() {
        const saved = localStorage.getItem('luxeStoreCart');
        if (saved) {
            try {
                cart = JSON.parse(saved);
            } catch (e) {
                cart = [];
            }
        }
        renderCart();
    }
});
