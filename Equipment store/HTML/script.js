(function() {
    // Товары (название, цена)
    const products = [
        { id: 1, name: 'Клавиатура Logi', price: 5490 },
        { id: 2, name: 'Мышь MX Master', price: 2790 },
        { id: 3, name: 'Монитор Dell 24"', price: 12990 },
        { id: 4, name: 'Наушники Sony', price: 6990 },
        { id: 5, name: 'Коврик для мыши', price: 890 },
        { id: 6, name: 'Веб-камера Logitech', price: 3990 }
    ];

    // Корзина: { id: { id, quantity } }
    let cart = JSON.parse(localStorage.getItem('officeCart')) || {};

    // Сохранить корзину в localStorage и обновить интерфейс
    function saveCart() {
        localStorage.setItem('officeCart', JSON.stringify(cart));
        updateCartCount();
        renderCartPage();
        renderCatalog();  // обновим кнопки в каталоге
    }

    // Обновить счётчик товаров в шапке
    function updateCartCount() {
        const total = Object.values(cart).reduce((acc, i) => acc + i.quantity, 0);
        document.getElementById('cartCount').innerText = total;
    }

    // Рендер каталога с рамками под изображение
    function renderCatalog() {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        let html = '';
        products.forEach(p => {
            const inCart = cart[p.id] ? cart[p.id].quantity : 0;
            html += `
                <div class="product-card" data-id="${p.id}">
                    <div class="product-image-placeholder"></div>
                    <div class="product-title">${p.name}</div>
                    <div class="product-price">${p.price} <span>₽</span></div>
                    <div class="qty-control">
                        <button class="qty-minus" data-id="${p.id}">−</button>
                        <span class="qty-num" id="qty-${p.id}">1</span>
                        <button class="qty-plus" data-id="${p.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${p.id}">
                        ${inCart ? `✅ В корзине (${inCart})` : 'В корзину'}
                    </button>
                </div>
            `;
        });
        grid.innerHTML = html;

        // Обработчики для кнопок +/-
        document.querySelectorAll('.qty-minus').forEach(b => b.addEventListener('click', e => {
            const id = b.dataset.id;
            const span = document.getElementById(`qty-${id}`);
            let v = parseInt(span.innerText);
            if (v > 1) span.innerText = v - 1;
        }));
        document.querySelectorAll('.qty-plus').forEach(b => b.addEventListener('click', e => {
            const id = b.dataset.id;
            const span = document.getElementById(`qty-${id}`);
            let v = parseInt(span.innerText);
            span.innerText = v + 1;
        }));

        // Добавление в корзину
        document.querySelectorAll('.add-to-cart').forEach(b => b.addEventListener('click', e => {
            const id = Number(b.dataset.id);
            const qty = parseInt(document.getElementById(`qty-${id}`).innerText);
            if (cart[id]) {
                cart[id].quantity += qty;
            } else {
                cart[id] = { id, quantity: qty };
            }
            saveCart();
            document.getElementById(`qty-${id}`).innerText = 1; // сброс количества после добавления
        }));
    }

    // Рендер страницы корзины
    function renderCartPage() {
        const container = document.getElementById('cartContainer');
        if (!container) return;

        const items = Object.values(cart);
        if (!items.length) {
            container.innerHTML = '<p style="padding:2rem; text-align:center;">Корзина пуста</p>';
            return;
        }

        let html = '', total = 0;
        items.forEach(item => {
            const prod = products.find(p => p.id === item.id);
            if (!prod) return;
            const sum = prod.price * item.quantity;
            total += sum;
            html += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-title">${prod.name}</span>
                        <span>${prod.price}₽ ×</span>
                        <div class="cart-qty">
                            <button class="cart-qty-minus" data-id="${item.id}">−</button>
                            <span class="cart-qty-num">${item.quantity}</span>
                            <button class="cart-qty-plus" data-id="${item.id}">+</button>
                        </div>
                        <span>= ${sum}₽</span>
                    </div>
                    <button class="cart-item-remove" data-id="${item.id}">Удалить</button>
                </div>
            `;
        });
        html += `<div class="cart-total">Итого: ${total} ₽</div>`;
        container.innerHTML = html;

        // Обработчики внутри корзины
        document.querySelectorAll('.cart-qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                if (cart[id].quantity > 1) {
                    cart[id].quantity--;
                } else {
                    delete cart[id];
                }
                saveCart();
            });
        });
        document.querySelectorAll('.cart-qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                cart[id].quantity++;
                saveCart();
            });
        });
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                delete cart[id];
                saveCart();
            });
        });
    }

    // Навигация между страницами
    const pages = {
        home: document.getElementById('home'),
        catalog: document.getElementById('catalog'),
        cart: document.getElementById('cart'),
        contacts: document.getElementById('contacts')
    };

    function showPage(pageId) {
        Object.values(pages).forEach(p => p.classList.remove('active-page'));
        pages[pageId].classList.add('active-page');
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageId) link.classList.add('active');
        });
        // Обновляем контент при переключении
        if (pageId === 'catalog') renderCatalog();
        if (pageId === 'cart') renderCartPage();
        document.getElementById('navLinks').classList.remove('show');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });

    document.getElementById('burgerBtn').addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('show');
    });

    document.getElementById('goToCatalog')?.addEventListener('click', () => {
        showPage('catalog');
    });

    // Инициализация
    renderCatalog();
    renderCartPage();
    updateCartCount();
})();