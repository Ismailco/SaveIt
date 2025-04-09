// DOM Elements
const categoriesList = document.getElementById('categories-list');
const bookmarksList = document.getElementById('bookmarks-list');
const openTabsList = document.getElementById('open-tabs-list');
const addCategoryBtn = document.getElementById('add-category-btn');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const refreshTabsBtn = document.getElementById('refresh-tabs-btn');
const currentCategoryHeading = document.getElementById('current-category');
const noCategorySelected = document.getElementById('no-category-selected');
const loadingTabs = document.getElementById('loading-tabs');

// Modal Elements
const addCategoryModal = document.getElementById('add-category-modal');
const addBookmarkModal = document.getElementById('add-bookmark-modal');
const addCategoryForm = document.getElementById('add-category-form');
const addBookmarkForm = document.getElementById('add-bookmark-form');
const categoryNameInput = document.getElementById('category-name');
const bookmarkTitleInput = document.getElementById('bookmark-title');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const closeButtons = document.querySelectorAll('.close');

// App State
let currentCategoryId = null;
let bookmarks = [];
let categories = [];
let openTabs = [];

// Initialize app
function init() {
    loadDataFromLocalStorage();
    renderCategories();
    loadOpenTabs();
    setupEventListeners();
}

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedCategories = localStorage.getItem('saveItCategories');
    const savedBookmarks = localStorage.getItem('saveItBookmarks');

    if (savedCategories) {
        categories = JSON.parse(savedCategories);
    } else {
        // Add sample categories if none exist
        categories = [
            { id: 'category-1', name: 'Work' },
            { id: 'category-2', name: 'Personal' }
        ];
        saveCategoriesToLocalStorage();
    }

    if (savedBookmarks) {
        bookmarks = JSON.parse(savedBookmarks);
    } else {
        // Add sample bookmarks if none exist
        bookmarks = [
            { id: 'bookmark-1', categoryId: 'category-1', title: 'Google', url: 'https://www.google.com' },
            { id: 'bookmark-2', categoryId: 'category-1', title: 'GitHub', url: 'https://www.github.com' },
            { id: 'bookmark-3', categoryId: 'category-2', title: 'YouTube', url: 'https://www.youtube.com' },
            { id: 'bookmark-4', categoryId: 'category-1', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
            { id: 'bookmark-5', categoryId: 'category-1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
            { id: 'bookmark-6', categoryId: 'category-2', title: 'Netflix', url: 'https://www.netflix.com' },
            { id: 'bookmark-7', categoryId: 'category-2', title: 'Twitter', url: 'https://twitter.com' },
            { id: 'bookmark-8', categoryId: 'category-2', title: 'Reddit', url: 'https://www.reddit.com' }
        ];
        saveBookmarksToLocalStorage();
    }
}

// Save categories to localStorage
function saveCategoriesToLocalStorage() {
    localStorage.setItem('saveItCategories', JSON.stringify(categories));
}

// Save bookmarks to localStorage
function saveBookmarksToLocalStorage() {
    localStorage.setItem('saveItBookmarks', JSON.stringify(bookmarks));
}

// Load open tabs using Chrome API
function loadOpenTabs() {
    // Show loading indicator
    openTabsList.innerHTML = '';
    openTabsList.appendChild(loadingTabs);

    // Get all open tabs from Chrome
    chrome.tabs.query({}, function(tabs) {
        openTabs = tabs;
        renderOpenTabs();
    });
}

// Render categories in the sidebar
function renderCategories() {
    categoriesList.innerHTML = '';

    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = `category-item ${category.id === currentCategoryId ? 'active' : ''}`;
        categoryItem.dataset.id = category.id;

        categoryItem.innerHTML = `
            <span class="category-name">${category.name}</span>
            <span class="category-delete" data-id="${category.id}">&times;</span>
        `;

        categoriesList.appendChild(categoryItem);
    });

    // Add event listeners to category items and delete buttons
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('category-delete')) {
                selectCategory(item.dataset.id);
            }
        });
    });

    document.querySelectorAll('.category-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(btn.dataset.id);
        });
    });
}

// Render bookmarks for the selected category
function renderBookmarks() {
    bookmarksList.innerHTML = '';

    if (!currentCategoryId) {
        bookmarksList.appendChild(noCategorySelected);
        return;
    }

    const categoryBookmarks = bookmarks.filter(bookmark => bookmark.categoryId === currentCategoryId);

    if (categoryBookmarks.length === 0) {
        const noBookmarks = document.createElement('p');
        noBookmarks.textContent = 'No bookmarks in this category yet.';
        noBookmarks.style.textAlign = 'center';
        noBookmarks.style.color = '#a0a0a0';
        noBookmarks.style.gridColumn = 'span 5';
        bookmarksList.appendChild(noBookmarks);
        return;
    }

    categoryBookmarks.forEach(bookmark => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        bookmarkItem.dataset.id = bookmark.id;

        try {
            const domain = new URL(bookmark.url).hostname;
            const firstLetter = bookmark.title.charAt(0).toUpperCase();

            bookmarkItem.innerHTML = `
                <div class="bookmark-info">
                    <div class="bookmark-icon">${firstLetter}</div>
                    <div class="bookmark-title" title="${bookmark.title}">${bookmark.title}</div>
                    <a href="${bookmark.url}" class="bookmark-url" target="_blank" title="${domain}">${domain}</a>
                </div>
                <span class="bookmark-delete" data-id="${bookmark.id}">&times;</span>
            `;

            // Make the entire bookmark item clickable except the delete button
            bookmarkItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('bookmark-delete') &&
                    !e.target.classList.contains('bookmark-url')) {
                    window.open(bookmark.url, '_blank');
                }
            });

            bookmarksList.appendChild(bookmarkItem);
        } catch (e) {
            // Handle invalid URLs gracefully
            console.error(`Invalid URL for bookmark: ${bookmark.title}`, e);
        }
    });

    // Add event listeners to bookmark delete buttons
    document.querySelectorAll('.bookmark-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBookmark(btn.dataset.id);
        });
    });
}

