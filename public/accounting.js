// 商品マスター - 寿司屋メニュー
const products = [
    // 握り寿司
    { id: 1, name: "まぐろ", price: 180, emoji: "🍣", category: "握り" },
    { id: 2, name: "中とろ", price: 280, emoji: "🍣", category: "握り" },
    { id: 3, name: "大とろ", price: 480, emoji: "🍣", category: "握り" },
    { id: 4, name: "サーモン", price: 160, emoji: "🍣", category: "握り" },
    { id: 5, name: "いくら", price: 320, emoji: "🍣", category: "握り" },
    { id: 6, name: "うに", price: 580, emoji: "🍣", category: "握り" },
    { id: 7, name: "えび", price: 140, emoji: "🍤", category: "握り" },
    { id: 8, name: "あなご", price: 200, emoji: "🍣", category: "握り" },
    { id: 9, name: "たまご", price: 120, emoji: "🥚", category: "握り" },
    { id: 10, name: "いか", price: 150, emoji: "🦑", category: "握り" },
    
    // 巻物
    { id: 11, name: "鉄火巻", price: 280, emoji: "🍱", category: "巻物" },
    { id: 12, name: "かっぱ巻", price: 180, emoji: "🥒", category: "巻物" },
    { id: 13, name: "カリフォルニアロール", price: 380, emoji: "🍣", category: "巻物" },
    { id: 14, name: "ネギトロ巻", price: 320, emoji: "🍱", category: "巻物" },
    
    // 丼・セット
    { id: 15, name: "ちらし丼", price: 980, emoji: "🍱", category: "丼" },
    { id: 16, name: "海鮮丼", price: 1280, emoji: "🍱", category: "丼" },
    { id: 17, name: "特上寿司セット", price: 2180, emoji: "🍣", category: "セット" },
    { id: 18, name: "上寿司セット", price: 1580, emoji: "🍣", category: "セット" },
    
    // ドリンク
    { id: 19, name: "お茶", price: 0, emoji: "🍵", category: "ドリンク" },
    { id: 20, name: "ビール", price: 480, emoji: "🍺", category: "ドリンク" },
    { id: 21, name: "日本酒", price: 580, emoji: "🍶", category: "ドリンク" },
    { id: 22, name: "ソフトドリンク", price: 280, emoji: "🥤", category: "ドリンク" }
];

// 選択した商品
let selectedItems = [];
let nextCustomId = 1000;

// DOM要素取得
const sideMenu = document.getElementById('sideMenu');
const toggleSideMenu = document.getElementById('toggleSideMenu');
const showSideMenu = document.getElementById('showSideMenu');

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCalculation();
    initializeSideMenu();
    setupSideMenuEvents();
});

// サイドメニューイベント設定
function setupSideMenuEvents() {
    toggleSideMenu.addEventListener('click', () => {
        hideSideMenu();
    });

    showSideMenu.addEventListener('click', () => {
        showSideMenuFunc();
    });
}

// サイドメニュー制御
function hideSideMenu() {
    sideMenu.classList.add('hidden');
    showSideMenu.classList.remove('hidden');
    document.body.classList.remove('menu-open');
}

function showSideMenuFunc() {
    sideMenu.classList.remove('hidden');
    showSideMenu.classList.add('hidden');
    document.body.classList.add('menu-open');
}

// 初期状態でサイドメニューを表示
function initializeSideMenu() {
    // デスクトップでは最初から表示、モバイルでは非表示
    if (window.innerWidth > 768) {
        showSideMenuFunc();
    } else {
        hideSideMenu();
    }
}

// ウィンドウリサイズ時の処理
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        hideSideMenu();
    } else {
        showSideMenuFunc();
    }
});

// メッセージ表示機能
function showMessage(text, type = 'success') {
    // 簡易的なアラート（本来はindex.htmlのメッセージ機能を使用）
    alert(text);
}

// 商品一覧を表示
function renderProducts() {
    const productGrid = document.getElementById('productGrid');
    
    productGrid.innerHTML = products.map(product => `
        <div class="product-item" onclick="selectProduct(${product.id})">
            <div class="product-emoji">${product.emoji}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">¥${product.price.toLocaleString()}</div>
        </div>
    `).join('');
}

// 商品を選択
function selectProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // 既に選択されている商品があるか確認
    const existingItem = selectedItems.find(item => item.id === productId);
    
    if (existingItem) {
        // 既にある場合は数量を増やす
        existingItem.quantity++;
    } else {
        // 新しく追加
        selectedItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            emoji: product.emoji
        });
    }
    
    updateCalculation();
    renderSelectedItems();
    
    // 商品アイテムをハイライト
    highlightProduct(productId);
}

