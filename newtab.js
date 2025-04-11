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
const toggleCategoriesBtn = document.getElementById('toggle-categories');
const toggleTabsBtn = document.getElementById('toggle-tabs');
const categoriesPanel = document.getElementById('categories-panel');
const tabsPanel = document.getElementById('tabs-panel');
const bookmarksSection = document.querySelector('.bookmarks-section');

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
let draggedItem = null;
let draggedItemType = null;
let draggedTabData = null;

// Initialize app
function init() {
    loadDataFromLocalStorage();
    renderCategories();
    loadOpenTabs();
    setupEventListeners();

    // Load the saved selected category
    const savedCategoryId = localStorage.getItem('saveItSelectedCategory');
    if (savedCategoryId && categories.some(cat => cat.id === savedCategoryId)) {
        selectCategory(savedCategoryId);
    }
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
            { id: 'category-1', name: 'Work', order: 0 },
            { id: 'category-2', name: 'Personal', order: 1 }
        ];
        saveCategoriesToLocalStorage();
    }

    if (savedBookmarks) {
        bookmarks = JSON.parse(savedBookmarks);
    } else {
        // Add sample bookmarks if none exist
        bookmarks = [
            { id: 'bookmark-1', categoryId: 'category-1', title: 'Google', url: 'https://www.google.com', order: 0 },
            { id: 'bookmark-2', categoryId: 'category-1', title: 'GitHub', url: 'https://www.github.com', order: 1 },
            { id: 'bookmark-3', categoryId: 'category-2', title: 'YouTube', url: 'https://www.youtube.com', order: 0 },
            { id: 'bookmark-4', categoryId: 'category-1', title: 'Stack Overflow', url: 'https://stackoverflow.com', order: 2 },
            { id: 'bookmark-5', categoryId: 'category-1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', order: 3 },
            { id: 'bookmark-6', categoryId: 'category-2', title: 'Netflix', url: 'https://www.netflix.com', order: 1 },
            { id: 'bookmark-7', categoryId: 'category-2', title: 'Twitter', url: 'https://twitter.com', order: 2 },
            { id: 'bookmark-8', categoryId: 'category-2', title: 'Reddit', url: 'https://www.reddit.com', order: 3 }
        ];
        saveBookmarksToLocalStorage();
    }

    // Ensure each item has an order property
    categories.forEach((category, index) => {
        if (category.order === undefined) {
            category.order = index;
        }
    });

    bookmarks.forEach((bookmark, index) => {
        if (bookmark.order === undefined) {
            bookmark.order = index;
        }
    });

    // Sort categories and bookmarks by order
    categories.sort((a, b) => a.order - b.order);
    bookmarks.sort((a, b) => a.order - b.order);

    saveCategoriesToLocalStorage();
    saveBookmarksToLocalStorage();
}

// Save categories to localStorage
function saveCategoriesToLocalStorage() {
    localStorage.setItem('saveItCategories', JSON.stringify(categories));
}

// Save bookmarks to localStorage
function saveBookmarksToLocalStorage() {
    localStorage.setItem('saveItBookmarks', JSON.stringify(bookmarks));
}