// Render open tabs
function renderOpenTabs() {
    openTabsList.innerHTML = '';

    if (openTabs.length === 0) {
        const noTabs = document.createElement('p');
        noTabs.textContent = 'No open tabs found.';
        noTabs.style.textAlign = 'center';
        noTabs.style.color = '#a0a0a0';
        openTabsList.appendChild(noTabs);
        return;
    }

    // Filter out the current tab (new tab page)
    const filteredTabs = openTabs.filter(tab => !tab.url.startsWith('chrome://newtab'));

    filteredTabs.forEach(tab => {
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';

        // Get favicon or use a default
        const favicon = tab.favIconUrl || '';

        tabItem.innerHTML = `
            <div class="tab-info">
                ${favicon ? `<img src="${favicon}" class="tab-icon" alt="favicon">` : ''}
                <div class="tab-title" title="${tab.title}">${tab.title}</div>
            </div>
            <span class="tab-add" data-url="${tab.url}" data-title="${tab.title}">+</span>
        `;

        openTabsList.appendChild(tabItem);
    });

    // Add event listeners to tab add buttons
    document.querySelectorAll('.tab-add').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentCategoryId) {
                const tabTitle = btn.dataset.title;
                const tabUrl = btn.dataset.url;
                addBookmark(tabTitle, tabUrl);

                // Show visual feedback
                btn.textContent = '✓';
                btn.style.color = '#2ecc71';
                setTimeout(() => {
                    btn.textContent = '+';
                    btn.style.color = '';
                }, 1500);
            } else {
                alert('Please select a category first before adding a bookmark.');
            }
        });
    });
}

// Select a category
function selectCategory(categoryId) {
    currentCategoryId = categoryId;

    // Update category heading
    const selectedCategory = categories.find(category => category.id === categoryId);
    currentCategoryHeading.textContent = selectedCategory.name;

    // Enable add bookmark button
    addBookmarkBtn.disabled = false;

    // Update UI to show active category
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === categoryId);
    });

    renderBookmarks();
}

// Delete a category
function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category and all its bookmarks?')) {
        // Remove the category
        categories = categories.filter(category => category.id !== categoryId);
        saveCategoriesToLocalStorage();

        // Remove all bookmarks in this category
        bookmarks = bookmarks.filter(bookmark => bookmark.categoryId !== categoryId);
        saveBookmarksToLocalStorage();

        // Reset current category if it was deleted
        if (currentCategoryId === categoryId) {
            currentCategoryId = null;
            currentCategoryHeading.textContent = 'Select a Category';
            addBookmarkBtn.disabled = true;
        }

        renderCategories();
        renderBookmarks();
    }
}

// Delete a bookmark
function deleteBookmark(bookmarkId) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        bookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
        saveBookmarksToLocalStorage();
        renderBookmarks();
    }
}

// Add a new category
function addCategory(name) {
    const newCategory = {
        id: 'category-' + Date.now(),
        name: name
    };

    categories.push(newCategory);
    saveCategoriesToLocalStorage();
    renderCategories();

    // Select the new category
    selectCategory(newCategory.id);
}

// Add a new bookmark
function addBookmark(title, url) {
    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const newBookmark = {
        id: 'bookmark-' + Date.now(),
        categoryId: currentCategoryId,
        title: title,
        url: url
    };

    bookmarks.push(newBookmark);
    saveBookmarksToLocalStorage();
    renderBookmarks();
}

// Setup event listeners
function setupEventListeners() {
    // Add Category
    addCategoryBtn.addEventListener('click', () => {
        addCategoryModal.style.display = 'block';
        categoryNameInput.focus();
    });

    addCategoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const categoryName = categoryNameInput.value.trim();

        if (categoryName) {
            addCategory(categoryName);
            categoryNameInput.value = '';
            addCategoryModal.style.display = 'none';
        }
    });

    // Add Bookmark
    addBookmarkBtn.addEventListener('click', () => {
        addBookmarkModal.style.display = 'block';
        bookmarkTitleInput.focus();
    });

    addBookmarkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookmarkTitle = bookmarkTitleInput.value.trim();
        const bookmarkUrl = bookmarkUrlInput.value.trim();

        if (bookmarkTitle && bookmarkUrl) {
            addBookmark(bookmarkTitle, bookmarkUrl);
            bookmarkTitleInput.value = '';
            bookmarkUrlInput.value = '';
            addBookmarkModal.style.display = 'none';
        }
    });

    // Refresh Open Tabs
    refreshTabsBtn.addEventListener('click', loadOpenTabs);

    // Close Modals
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            addCategoryModal.style.display = 'none';
            addBookmarkModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === addCategoryModal) {
            addCategoryModal.style.display = 'none';
        }
        if (e.target === addBookmarkModal) {
            addBookmarkModal.style.display = 'none';
        }
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