// 商品をハイライト
function highlightProduct(productId) {
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // 対象の商品をハイライト（一時的）
    const targetItem = productItems[productId - 1];
    if (targetItem) {
        targetItem.classList.add('selected');
        setTimeout(() => {
            targetItem.classList.remove('selected');
        }, 300);
    }
}

// カスタム商品を追加
function addCustomProduct() {
    const nameInput = document.getElementById('customName');
    const priceInput = document.getElementById('customPrice');
    
    const name = nameInput.value.trim();
    const price = parseInt(priceInput.value);
    
    if (!name || !price || price <= 0) {
        alert('商品名と正しい金額を入力してください');
        return;
    }
    
    const customProduct = {
        id: nextCustomId++,
        name: name,
        price: price,
        quantity: 1,
        emoji: '📦'
    };
    
    selectedItems.push(customProduct);
    
    // 入力フィールドをクリア
    nameInput.value = '';
    priceInput.value = '';
    
    updateCalculation();
    renderSelectedItems();
}

// 選択した商品一覧を表示
function renderSelectedItems() {
    const selectedItemsContainer = document.getElementById('selectedItems');
    
    if (selectedItems.length === 0) {
        selectedItemsContainer.innerHTML = `
            <div class="empty-cart">
                <p>商品を選択してください</p>
            </div>
        `;
        return;
    }
    
    selectedItemsContainer.innerHTML = selectedItems.map(item => `
        <div class="selected-item">
            <div class="item-info">
                <div class="item-name">${item.emoji} ${item.name}</div>
                <div class="item-details">¥${item.price.toLocaleString()} × ${item.quantity} = ¥${(item.price * item.quantity).toLocaleString()}</div>
            </div>
            <div class="item-controls">
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">−</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeItem(${item.id})">×</button>
            </div>
        </div>
    `).join('');
}

// 数量を変更
function changeQuantity(itemId, change) {
    const item = selectedItems.find(item => item.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeItem(itemId);
        return;
    }
    
    updateCalculation();
    renderSelectedItems();
}

// 商品を削除
function removeItem(itemId) {
    selectedItems = selectedItems.filter(item => item.id !== itemId);
    updateCalculation();
    renderSelectedItems();
}

// 全てクリア
function clearAll() {
    if (selectedItems.length === 0) return;
    
    if (confirm('全ての商品をクリアしますか？')) {
        selectedItems = [];
        updateCalculation();
        renderSelectedItems();
    }
}

// 計算を更新
function updateCalculation() {
    const subtotal = selectedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    const tax = Math.floor(subtotal * 0.1);
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `¥${subtotal.toLocaleString()}`;
    document.getElementById('tax').textContent = `¥${tax.toLocaleString()}`;
    document.getElementById('total').textContent = `¥${total.toLocaleString()}`;
}

// 金額をコピー
async function copyTotal() {
    const totalElement = document.getElementById('total');
    const totalText = totalElement.textContent;
    
    // 数字のみを抽出（¥と,を除去）
    const numberOnly = totalText.replace(/[¥,]/g, '');
    
    try {
        await navigator.clipboard.writeText(numberOnly);
        showCopyMessage();
    } catch (err) {
        // フォールバック: 古いブラウザ対応
        const textarea = document.createElement('textarea');
        textarea.value = numberOnly;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopyMessage();
    }
}

// コピー成功メッセージを表示
function showCopyMessage() {
    const message = document.getElementById('copyMessage');
    message.classList.remove('hidden');
    
    setTimeout(() => {
        message.classList.add('hidden');
    }, 2000);
}

// キーボードショートカット
document.addEventListener('keydown', (e) => {
    // Ctrl+C または Cmd+C で金額コピー
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isInputFocused()) {
        e.preventDefault();
        copyTotal();
    }
    
    // Ctrl+Delete または Cmd+Delete で全クリア
    if ((e.ctrlKey || e.metaKey) && e.key === 'Delete') {
        e.preventDefault();
        clearAll();
    }
    
    // ESC でウィンドウを閉じる
    if (e.key === 'Escape') {
        window.close();
    }
});

// 入力フィールドにフォーカスがあるかチェック
function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
}

// 商品検索機能（将来の拡張用）
function searchProducts(query) {
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase())
    );
    return filteredProducts;
}