// Get favicon URL for a domain
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
        return null;
    }
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

    // Sort categories by order
    categories.sort((a, b) => a.order - b.order);

    categories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = `category-item ${category.id === currentCategoryId ? 'active' : ''}`;
        categoryItem.dataset.id = category.id;
        categoryItem.draggable = true;

        categoryItem.innerHTML = `
            <span class="drag-handle">≡</span>
            <span class="category-name">${category.name}</span>
            <span class="category-delete" data-id="${category.id}">&times;</span>
        `;

        categoriesList.appendChild(categoryItem);
    });

    // Add event listeners to category items and delete buttons
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('category-delete') &&
                !e.target.classList.contains('drag-handle')) {
                selectCategory(item.dataset.id);
            }
        });

        // Drag and drop events for categories
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            draggedItemType = 'category';
            setTimeout(() => {
                item.classList.add('dragging');
            }, 0);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
            draggedItemType = null;
        });
    });

    document.querySelectorAll('.category-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCategory(btn.dataset.id);
        });
    });

    // Add drop zone for categories
    categoriesList.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItemType !== 'category') return;

        const afterElement = getDragAfterElement(categoriesList, e.clientY);
        const draggable = document.querySelector('.dragging');

        if (afterElement == null) {
            categoriesList.appendChild(draggable);
        } else {
            categoriesList.insertBefore(draggable, afterElement);
        }
    });

    categoriesList.addEventListener('drop', () => {
        if (draggedItemType !== 'category') return;

        // Update order of categories based on their new positions
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach((item, index) => {
            const categoryId = item.dataset.id;
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
                category.order = index;
            }
        });

        saveCategoriesToLocalStorage();
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

    // Sort bookmarks by order
    categoryBookmarks.sort((a, b) => a.order - b.order);

    categoryBookmarks.forEach(bookmark => {
        const bookmarkItem = document.createElement('div');
        bookmarkItem.className = 'bookmark-item';
        bookmarkItem.dataset.id = bookmark.id;
        bookmarkItem.draggable = true;

        try {
            const domain = new URL(bookmark.url).hostname;
            const faviconUrl = getFaviconUrl(bookmark.url);
            const firstLetter = bookmark.title.charAt(0).toUpperCase();

            const iconContent = faviconUrl
                ? `<img src="${faviconUrl}" class="bookmark-favicon" alt="${firstLetter}">`
                : `<div class="bookmark-icon">${firstLetter}</div>`;

            bookmarkItem.innerHTML = `
                <div class="bookmark-info">
                    <div class="drag-handle bookmark-drag-handle">≡</div>
                    ${iconContent}
                    <div class="bookmark-title" title="${bookmark.title}">${bookmark.title}</div>
                    <a href="${bookmark.url}" class="bookmark-url" target="_blank" title="${domain}">${domain}</a>
                </div>
                <span class="bookmark-delete" data-id="${bookmark.id}">&times;</span>
            `;

            // Make the bookmark item clickable except for specific elements
            bookmarkItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('bookmark-delete') &&
                    !e.target.classList.contains('bookmark-url') &&
                    !e.target.classList.contains('drag-handle')) {
                    window.open(bookmark.url, '_blank');
                }
            });

            // Drag and drop events for bookmarks
            bookmarkItem.addEventListener('dragstart', (e) => {
                draggedItem = bookmarkItem;
                draggedItemType = 'bookmark';
                setTimeout(() => {
                    bookmarkItem.classList.add('dragging');
                }, 0);
            });

            bookmarkItem.addEventListener('dragend', () => {
                bookmarkItem.classList.remove('dragging');
                draggedItem = null;
                draggedItemType = null;
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

    // Add drop zone for bookmarks
    bookmarksList.addEventListener('dragover', (e) => {
        e.preventDefault();

        // Allow both bookmark and tab drag types
        if (draggedItemType !== 'bookmark' && draggedItemType !== 'tab') return;

        // Highlight the drop area
        bookmarksList.classList.add('drag-over');

        if (draggedItemType === 'bookmark') {
            const draggable = document.querySelector('.dragging');
            const afterElement = getDragAfterElementGrid(bookmarksList, e.clientX, e.clientY);

            if (afterElement == null) {
                bookmarksList.appendChild(draggable);
            } else {
                bookmarksList.insertBefore(draggable, afterElement);
            }
        }
    });

    bookmarksList.addEventListener('dragleave', () => {
        bookmarksList.classList.remove('drag-over');
    });

    bookmarksList.addEventListener('drop', (e) => {
        e.preventDefault();
        bookmarksList.classList.remove('drag-over');

        if (draggedItemType === 'bookmark') {
            // Update order of bookmarks based on new positions
            const bookmarkItems = document.querySelectorAll('.bookmark-item');
            let order = 0;

            bookmarkItems.forEach((item) => {
                const bookmarkId = item.dataset.id;
                const bookmark = bookmarks.find(bm => bm.id === bookmarkId);
                if (bookmark) {
                    bookmark.order = order++;
                }
            });

            saveBookmarksToLocalStorage();
        } else if (draggedItemType === 'tab' && draggedTabData && currentCategoryId) {
            // Add the tab as a new bookmark
            addBookmark(draggedTabData.title, draggedTabData.url);

            // Show visual feedback in the tabs list
            const tabItem = document.querySelector(`.tab-item[data-id="${draggedTabData.id}"]`);
            if (tabItem) {
                const addBtn = tabItem.querySelector('.tab-add');
                if (addBtn) {
                    addBtn.textContent = '✓';
                    addBtn.style.color = '#2ecc71';
                    setTimeout(() => {
                        addBtn.textContent = '+';
                        addBtn.style.color = '';
                    }, 1500);
                }
            }

            draggedTabData = null;
        }
    });
}

// Helper function to get the element after which to place the dragged item (for list layout)
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.category-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Helper function to get the element after which to place the dragged item (for grid layout)
function getDragAfterElementGrid(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.bookmark-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();

        // Calculate distance to the center of the element
        const offsetX = x - (box.left + box.width / 2);
        const offsetY = y - (box.top + box.height / 2);
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

        if (distance < closest.distance) {
            return { distance: distance, element: child };
        } else {
            return closest;
        }
    }, { distance: Number.POSITIVE_INFINITY }).element;
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
        tabItem.dataset.id = tab.id;
        tabItem.draggable = true;

        // Get favicon or use a default
        const favicon = tab.favIconUrl || '';

        tabItem.innerHTML = `
            <div class="tab-info">
                <div class="tab-drag-handle">≡</div>
                ${favicon ? `<img src="${favicon}" class="tab-icon" alt="favicon">` : ''}
                <div class="tab-title" title="${tab.title}">${tab.title}</div>
            </div>
            <span class="tab-add" data-url="${tab.url}" data-title="${tab.title}">+</span>
        `;

        // Make the tab item draggable
        tabItem.addEventListener('dragstart', (e) => {
            draggedItem = tabItem;
            draggedItemType = 'tab';
            draggedTabData = {
                id: tab.id,
                title: tab.title,
                url: tab.url
            };

            // Create a drag image
            const dragImage = document.createElement('div');
            dragImage.classList.add('tab-drag-image');
            dragImage.innerHTML = favicon ? `<img src="${favicon}" class="tab-icon">` : '';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            document.body.appendChild(dragImage);

            e.dataTransfer.setDragImage(dragImage, 15, 15);
            e.dataTransfer.effectAllowed = 'copy';

            setTimeout(() => {
                tabItem.classList.add('dragging');
                document.body.removeChild(dragImage);
            }, 0);
        });

        tabItem.addEventListener('dragend', () => {
            tabItem.classList.remove('dragging');
            draggedItem = null;
            draggedItemType = null;
        });

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

    // Save the selected category to localStorage
    localStorage.setItem('saveItSelectedCategory', categoryId);

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
            localStorage.removeItem('saveItSelectedCategory');
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
    // Find the highest order value and add 1
    const maxOrder = categories.length > 0
        ? Math.max(...categories.map(cat => cat.order))
        : -1;

    const newCategory = {
        id: 'category-' + Date.now(),
        name: name,
        order: maxOrder + 1
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

    // Find the highest order value for the current category and add 1
    const categoryBookmarks = bookmarks.filter(bookmark => bookmark.categoryId === currentCategoryId);
    const maxOrder = categoryBookmarks.length > 0
        ? Math.max(...categoryBookmarks.map(bm => bm.order))
        : -1;

    const newBookmark = {
        id: 'bookmark-' + Date.now(),
        categoryId: currentCategoryId,
        title: title,
        url: url,
        order: maxOrder + 1
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

    // Show category selection alert when dragging a tab but no category is selected
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedItemType === 'tab' && !currentCategoryId &&
            !document.querySelector('.category-alert')) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'category-alert';
            alertDiv.textContent = 'Please select a category first!';
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 2000);
        }
    });

    // Panel toggle functionality
    toggleCategoriesBtn.addEventListener('click', () => {
        categoriesPanel.classList.toggle('collapsed');
        toggleCategoriesBtn.classList.toggle('collapsed');
        bookmarksSection.classList.toggle('expanded');
    });

    toggleTabsBtn.addEventListener('click', () => {
        tabsPanel.classList.toggle('collapsed');
        toggleTabsBtn.classList.toggle('collapsed');
        bookmarksSection.classList.toggle('expanded');
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
