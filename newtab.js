// IndexedDB Configuration
const DB_NAME = 'SaveItDB';
const DB_VERSION = 1;
const STORES = {
    CATEGORIES: 'categories',
    SECTIONS: 'sections',
    BOOKMARKS: 'bookmarks',
    SETTINGS: 'settings'
};

// IndexedDB Helper Class
class SaveItDB {
    static async init() {
        try {
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // Create object stores if they don't exist
                    if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                        const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                        categoryStore.createIndex('order', 'order', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(STORES.SECTIONS)) {
                        const sectionStore = db.createObjectStore(STORES.SECTIONS, { keyPath: 'id' });
                        sectionStore.createIndex('categoryId', 'categoryId', { unique: false });
                        sectionStore.createIndex('order', 'order', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(STORES.BOOKMARKS)) {
                        const bookmarkStore = db.createObjectStore(STORES.BOOKMARKS, { keyPath: 'id' });
                        bookmarkStore.createIndex('categoryId', 'categoryId', { unique: false });
                        bookmarkStore.createIndex('sectionId', 'sectionId', { unique: false });
                        bookmarkStore.createIndex('order', 'order', { unique: false });
                    }

                    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                        db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                    }
                };
            });

            return db;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    static async getDB() {
        if (!this._dbPromise) {
            this._dbPromise = this.init();
        }
        return this._dbPromise;
    }

    static async getAll(storeName) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error getting all items from ${storeName}:`, error);
            throw error;
        }
    }

    static async get(storeName, id) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error getting item from ${storeName}:`, error);
            throw error;
        }
    }

    static async add(storeName, item) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(item);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error adding item to ${storeName}:`, error);
            throw error;
        }
    }

    static async put(storeName, item) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(item);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error updating item in ${storeName}:`, error);
            throw error;
        }
    }

    static async delete(storeName, id) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error deleting item from ${storeName}:`, error);
            throw error;
        }
    }

    static async clear(storeName) {
        try {
            const db = await this.getDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error(`Error clearing ${storeName}:`, error);
            throw error;
        }
    }

    static async putSetting(key, value) {
        return this.put(STORES.SETTINGS, { id: key, value });
    }

    static async getSetting(key) {
        const result = await this.get(STORES.SETTINGS, key);
        return result ? result.value : null;
    }
}

function handleCategoriesDragOver(e) {
    e.preventDefault();
    if (draggedItemType !== 'category') return;

    const afterElement = getDragAfterElement(categoriesList, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (!draggable) return;

    if (afterElement == null) {
        categoriesList.appendChild(draggable);
    } else {
        categoriesList.insertBefore(draggable, afterElement);
    }
}

async function handleCategoriesDrop() {
    if (draggedItemType !== 'category') return;

    try {
        const categoryItems = document.querySelectorAll('.category-item');
        let order = 0;

        for (const item of categoryItems) {
            const categoryId = item.dataset.id;
            const category = categories.find(cat => cat.id === categoryId);
            if (category) {
                category.order = order++;
                await SaveItDB.put(STORES.CATEGORIES, category);
            }
        }
    } catch (error) {
        console.error('Error updating category order:', error);
        alert('Error updating category order. Please try again.');
    }
}

function handleBookmarksClick(e) {
    const deleteBtn = e.target.closest('.bookmark-delete');
    if (!deleteBtn) return;
    e.stopPropagation();
    deleteBookmark(deleteBtn.dataset.id);
}

function handleBookmarksDragOver(e) {
    const container = e.target.closest('.section-bookmarks');
    if (container) {
        e.preventDefault();
        e.stopPropagation();

        if (draggedItemType !== 'bookmark' && draggedItemType !== 'tab') return;
        container.classList.add('drag-over');

        if (draggedItemType === 'bookmark') {
            const draggable = document.querySelector('.dragging');
            if (!draggable) return;

            try {
                const afterElement = getDragAfterElementHorizontal(container, e.clientX, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggable);
                } else {
                    container.insertBefore(draggable, afterElement);
                }
            } catch (err) {
                console.error('Error during bookmark drag and drop:', err);
            }
        }
        return;
    }

    e.preventDefault();
    if (draggedItemType !== 'bookmark' && draggedItemType !== 'tab' && draggedItemType !== 'section') return;
    bookmarksList.classList.add('drag-over');

    if (draggedItemType === 'section') {
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;

        const targetColumn = getTargetBookmarkColumn(e);
        if (!targetColumn) return;

        const allSections = [...targetColumn.querySelectorAll('.bookmark-section:not(.dragging)')];
        const defaultSection = targetColumn.querySelector('.default-section');
        let afterElement = null;

        for (const section of allSections) {
            const rect = section.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                if (section.parentNode === targetColumn) {
                    afterElement = section;
                    break;
                }
            }
        }

        if (afterElement == null && defaultSection) {
            const rect = defaultSection.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2 && defaultSection.parentNode === targetColumn) {
                afterElement = defaultSection;
            }
        }

        if (afterElement == null) {
            const placeholder = targetColumn.querySelector('.column-placeholder');
            if (placeholder) {
                if (draggable.parentNode !== targetColumn || draggable.nextSibling !== placeholder) {
                    targetColumn.insertBefore(draggable, placeholder);
                }
            } else if (draggable.parentNode !== targetColumn) {
                targetColumn.appendChild(draggable);
            }
        } else {
            try {
                if (afterElement.parentNode === targetColumn) {
                    targetColumn.insertBefore(draggable, afterElement);
                }
            } catch (err) {
                console.error('Error during section drag and drop:', err);
            }
        }

        document.querySelectorAll('.bookmark-column').forEach(column => {
            const occupied = column.querySelector('.bookmark-section, .default-section');
            const placeholder = column.querySelector('.column-placeholder');
            if (occupied && placeholder) placeholder.remove();
            if (!occupied && !placeholder) column.appendChild(createColumnPlaceholder());
        });
    }
}

function handleBookmarksDragLeave(e) {
    const sectionContainer = e.target && e.target.closest ? e.target.closest('.section-bookmarks') : null;
    if (sectionContainer) {
        const container = sectionContainer;
        if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
            container.classList.remove('drag-over');
        }
        return;
    }

    if (e.target === bookmarksList) {
        if (!e.relatedTarget || !bookmarksList.contains(e.relatedTarget)) {
            bookmarksList.classList.remove('drag-over');
        }
    }
}

async function handleBookmarksDrop(e) {
    const container = e.target.closest('.section-bookmarks');
    if (container) {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove('drag-over');

        const sectionElement = container.closest('.bookmark-section') || container.closest('.default-section');
        let sectionId = null;

        if (sectionElement) {
            if (sectionElement.classList.contains('default-section')) {
                sectionId = null;
            } else {
                sectionId = sectionElement.dataset.id;
            }
        }

        if (draggedItemType === 'bookmark') {
            try {
                if (!draggedItem) return;
                if (getSearchQuery()) {
                    renderBookmarks();
                    return;
                }
                const bookmarkId = draggedItem.dataset.id;
                const bookmark = bookmarks.find(bm => bm.id === bookmarkId);

                if (bookmark) {
                    if (bookmark.sectionId !== sectionId) {
                        bookmark.sectionId = sectionId;
                    }

                    const bookmarkItems = container.querySelectorAll('.bookmark-item');
                    let order = 0;

                    for (const item of bookmarkItems) {
                        const bmId = item.dataset.id;
                        const bm = bookmarks.find(b => b.id === bmId);
                        if (bm) {
                            bm.order = order++;
                            await SaveItDB.put(STORES.BOOKMARKS, bm);
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating bookmark order:', error);
                alert('Error updating bookmark order. Please try again.');
            }
        } else if (draggedItemType === 'tab' && draggedTabData) {
            await addBookmark(draggedTabData.title, draggedTabData.url, sectionId);

            const tabItem = document.querySelector(`.tab-item[data-id="${draggedTabData.id}"]`);
            if (tabItem) {
                tabItem.classList.add('tab-added');
                setTimeout(() => {
                    tabItem.classList.remove('tab-added');
                }, 1500);
            }

            draggedTabData = null;
        }
        return;
    }

    e.preventDefault();
    bookmarksList.classList.remove('drag-over');

    if (draggedItemType === 'tab' && draggedTabData && currentCategoryId) {
        await addBookmark(draggedTabData.title, draggedTabData.url, null);

        const tabItem = document.querySelector(`.tab-item[data-id="${draggedTabData.id}"]`);
        if (tabItem) {
            tabItem.classList.add('tab-added');
            setTimeout(() => {
                tabItem.classList.remove('tab-added');
            }, 1500);
        }

        draggedTabData = null;
    } else if (draggedItemType === 'section') {
        if (getSearchQuery()) {
            renderBookmarks();
            return;
        }
        try {
            await persistSectionLayout();
        } catch (error) {
            console.error('Error updating section order:', error);
            alert('Error updating section order. Please try again.');
        }
    }
}

function getTargetBookmarkColumn(e) {
    const columns = [...bookmarksList.querySelectorAll('.bookmark-column')];
    if (columns.length === 0) {
        return bookmarksList;
    }

    return columns.find(column => {
        const rect = column.getBoundingClientRect();
        return e.clientX >= rect.left && e.clientX <= rect.right;
    }) || columns[columns.length - 1];
}

async function persistSectionLayout() {
    const columns = [...bookmarksList.querySelectorAll('.bookmark-column')];
    if (columns.length === 0) return;

    if (columns.length >= 2) {
        columns.forEach((column, columnIndex) => {
            let order = 0;
            [...column.children].forEach(child => {
                if (!child.classList.contains('bookmark-section')) {
                    if (child.classList.contains('default-section') && currentCategoryId) {
                        uncategorizedColumns[currentCategoryId] = columnIndex;
                    }
                    return;
                }
                const section = sections.find(item => item.id === child.dataset.id);
                if (!section) return;
                section.column = columnIndex;
                section.order = order++;
            });
        });
        await saveUncategorizedColumns();
    } else {
        let order = 0;
        [...columns[0].querySelectorAll(':scope > .bookmark-section')].forEach(child => {
            const section = sections.find(item => item.id === child.dataset.id);
            if (!section) return;
            section.order = order++;
        });
    }

    await saveSectionsToIndexedDB();
}

async function saveUncategorizedColumns() {
    try {
        await SaveItDB.putSetting('uncategorizedColumns', uncategorizedColumns);
    } catch (error) {
        console.error('Error saving section columns:', error);
    }
}

// DOM Elements
const categoriesList = document.getElementById('categories-list');
const bookmarksList = document.getElementById('bookmarks-list');
const openTabsList = document.getElementById('open-tabs-list');
const addCategoryBtn = document.getElementById('add-category-btn');
const addSectionBtn = document.getElementById('add-section-btn');
const addBookmarkBtn = document.getElementById('add-bookmark-btn');
const saveAllBtn = document.getElementById('save-all-btn');
const refreshTabsBtn = document.getElementById('refresh-tabs-btn');
const currentCategoryHeading = document.getElementById('current-category');
const noCategorySelected = document.getElementById('no-category-selected');
const loadingTabs = document.getElementById('loading-tabs');
const toggleCategoriesBtn = document.getElementById('toggle-categories');
const toggleTabsBtn = document.getElementById('toggle-tabs');
const categoriesPanel = document.getElementById('categories-panel');
const tabsPanel = document.getElementById('tabs-panel');
const bookmarksSection = document.querySelector('.bookmarks-section');
const mainContent = document.querySelector('.main-content');

// Modal Elements
const addCategoryModal = document.getElementById('add-category-modal');
const addSectionModal = document.getElementById('add-section-modal');
const addBookmarkModal = document.getElementById('add-bookmark-modal');
const addCategoryForm = document.getElementById('add-category-form');
const addSectionForm = document.getElementById('add-section-form');
const addBookmarkForm = document.getElementById('add-bookmark-form');
const categoryNameInput = document.getElementById('category-name');
const sectionNameInput = document.getElementById('section-name');
const bookmarkTitleInput = document.getElementById('bookmark-title');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkSectionSelect = document.getElementById('bookmark-section');
const bookmarkSearchInput = document.getElementById('bookmark-search');
const clearSearchBtn = document.getElementById('clear-search');
const renameSectionModal = document.getElementById('rename-section-modal');
const renameSectionForm = document.getElementById('rename-section-form');
const renameSectionInput = document.getElementById('rename-section-name');
const appRoot = document.querySelector('.app');

// App State
let currentCategoryId = null;
let bookmarks = [];
let categories = [];
let sections = [];
let openTabs = [];
let draggedItem = null;
let draggedItemType = null;
let draggedTabData = null;
let collapsedSections = {}; // Tracks which sections are collapsed
let sidebarState = { // Tracks sidebar panel states
    categoriesCollapsed: false,
    tabsCollapsed: false
};
let uncategorizedColumns = {};
let uncategorizedRowColumns = {};

let bookmarkIdNonce = 0;
let tabsAccess = true;
let bookmarkScrollCategory = null;
let renamingSectionId = null;
let lastFocus = null;

const ICON = {
    grip: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="1.15" fill="currentColor"/><circle cx="15" cy="8" r="1.15" fill="currentColor"/><circle cx="9" cy="12" r="1.15" fill="currentColor"/><circle cx="15" cy="12" r="1.15" fill="currentColor"/><circle cx="9" cy="16" r="1.15" fill="currentColor"/><circle cx="15" cy="16" r="1.15" fill="currentColor"/></svg>',
    close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    chevron: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pencil: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 16.5V20h3.5L18 9.5 14.5 6 4 16.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 7.5l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
};

// Initialize app
async function init() {
    try {
        await loadDataFromIndexedDB();
        renderCategories();
        loadOpenTabs();
        setupEventListeners();

        // Load UI state before rendering the selected category.
        const savedCollapsedSections = await SaveItDB.getSetting('collapsedSections');
        if (savedCollapsedSections && typeof savedCollapsedSections === 'object') {
            collapsedSections = savedCollapsedSections;
        }

        const savedSidebarState = await SaveItDB.getSetting('sidebarState');
        if (savedSidebarState && typeof savedSidebarState === 'object') {
            sidebarState = { ...sidebarState, ...savedSidebarState };
            applySidebarState();
        }

        const savedColumns = await SaveItDB.getSetting('uncategorizedColumns');
        if (savedColumns && typeof savedColumns === 'object') {
            uncategorizedColumns = savedColumns;
        }
        if (ensureUncategorizedColumns()) {
            await saveUncategorizedColumns();
        }

        const savedRowColumns = await SaveItDB.getSetting('uncategorizedRowColumns');
        if (savedRowColumns && typeof savedRowColumns === 'object') {
            uncategorizedRowColumns = savedRowColumns;
        }

        renderToday();

        // Load the saved selected category, or open the first one so the new tab is useful immediately.
        const savedCategoryId = await SaveItDB.getSetting('selectedCategory');
        if (savedCategoryId && categories.some(cat => cat.id === savedCategoryId)) {
            await selectCategory(savedCategoryId);
        } else if (categories.length > 0) {
            await selectCategory(categories[0].id);
        } else {
            updateSummaries();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        // Show error message to user
        alert('Error loading data. Please refresh the page.');
    }
}

// Apply saved sidebar state
function applySidebarState() {
    categoriesPanel.classList.toggle('collapsed', sidebarState.categoriesCollapsed);
    toggleCategoriesBtn.classList.toggle('collapsed', sidebarState.categoriesCollapsed);
    toggleCategoriesBtn.setAttribute('aria-pressed', String(!sidebarState.categoriesCollapsed));
    toggleCategoriesBtn.title = sidebarState.categoriesCollapsed ? 'Show categories' : 'Hide categories';

    tabsPanel.classList.toggle('collapsed', sidebarState.tabsCollapsed);
    toggleTabsBtn.classList.toggle('collapsed', sidebarState.tabsCollapsed);
    toggleTabsBtn.setAttribute('aria-pressed', String(!sidebarState.tabsCollapsed));
    toggleTabsBtn.title = sidebarState.tabsCollapsed ? 'Show open tabs' : 'Hide open tabs';

    updateSidebarLayout();
}

function updateSidebarLayout() {
    const categoriesCollapsed = categoriesPanel.classList.contains('collapsed');
    const tabsCollapsed = tabsPanel.classList.contains('collapsed');

    if (mainContent) {
        mainContent.classList.toggle('left-collapsed', categoriesCollapsed);
        mainContent.classList.toggle('right-collapsed', tabsCollapsed);
    }

    bookmarksSection.classList.toggle('expanded', categoriesCollapsed && tabsCollapsed);

    requestAnimationFrame(() => {
        const renderedColumns = bookmarksList.querySelectorAll('.bookmark-column').length;
        if (renderedColumns > 0 && renderedColumns !== getColumnCount()) {
            renderBookmarks();
        }
    });
}

// Save sidebar state to IndexedDB
async function saveSidebarState() {
    try {
        await SaveItDB.putSetting('sidebarState', sidebarState);
    } catch (error) {
        console.error('Error saving sidebar state:', error);
    }
}

function sectionColumn(section) {
    return section.column === 1 ? 1 : 0;
}

function ensureSectionColumns() {
    const byCategory = new Map();
    sections.forEach(section => {
        if (!byCategory.has(section.categoryId)) byCategory.set(section.categoryId, []);
        byCategory.get(section.categoryId).push(section);
    });

    let changed = false;
    byCategory.forEach(list => {
        if (!list.some(section => section.column !== 0 && section.column !== 1)) return;
        list.sort((a, b) => a.order - b.order);
        list.forEach((section, index) => {
            section.column = index % 2;
            section.order = Math.floor(index / 2);
            changed = true;
        });
    });
    return changed;
}

function ensureUncategorizedColumns() {
    let changed = false;
    const categoryIds = new Set(bookmarks.filter(bookmark => !bookmark.sectionId).map(bookmark => bookmark.categoryId));
    categoryIds.forEach(categoryId => {
        if (uncategorizedColumns[categoryId] === 0 || uncategorizedColumns[categoryId] === 1) return;
        const count = sections.filter(section => section.categoryId === categoryId).length;
        uncategorizedColumns[categoryId] = count % 2 === 1 ? 1 : 0;
        changed = true;
    });
    return changed;
}

function preferredColumnForNewSection(categoryId) {
    const siblings = sections.filter(section => section.categoryId === categoryId);
    const right = siblings.filter(section => section.column === 1).length;
    const left = siblings.length - right;
    return right > left ? 1 : 0;
}

function createColumnPlaceholder() {
    const hint = document.createElement('p');
    hint.className = 'column-placeholder';
    hint.textContent = 'Drop a section here';
    return hint;
}

// Load data from IndexedDB
async function loadDataFromIndexedDB() {
    try {
        // Load categories, sections, and bookmarks. Seed a starter workspace only on a fresh install.
        let loadedCategories = await SaveItDB.getAll(STORES.CATEGORIES);
        let loadedSections = await SaveItDB.getAll(STORES.SECTIONS);
        let loadedBookmarks = await SaveItDB.getAll(STORES.BOOKMARKS);

        if (loadedCategories.length === 0 && loadedSections.length === 0 && loadedBookmarks.length === 0) {
            loadedCategories = [
                { id: 'category-projects', name: 'Projects', order: 0 },
                { id: 'category-reference', name: 'Reference', order: 1 }
            ];
            loadedSections = [
                { id: 'section-products', categoryId: 'category-projects', name: 'Products', order: 0, column: 0 },
                { id: 'section-profiles', categoryId: 'category-projects', name: 'Profiles', order: 0, column: 1 },
                { id: 'section-docs', categoryId: 'category-reference', name: 'Docs', order: 0, column: 0 },
                { id: 'section-everyday', categoryId: 'category-reference', name: 'Everyday', order: 0, column: 1 }
            ];
            loadedBookmarks = [
                { id: 'bookmark-rungset', categoryId: 'category-projects', sectionId: 'section-products', title: 'RunGset', url: 'https://rungset.com', order: 0 },
                { id: 'bookmark-soultware', categoryId: 'category-projects', sectionId: 'section-products', title: 'Soultware', url: 'https://soultware.com', order: 1 },
                { id: 'bookmark-github', categoryId: 'category-projects', sectionId: 'section-profiles', title: 'GitHub', url: 'https://github.com/ismailco', order: 0 },
                { id: 'bookmark-linkedin', categoryId: 'category-projects', sectionId: 'section-profiles', title: 'LinkedIn', url: 'https://www.linkedin.com/in/ismailcourr', order: 1 },
                { id: 'bookmark-portfolio', categoryId: 'category-projects', sectionId: 'section-profiles', title: 'Portfolio', url: 'https://ismailcourr.dev', order: 2 },
                { id: 'bookmark-mdn', categoryId: 'category-reference', sectionId: 'section-docs', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', order: 0 },
                { id: 'bookmark-stackoverflow', categoryId: 'category-reference', sectionId: 'section-docs', title: 'Stack Overflow', url: 'https://stackoverflow.com', order: 1 },
                { id: 'bookmark-google', categoryId: 'category-reference', sectionId: 'section-everyday', title: 'Google', url: 'https://www.google.com', order: 0 }
            ];
            await Promise.all([
                ...loadedCategories.map(category => SaveItDB.add(STORES.CATEGORIES, category)),
                ...loadedSections.map(section => SaveItDB.add(STORES.SECTIONS, section)),
                ...loadedBookmarks.map(bookmark => SaveItDB.add(STORES.BOOKMARKS, bookmark))
            ]);
        }

        categories = loadedCategories;
        sections = loadedSections;
        bookmarks = loadedBookmarks;

        // Ensure each item has an order property
        categories.forEach((category, index) => {
            if (category.order === undefined) {
                category.order = index;
            }
        });

        sections.forEach((section, index) => {
            if (section.order === undefined) {
                section.order = index;
            }
        });

        bookmarks.forEach((bookmark, index) => {
            if (bookmark.order === undefined) {
                bookmark.order = index;
            }
        });

        // Sort categories, sections, and bookmarks by order
        categories.sort((a, b) => a.order - b.order);
        sections.sort((a, b) => a.order - b.order);
        bookmarks.sort((a, b) => a.order - b.order);

        const sectionsChanged = ensureSectionColumns();

        await Promise.all([
            saveCategoriestoIndexedDB(),
            sectionsChanged ? saveSectionsToIndexedDB() : Promise.resolve(),
            saveBookmarksToIndexedDB()
        ]);

    } catch (error) {
        console.error('Error loading data from IndexedDB:', error);
        throw error;
    }
}

// Save categories to IndexedDB
async function saveCategoriestoIndexedDB() {
    try {
        await Promise.all(categories.map(category => SaveItDB.put(STORES.CATEGORIES, category)));
    } catch (error) {
        console.error('Error saving categories:', error);
        throw error;
    }
}

// Save sections to IndexedDB
async function saveSectionsToIndexedDB() {
    try {
        await Promise.all(sections.map(section => SaveItDB.put(STORES.SECTIONS, section)));
    } catch (error) {
        console.error('Error saving sections:', error);
        throw error;
    }
}

// Save bookmarks to IndexedDB
async function saveBookmarksToIndexedDB() {
    try {
        await Promise.all(bookmarks.map(bookmark => SaveItDB.put(STORES.BOOKMARKS, bookmark)));
    } catch (error) {
        console.error('Error saving bookmarks:', error);
        throw error;
    }
}

// Save collapsed sections state
async function saveCollapsedSectionsToIndexedDB() {
    try {
        await SaveItDB.putSetting('collapsedSections', collapsedSections);
    } catch (error) {
        console.error('Error saving collapsed sections:', error);
    }
}

// Get favicon URL for a domain
function getFaviconUrl(url) {
    try {
        const domain = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    } catch (e) {
        return null;
    }
}

function safeHttpUrl(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
        return parsed;
    } catch (e) {
        return null;
    }
}

function displayHost(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname) return parsed.hostname.replace(/^www\./, '');
        return parsed.protocol.replace(':', '');
    } catch (e) {
        return '';
    }
}

function isOwnNewTab(url) {
    if (!url) return true;
    if (url.startsWith('chrome://newtab') || url.startsWith('edge://newtab') || url.startsWith('about:newtab')) {
        return true;
    }
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'chrome-extension:' && parsed.pathname.endsWith('/newtab.html');
    } catch (e) {
        return false;
    }
}

function canReadTabs() {
    return typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.query === 'function';
}

function getSearchQuery() {
    return bookmarkSearchInput ? bookmarkSearchInput.value.trim().toLowerCase() : '';
}

function bookmarkMatches(bookmark, query) {
    if (!query) return true;
    return `${bookmark.title || ''} ${bookmark.url || ''}`.toLowerCase().includes(query);
}

function getColumnCount() {
    const width = bookmarksList && bookmarksList.clientWidth
        ? bookmarksList.clientWidth
        : window.innerWidth;
    return width >= 880 ? 2 : 1;
}

function plural(count, singular, pluralLabel) {
    return `${count} ${count === 1 ? singular : pluralLabel}`;
}

function renderToday() {
    const el = document.getElementById('today-label');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
}

function setDocumentTitle(name) {
    document.title = name ? `${name} · SaveIt` : 'SaveIt';
}

function createEmptyState(title, copy) {
    const wrap = document.createElement('div');
    wrap.className = 'empty-state';
    const heading = document.createElement('p');
    heading.className = 'empty-title';
    heading.textContent = title;
    const text = document.createElement('p');
    text.className = 'empty-copy';
    text.textContent = copy;
    wrap.append(heading, text);
    return wrap;
}

function updateSummaries() {
    const categoriesSummary = document.getElementById('categories-summary');
    if (categoriesSummary) {
        categoriesSummary.textContent = String(categories.length);
        categoriesSummary.setAttribute('aria-label', plural(categories.length, 'category', 'categories'));
    }

    const categorySummary = document.getElementById('category-summary');
    if (categorySummary) {
        if (!currentCategoryId) {
            categorySummary.textContent = 'Choose a category';
        } else {
            const query = getSearchQuery();
            const inCategory = bookmarks.filter(bookmark => bookmark.categoryId === currentCategoryId);
            const sectionCount = sections.filter(section => section.categoryId === currentCategoryId).length;
            if (query) {
                const matched = inCategory.filter(bookmark => bookmarkMatches(bookmark, query)).length;
                categorySummary.textContent = plural(matched, 'match', 'matches');
            } else {
                categorySummary.textContent = `${plural(inCategory.length, 'bookmark', 'bookmarks')} · ${plural(sectionCount, 'section', 'sections')}`;
            }
        }
    }

    const tabsSummary = document.getElementById('tabs-summary');
    if (tabsSummary) {
        if (!tabsAccess) {
            tabsSummary.textContent = 'Available in Chrome';
        } else {
            const count = openTabs.filter(tab => !isOwnNewTab(tab.url)).length;
            tabsSummary.textContent = count === 0 ? 'Nothing else open' : plural(count, 'tab', 'tabs');
        }
    }

    const searchStatus = document.getElementById('search-status');
    if (searchStatus) {
        const query = getSearchQuery();
        if (!query || !currentCategoryId) {
            searchStatus.textContent = '';
        } else {
            const matched = bookmarks.filter(bookmark => bookmark.categoryId === currentCategoryId && bookmarkMatches(bookmark, query)).length;
            const term = bookmarkSearchInput.value.trim();
            searchStatus.textContent = matched === 1
                ? `1 bookmark matches ${term}`
                : `${matched} bookmarks match ${term}`;
        }
    }

    document.querySelectorAll('.category-item').forEach(item => {
        const count = bookmarks.filter(bookmark => bookmark.categoryId === item.dataset.id).length;
        const badge = item.querySelector('.category-count');
        const hidden = item.querySelector('.category-select .sr-only');
        if (badge) badge.textContent = String(count);
        if (hidden) hidden.textContent = `, ${plural(count, 'bookmark', 'bookmarks')}`;
    });

    if (bookmarkSearchInput) {
        bookmarkSearchInput.disabled = !currentCategoryId;
        if (!currentCategoryId) bookmarkSearchInput.value = '';
    }
    if (clearSearchBtn && bookmarkSearchInput) {
        clearSearchBtn.hidden = bookmarkSearchInput.value.length === 0;
    }
}

function openModal(modal) {
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (appRoot) appRoot.inert = true;
    const field = modal.querySelector('input, select, textarea');
    (field || modal.querySelector('button'))?.focus();
}

function closeModal(modal) {
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    const anyOpen = [...document.querySelectorAll('.modal')].some(item => item.style.display === 'flex');
    if (!anyOpen) {
        document.body.classList.remove('modal-open');
        if (appRoot) appRoot.inert = false;
    }
    if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
    }
}

function revealActiveCategory() {
    const active = categoriesList.querySelector('.category-item.active');
    if (!active) return;
    const top = active.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < categoriesList.scrollTop || bottom > categoriesList.scrollTop + categoriesList.clientHeight) {
        categoriesList.scrollTop = Math.max(0, top - 8);
    }
}

function getTodaySectionName() {
    return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function saveAllOpenTabs() {
    if (!currentCategoryId) {
        alert('Please select a category first before saving open tabs.');
        return;
    }

    if (!openTabs || openTabs.length === 0) {
        alert('No open tabs found.');
        return;
    }

    const filteredTabs = openTabs.filter(tab => !isOwnNewTab(tab.url));
    if (filteredTabs.length === 0) {
        alert('No open tabs found.');
        return;
    }

    const sectionName = getTodaySectionName();
    let targetSection = sections.find(
        section => section.categoryId === currentCategoryId && section.name === sectionName
    );

    if (!targetSection) {
        await addSection(sectionName);
        targetSection = sections.find(
            section => section.categoryId === currentCategoryId && section.name === sectionName
        );
    }

    if (!targetSection) {
        alert('Error creating section for today. Please try again.');
        return;
    }

    const originalDisabled = saveAllBtn ? saveAllBtn.disabled : false;
    const saveAllLabel = saveAllBtn ? saveAllBtn.querySelector('.btn-label') : null;
    if (saveAllBtn) {
        saveAllBtn.disabled = true;
    }
    if (saveAllLabel) saveAllLabel.textContent = 'Saving…';

    try {
        for (const tab of filteredTabs) {
            await addBookmark(tab.title, tab.url, targetSection.id);
        }
    } finally {
        if (saveAllLabel) saveAllLabel.textContent = 'Save all';
        if (saveAllBtn) {
            saveAllBtn.disabled = originalDisabled;
        }
    }
}

// Load open tabs using Chrome API
function loadOpenTabs() {
    openTabsList.setAttribute('aria-busy', 'true');
    openTabsList.replaceChildren(loadingTabs);

    if (!canReadTabs()) {
        tabsAccess = false;
        openTabs = [];
        renderOpenTabs();
        return;
    }

    tabsAccess = true;
    chrome.tabs.query({}, function(tabs) {
        if (chrome.runtime.lastError) {
            console.error('Error reading open tabs:', chrome.runtime.lastError.message);
            openTabs = [];
        } else {
            openTabs = tabs || [];
        }
        renderOpenTabs();
    });
}

function activateOpenTab(tab) {
    if (!tab || tab.id === undefined) {
        return;
    }

    chrome.tabs.update(tab.id, { active: true }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error activating tab:', chrome.runtime.lastError.message);
            return;
        }

        if (tab.windowId !== undefined && chrome.windows && chrome.windows.update) {
            chrome.windows.update(tab.windowId, { focused: true }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error focusing tab window:', chrome.runtime.lastError.message);
                }
            });
        }
    });
}

// Render categories in the sidebar
function renderCategories() {
    categoriesList.innerHTML = '';

    // Sort categories by order
    categories.sort((a, b) => a.order - b.order);

    if (categories.length === 0) {
        categoriesList.appendChild(createEmptyState('No categories', 'Create one to start saving bookmarks.'));
        updateSummaries();
        return;
    }

    categories.forEach(category => {
        const count = bookmarks.filter(bookmark => bookmark.categoryId === category.id).length;
        const categoryItem = document.createElement('div');
        categoryItem.className = `category-item ${category.id === currentCategoryId ? 'active' : ''}`;
        categoryItem.dataset.id = category.id;
        categoryItem.draggable = true;
        categoryItem.setAttribute('role', 'listitem');
        if (category.id === currentCategoryId) {
            categoryItem.setAttribute('aria-current', 'true');
        }

        categoryItem.innerHTML = `
            <span class="drag-handle" title="Drag to reorder" aria-hidden="true">${ICON.grip}</span>
            <button type="button" class="category-select">
                <span class="category-name"></span>
                <span class="sr-only"></span>
            </button>
            <span class="category-count" aria-hidden="true"></span>
            <button type="button" class="icon-btn category-delete" aria-label="">${ICON.close}</button>
        `;
        categoryItem.querySelector('.category-name').textContent = category.name;
        categoryItem.querySelector('.sr-only').textContent = `, ${plural(count, 'bookmark', 'bookmarks')}`;
        categoryItem.querySelector('.category-count').textContent = String(count);
        const deleteBtn = categoryItem.querySelector('.category-delete');
        deleteBtn.dataset.id = category.id;
        deleteBtn.setAttribute('aria-label', `Delete category ${category.name}`);

        categoriesList.appendChild(categoryItem);
    });

    // Add event listeners to category items and delete buttons
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.category-delete') || e.target.closest('.drag-handle')) return;
            selectCategory(item.dataset.id);
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

    updateSummaries();
    revealActiveCategory();
}

// Render bookmarks for the selected category
function renderBookmarks() {
    const preserveScroll = bookmarkScrollCategory === currentCategoryId;
    const scrollTop = preserveScroll ? bookmarksList.scrollTop : 0;
    bookmarkScrollCategory = currentCategoryId;
    bookmarksList.innerHTML = '';
    bookmarksList.classList.toggle('single-column', getColumnCount() === 1);

    if (!currentCategoryId) {
        bookmarksList.appendChild(noCategorySelected);
        updateSummaries();
        return;
    }

    const query = getSearchQuery();
    const categoryBookmarks = bookmarks.filter(bookmark => bookmark.categoryId === currentCategoryId);
    const categorySections = sections.filter(section => section.categoryId === currentCategoryId)
        .sort((a, b) => a.order - b.order);

    const bookmarksBySection = {};
    const defaultBookmarks = [];

    categoryBookmarks.forEach(bookmark => {
        if (!bookmark.sectionId) {
            defaultBookmarks.push(bookmark);
        } else {
            if (!bookmarksBySection[bookmark.sectionId]) {
                bookmarksBySection[bookmark.sectionId] = [];
            }
            bookmarksBySection[bookmark.sectionId].push(bookmark);
        }
    });

    const visibleSections = categorySections.filter(section => {
        if (!query) return true;
        if (section.name.toLowerCase().includes(query)) return true;
        return (bookmarksBySection[section.id] || []).some(bookmark => bookmarkMatches(bookmark, query));
    });
    const visibleDefaults = query
        ? defaultBookmarks.filter(bookmark => bookmarkMatches(bookmark, query))
        : defaultBookmarks;

    if (visibleSections.length === 0 && visibleDefaults.length === 0) {
        if (query) {
            bookmarksList.appendChild(createEmptyState(
                'No matches',
                `Nothing in this category matches “${bookmarkSearchInput.value.trim()}”.`
            ));
        } else {
            bookmarksList.appendChild(createEmptyState(
                'Nothing saved here yet',
                'Add a bookmark, or drag an open tab into this category.'
            ));
        }
        updateSummaries();
        return;
    }

    const bookmarkColumns = createBookmarkColumns();
    const columnCount = bookmarkColumns.length;

    const appendSection = (column, section) => {
        let sectionBookmarks = (bookmarksBySection[section.id] || []).slice();
        if (query && !section.name.toLowerCase().includes(query)) {
            sectionBookmarks = sectionBookmarks.filter(bookmark => bookmarkMatches(bookmark, query));
        }
        column.appendChild(createSectionElement(section, sectionBookmarks));
    };

    if (columnCount === 1) {
        visibleSections
            .slice()
            .sort((a, b) => sectionColumn(a) - sectionColumn(b) || a.order - b.order)
            .forEach(section => appendSection(bookmarkColumns[0], section));
    } else {
        for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
            visibleSections
                .filter(section => sectionColumn(section) === columnIndex)
                .sort((a, b) => a.order - b.order)
                .forEach(section => appendSection(bookmarkColumns[columnIndex], section));
        }
    }

    if (visibleDefaults.length > 0) {
        const defaultSectionDiv = document.createElement('div');
        defaultSectionDiv.className = 'default-section';

        const defaultSectionTitle = document.createElement('div');
        defaultSectionTitle.className = 'default-section-title';

        const defaultLabel = document.createElement('span');
        defaultLabel.className = 'section-name';
        defaultLabel.textContent = 'Uncategorized';

        const defaultCount = document.createElement('span');
        defaultCount.className = 'section-count';
        defaultCount.textContent = String(visibleDefaults.length);

        defaultSectionTitle.append(defaultLabel, defaultCount);
        defaultSectionDiv.appendChild(defaultSectionTitle);

        visibleDefaults.sort((a, b) => a.order - b.order);

        const bookmarksContainer = document.createElement('div');
        bookmarksContainer.className = 'section-bookmarks';
        const rowColumns = normalizeRowColumns(uncategorizedRowColumns[currentCategoryId]);
        bookmarksContainer.dataset.columns = String(rowColumns);
        defaultSectionTitle.appendChild(createRowColumnPicker(rowColumns, 'Uncategorized', async (next) => {
            uncategorizedRowColumns[currentCategoryId] = next;
            bookmarksContainer.dataset.columns = String(next);
            await SaveItDB.putSetting('uncategorizedRowColumns', uncategorizedRowColumns);
        }));

        visibleDefaults.forEach(bookmark => {
            bookmarksContainer.appendChild(createBookmarkElement(bookmark));
        });

        defaultSectionDiv.appendChild(bookmarksContainer);
        const storedColumn = uncategorizedColumns[currentCategoryId] === 1 ? 1 : 0;
        const defaultColumn = columnCount === 1 ? 0 : storedColumn;
        bookmarkColumns[defaultColumn].appendChild(defaultSectionDiv);
    }

    if (!query && columnCount > 1) {
        bookmarkColumns.forEach(column => {
            if (!column.querySelector('.bookmark-section, .default-section')) {
                column.appendChild(createColumnPlaceholder());
            }
        });
    }

    bookmarksList.scrollTop = scrollTop;
    updateSummaries();
}

function createBookmarkColumns() {
    const count = getColumnCount();
    bookmarksList.classList.toggle('single-column', count === 1);
    const columns = [];

    for (let index = 0; index < count; index++) {
        const column = document.createElement('div');
        column.className = 'bookmark-column';
        bookmarksList.appendChild(column);
        columns.push(column);
    }

    return columns;
}

// Create a section element
function normalizeRowColumns(value) {
    return value === 2 || value === 3 ? value : 1;
}

function createRowColumnPicker(current, label, onChange) {
    const group = document.createElement('div');
    group.className = 'row-columns';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', `Bookmarks per row in ${label}`);

    [1, 2, 3].forEach(count => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'row-column-btn';
        button.textContent = String(count);
        button.title = count === 1 ? 'One bookmark per row' : `${count} bookmarks per row`;
        button.setAttribute('aria-label', `Show ${count} bookmark${count === 1 ? '' : 's'} per row`);
        button.setAttribute('aria-pressed', String(count === current));
        button.addEventListener('mousedown', (event) => event.stopPropagation());
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (button.getAttribute('aria-pressed') === 'true') return;
            group.querySelectorAll('.row-column-btn').forEach(item => {
                item.setAttribute('aria-pressed', String(item === button));
            });
            await onChange(count);
        });
        group.appendChild(button);
    });

    return group;
}

function createSectionElement(section, sectionBookmarks) {
    const searching = Boolean(getSearchQuery());
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'bookmark-section';
    sectionDiv.dataset.id = section.id;
    sectionDiv.draggable = !searching;
    if (searching) sectionDiv.dataset.frozen = 'true';
    sectionDiv.setAttribute('role', 'group');
    sectionDiv.setAttribute('aria-label', section.name);

    const titleBar = document.createElement('div');
    titleBar.className = `section-title-bar ${collapsedSections[section.id] ? 'collapsed' : ''}`;

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = ICON.grip;
    dragHandle.title = searching ? 'Clear search to reorder' : 'Drag to reorder';
    dragHandle.setAttribute('aria-hidden', 'true');

    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.className = 'section-collapse';
    collapseBtn.setAttribute('aria-expanded', collapsedSections[section.id] ? 'false' : 'true');

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'section-toggle';
    toggleIcon.innerHTML = ICON.chevron;

    const nameEl = document.createElement('span');
    nameEl.className = 'section-name';
    nameEl.textContent = section.name;

    const countEl = document.createElement('span');
    countEl.className = 'section-count';
    countEl.textContent = String(sectionBookmarks.length);

    collapseBtn.append(toggleIcon, nameEl, countEl);

    const sectionActions = document.createElement('div');
    sectionActions.className = 'section-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn section-edit';
    editBtn.innerHTML = ICON.pencil;
    editBtn.setAttribute('aria-label', `Rename section ${section.name}`);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn section-delete';
    deleteBtn.innerHTML = ICON.close;
    deleteBtn.dataset.id = section.id;
    deleteBtn.setAttribute('aria-label', `Delete section ${section.name} and its bookmarks`);
    deleteBtn.title = 'Delete this section and its bookmarks';

    const bookmarksContainer = document.createElement('div');
    bookmarksContainer.className = 'section-bookmarks';
    const rowColumns = normalizeRowColumns(section.bookmarkColumns);
    bookmarksContainer.dataset.columns = String(rowColumns);
    const rowPicker = createRowColumnPicker(rowColumns, section.name, async (next) => {
        section.bookmarkColumns = next;
        bookmarksContainer.dataset.columns = String(next);
        await SaveItDB.put(STORES.SECTIONS, section);
    });

    sectionActions.append(rowPicker, editBtn, deleteBtn);
    titleBar.append(dragHandle, collapseBtn, sectionActions);
    sectionDiv.appendChild(titleBar);

    const sectionContent = document.createElement('div');
    sectionContent.className = `section-content ${collapsedSections[section.id] ? 'collapsed' : ''}`;
    sectionContent.id = `section-panel-${section.id}`;
    sectionContent.inert = Boolean(collapsedSections[section.id]);
    collapseBtn.setAttribute('aria-controls', sectionContent.id);

    if (sectionBookmarks.length > 0) {
        sectionBookmarks.sort((a, b) => a.order - b.order);
        sectionBookmarks.forEach(bookmark => {
            bookmarksContainer.appendChild(createBookmarkElement(bookmark));
        });
    } else {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-section-message';
        emptyMessage.textContent = 'Drop a tab here, or add a bookmark.';
        bookmarksContainer.appendChild(emptyMessage);
    }

    sectionContent.appendChild(bookmarksContainer);
    sectionDiv.appendChild(sectionContent);

    collapseBtn.addEventListener('click', async () => {
        const collapsed = !sectionContent.classList.contains('collapsed');
        titleBar.classList.toggle('collapsed', collapsed);
        sectionContent.classList.toggle('collapsed', collapsed);
        sectionContent.inert = collapsed;
        collapseBtn.setAttribute('aria-expanded', String(!collapsed));

        if (collapsed) {
            collapsedSections[section.id] = true;
        } else {
            delete collapsedSections[section.id];
        }

        await saveCollapsedSectionsToIndexedDB();
    });

    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editSection(section.id);
    });

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSection(section.id);
    });

    sectionDiv.addEventListener('dragstart', (e) => {
        if (searching || e.target.closest('.bookmark-item, .row-columns')) return;
        draggedItem = sectionDiv;
        draggedItemType = 'section';
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', section.id);
        }
        setTimeout(() => {
            sectionDiv.classList.add('dragging');
        }, 0);
    });

    sectionDiv.addEventListener('dragend', () => {
        sectionDiv.classList.remove('dragging');

        if (draggedItemType === 'section' && !getSearchQuery()) {
            persistSectionLayout();
        }

        draggedItem = null;
        draggedItemType = null;
    });

    return sectionDiv;
}

// Create a bookmark element
function createBookmarkElement(bookmark) {
    const searching = Boolean(getSearchQuery());
    const title = bookmark.title || 'Untitled';
    const parsed = safeHttpUrl(bookmark.url);
    const bookmarkItem = document.createElement('div');
    bookmarkItem.className = 'bookmark-item';
    bookmarkItem.dataset.id = bookmark.id;
    bookmarkItem.draggable = !searching;
    if (searching) bookmarkItem.dataset.frozen = 'true';

    const handle = document.createElement('span');
    handle.className = 'drag-handle bookmark-drag-handle';
    handle.innerHTML = ICON.grip;
    handle.title = searching ? 'Clear search to reorder' : 'Drag to reorder';
    handle.setAttribute('aria-hidden', 'true');

    const main = document.createElement(parsed ? 'a' : 'div');
    main.className = 'bookmark-link';
    if (parsed) {
        main.href = parsed.href;
        main.target = '_blank';
        main.rel = 'noopener noreferrer';
        main.draggable = false;
    }

    const iconWrap = document.createElement('span');
    iconWrap.className = 'favicon-wrap';
    const faviconUrl = parsed ? getFaviconUrl(parsed.href) : null;
    if (faviconUrl) {
        const img = document.createElement('img');
        img.className = 'bookmark-favicon';
        img.alt = '';
        img.decoding = 'async';
        img.src = faviconUrl;
        img.addEventListener('error', () => {
            iconWrap.replaceChildren();
            iconWrap.textContent = title.charAt(0).toUpperCase() || '•';
            iconWrap.classList.add('favicon-letter');
        });
        iconWrap.appendChild(img);
    } else {
        iconWrap.textContent = title.charAt(0).toUpperCase() || '•';
        iconWrap.classList.add('favicon-letter');
    }

    const text = document.createElement('span');
    text.className = 'bookmark-text';
    const titleEl = document.createElement('span');
    titleEl.className = 'bookmark-title';
    titleEl.textContent = title;
    const domainEl = document.createElement('span');
    domainEl.className = 'bookmark-domain';
    domainEl.textContent = parsed ? parsed.hostname.replace(/^www\./, '') : (bookmark.url || 'Invalid link');
    text.append(titleEl, domainEl);
    main.append(iconWrap, text);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn bookmark-delete';
    deleteBtn.dataset.id = bookmark.id;
    deleteBtn.setAttribute('aria-label', `Delete ${title}`);
    deleteBtn.innerHTML = ICON.close;

    bookmarkItem.append(handle, main, deleteBtn);

    bookmarkItem.addEventListener('dragstart', (e) => {
        if (searching) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        draggedItem = bookmarkItem;
        draggedItemType = 'bookmark';
        bookmarkItem.dataset.originalSectionId = bookmark.sectionId || '';
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', bookmark.id);
        }
        setTimeout(() => {
            bookmarkItem.classList.add('dragging');
        }, 0);
    });

    bookmarkItem.addEventListener('dragend', () => {
        bookmarkItem.classList.remove('dragging');
        draggedItem = null;
        draggedItemType = null;
    });

    return bookmarkItem;
}

// Helper function optimized for horizontal flex wrap layout
function getDragAfterElementHorizontal(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.bookmark-item:not(.dragging)')];
    if (draggableElements.length === 0) return null;

    return draggableElements.find(child => {
        const box = child.getBoundingClientRect();
        if (y < box.top) return true;
        const onRow = y >= box.top && y <= box.bottom;
        if (onRow) return x < box.left + box.width / 2;
        return false;
    }) || null;
}

// Select a category
async function selectCategory(categoryId) {
    // Update current category
    currentCategoryId = categoryId;
    await SaveItDB.putSetting('selectedCategory', categoryId);

    // Update UI
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    currentCategoryHeading.textContent = selectedCategory.name;
    currentCategoryHeading.title = selectedCategory.name;
    setDocumentTitle(selectedCategory.name);

    // Highlight the selected category
    document.querySelectorAll('.category-item').forEach(item => {
        const active = item.dataset.id === categoryId;
        item.classList.toggle('active', active);
        if (active) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
    });

    // Enable add buttons
    addBookmarkBtn.disabled = false;
    addSectionBtn.disabled = false;
    if (saveAllBtn) {
        saveAllBtn.disabled = false;
    }

    // Render bookmarks for the selected category
    renderBookmarks();
}

// Delete a category
async function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category and all its bookmarks?')) {
        try {
            // Remove the category from IndexedDB
            await SaveItDB.delete(STORES.CATEGORIES, categoryId);
            categories = categories.filter(category => category.id !== categoryId);

            // Remove all bookmarks in this category from IndexedDB
            const categoryBookmarks = bookmarks.filter(bookmark => bookmark.categoryId === categoryId);
            await Promise.all(categoryBookmarks.map(bookmark =>
                SaveItDB.delete(STORES.BOOKMARKS, bookmark.id)
            ));
            bookmarks = bookmarks.filter(bookmark => bookmark.categoryId !== categoryId);

            // Remove all sections in this category from IndexedDB
            const categorySections = sections.filter(section => section.categoryId === categoryId);
            await Promise.all(categorySections.map(section =>
                SaveItDB.delete(STORES.SECTIONS, section.id)
            ));
            sections = sections.filter(section => section.categoryId !== categoryId);

            // Reset current category if it was deleted
            if (currentCategoryId === categoryId) {
                currentCategoryId = null;
                await SaveItDB.delete(STORES.SETTINGS, 'selectedCategory');
                currentCategoryHeading.textContent = 'Select a category';
                currentCategoryHeading.title = '';
                setDocumentTitle('');
                addBookmarkBtn.disabled = true;
                addSectionBtn.disabled = true;
                if (saveAllBtn) {
                    saveAllBtn.disabled = true;
                }
            }

            renderCategories();
            renderBookmarks();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert('Error deleting category. Please try again.');
        }
    }
}

// Delete a bookmark
async function deleteBookmark(bookmarkId) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
        try {
            await SaveItDB.delete(STORES.BOOKMARKS, bookmarkId);
            bookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
            renderBookmarks();
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            alert('Error deleting bookmark. Please try again.');
        }
    }
}

// Add a new category
async function addCategory(name) {
    try {
        // Find the highest order value and add 1
        const maxOrder = categories.length > 0
            ? Math.max(...categories.map(cat => cat.order))
            : -1;

        const newCategory = {
            id: 'category-' + Date.now(),
            name: name,
            order: maxOrder + 1
        };

        await SaveItDB.add(STORES.CATEGORIES, newCategory);
        categories.push(newCategory);
        renderCategories();

        // Select the new category
        selectCategory(newCategory.id);
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category. Please try again.');
    }
}

// Add a new section
async function addSection(name) {
    try {
        const id = `section-${Date.now()}`;
        const column = preferredColumnForNewSection(currentCategoryId);
        const newSection = {
            id,
            categoryId: currentCategoryId,
            name,
            column,
            order: sections.filter(section => section.categoryId === currentCategoryId && sectionColumn(section) === column).length
        };

        await SaveItDB.add(STORES.SECTIONS, newSection);
        sections.push(newSection);
        renderBookmarks();
    } catch (error) {
        console.error('Error adding section:', error);
        alert('Error adding section. Please try again.');
    }
}

function editSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section || !renameSectionInput) return;

    renamingSectionId = sectionId;
    renameSectionInput.value = section.name;
    openModal(renameSectionModal);
    renameSectionInput.select();
}

// Delete a section
async function deleteSection(sectionId) {
    const section = sections.find(item => item.id === sectionId);
    if (!section) return;

    const count = bookmarks.filter(bookmark => bookmark.sectionId === sectionId).length;
    const detail = count === 0
        ? 'All bookmarks in this section will be deleted. They will not be kept under Uncategorized.'
        : `All ${count === 1 ? '1 bookmark' : `${count} bookmarks`} in this section will be deleted. They will not be kept under Uncategorized.`;
    const confirmed = confirm(`Remove “${section.name}”? ${detail}`);
    if (!confirmed) return;

    try {
        const sectionBookmarks = bookmarks.filter(bookmark => bookmark.sectionId === sectionId);
        await Promise.all(sectionBookmarks.map(bookmark => SaveItDB.delete(STORES.BOOKMARKS, bookmark.id)));
        bookmarks = bookmarks.filter(bookmark => bookmark.sectionId !== sectionId);

        await SaveItDB.delete(STORES.SECTIONS, sectionId);
        sections = sections.filter(item => item.id !== sectionId);

        if (collapsedSections[sectionId]) {
            delete collapsedSections[sectionId];
            await saveCollapsedSectionsToIndexedDB();
        }

        renderCategories();
        renderBookmarks();
    } catch (error) {
        console.error('Error deleting section:', error);
        alert('Error deleting section. Please try again.');
    }
}

// Add a new bookmark
async function addBookmark(title, url, sectionId = null) {
    if (!currentCategoryId) return;

    try {
        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        const id = `bookmark-${Date.now()}-${bookmarkIdNonce++}`;
        const newBookmark = {
            id,
            categoryId: currentCategoryId,
            sectionId,
            title,
            url,
            order: bookmarks.filter(bookmark =>
                bookmark.categoryId === currentCategoryId &&
                bookmark.sectionId === sectionId
            ).length
        };

        await SaveItDB.add(STORES.BOOKMARKS, newBookmark);
        bookmarks.push(newBookmark);
        renderBookmarks();

        // Show visual feedback by highlighting the newly added bookmark
        setTimeout(() => {
            const bookmarkItem = document.querySelector(`.bookmark-item[data-id="${id}"]`);
            if (bookmarkItem) {
                bookmarkItem.classList.add('bookmark-added');
                // Scroll the section to show the new bookmark if needed
                const section = bookmarkItem.closest('.section-bookmarks');
                if (section) {
                    section.scrollTop = section.scrollHeight;
                }
                setTimeout(() => {
                    bookmarkItem.classList.remove('bookmark-added');
                }, 1500);
            }
        }, 100);
    } catch (error) {
        console.error('Error adding bookmark:', error);
        alert('Error adding bookmark. Please try again.');
    }
}

// Setup event listeners
function isTypingTarget(element) {
    if (!element) return false;
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

function normalizeBackup(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('This file is not a SaveIt backup.');
    }

    const categoriesIn = data.categories;
    const sectionsIn = data.sections;
    const bookmarksIn = data.bookmarks;
    const settingsIn = data.settings || [];
    if (!Array.isArray(categoriesIn) || !Array.isArray(sectionsIn) || !Array.isArray(bookmarksIn) || !Array.isArray(settingsIn)) {
        throw new Error('This file is not a SaveIt backup.');
    }

    const categoryIds = new Set();
    const cleanCategories = categoriesIn.map((item, index) => {
        if (!item || typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name.trim()) {
            throw new Error('A category in this backup is invalid.');
        }
        categoryIds.add(item.id);
        return {
            id: item.id,
            name: item.name.trim().slice(0, 80),
            order: Number.isFinite(item.order) ? item.order : index
        };
    });

    const sectionIds = new Set();
    const cleanSections = sectionsIn.map((item, index) => {
        if (!item || typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name.trim() || !categoryIds.has(item.categoryId)) {
            throw new Error('A section in this backup is invalid.');
        }
        sectionIds.add(item.id);
        return {
            id: item.id,
            categoryId: item.categoryId,
            name: item.name.trim().slice(0, 80),
            order: Number.isFinite(item.order) ? item.order : index,
            column: item.column === 1 ? 1 : 0,
            bookmarkColumns: normalizeRowColumns(item.bookmarkColumns)
        };
    });

    const cleanBookmarks = bookmarksIn.map((item, index) => {
        if (!item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || typeof item.url !== 'string' || !categoryIds.has(item.categoryId)) {
            throw new Error('A bookmark in this backup is invalid.');
        }
        if (item.sectionId && !sectionIds.has(item.sectionId)) {
            throw new Error('A bookmark points at a section that is not in this backup.');
        }
        return {
            id: item.id,
            categoryId: item.categoryId,
            sectionId: item.sectionId || null,
            title: item.title.slice(0, 200) || 'Untitled',
            url: item.url,
            order: Number.isFinite(item.order) ? item.order : index
        };
    });

    const cleanSettings = [];
    settingsIn.forEach(item => {
        if (!item || typeof item.id !== 'string' || !item.id || !Object.prototype.hasOwnProperty.call(item, 'value')) return;
        if (item.id === '__proto__' || item.id === 'constructor' || item.id === 'prototype') return;
        cleanSettings.push({ id: item.id, value: item.value });
    });

    return {
        categories: cleanCategories,
        sections: cleanSections,
        bookmarks: cleanBookmarks,
        settings: cleanSettings
    };
}

async function exportData() {
    const payload = {
        app: 'SaveIt',
        version: 1,
        exportedAt: new Date().toISOString(),
        categories: await SaveItDB.getAll(STORES.CATEGORIES),
        sections: await SaveItDB.getAll(STORES.SECTIONS),
        bookmarks: await SaveItDB.getAll(STORES.BOOKMARKS),
        settings: await SaveItDB.getAll(STORES.SETTINGS)
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = payload.exportedAt.slice(0, 10);
    link.href = url;
    link.download = `saveit-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

async function applyImportedData(data) {
    await SaveItDB.clear(STORES.CATEGORIES);
    await SaveItDB.clear(STORES.SECTIONS);
    await SaveItDB.clear(STORES.BOOKMARKS);
    await SaveItDB.clear(STORES.SETTINGS);

    await Promise.all([
        ...data.categories.map(item => SaveItDB.add(STORES.CATEGORIES, item)),
        ...data.sections.map(item => SaveItDB.add(STORES.SECTIONS, item)),
        ...data.bookmarks.map(item => SaveItDB.add(STORES.BOOKMARKS, item)),
        ...data.settings.map(item => SaveItDB.put(STORES.SETTINGS, item))
    ]);

    categories = data.categories.slice().sort((a, b) => a.order - b.order);
    sections = data.sections.slice().sort((a, b) => a.order - b.order);
    bookmarks = data.bookmarks.slice().sort((a, b) => a.order - b.order);

    const settingMap = new Map(data.settings.map(item => [item.id, item.value]));
    collapsedSections = settingMap.get('collapsedSections') && typeof settingMap.get('collapsedSections') === 'object'
        ? settingMap.get('collapsedSections')
        : {};
    sidebarState = {
        categoriesCollapsed: false,
        tabsCollapsed: false,
        ...(settingMap.get('sidebarState') && typeof settingMap.get('sidebarState') === 'object' ? settingMap.get('sidebarState') : {})
    };
    uncategorizedColumns = settingMap.get('uncategorizedColumns') && typeof settingMap.get('uncategorizedColumns') === 'object'
        ? settingMap.get('uncategorizedColumns')
        : {};
    uncategorizedRowColumns = settingMap.get('uncategorizedRowColumns') && typeof settingMap.get('uncategorizedRowColumns') === 'object'
        ? settingMap.get('uncategorizedRowColumns')
        : {};

    applySidebarState();
    renderCategories();

    const selected = settingMap.get('selectedCategory');
    if (selected && categories.some(category => category.id === selected)) {
        await selectCategory(selected);
    } else if (categories.length > 0) {
        await selectCategory(categories[0].id);
    } else {
        currentCategoryId = null;
        currentCategoryHeading.textContent = 'Select a category';
        currentCategoryHeading.title = '';
        setDocumentTitle('');
        addBookmarkBtn.disabled = true;
        addSectionBtn.disabled = true;
        if (saveAllBtn) saveAllBtn.disabled = true;
        renderBookmarks();
    }
}

function customizeChrome() {
    const url = 'chrome://settings/appearance';
    if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
        chrome.tabs.create({ url }, () => {
            if (chrome.runtime.lastError) {
                alert('Open Chrome Settings, then Appearance, to customize Chrome.');
            }
        });
        return;
    }
    alert('Open Chrome Settings, then Appearance, to customize Chrome.');
}

async function setCurrentSectionsCollapsed(collapsed) {
    if (!currentCategoryId) return;
    sections
        .filter(section => section.categoryId === currentCategoryId)
        .forEach(section => {
            if (collapsed) collapsedSections[section.id] = true;
            else delete collapsedSections[section.id];
        });
    await saveCollapsedSectionsToIndexedDB();
    renderBookmarks();
}

function setupSettingsMenu() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsRoot = document.getElementById('settings-menu-root');
    const importInput = document.getElementById('import-file');
    if (!settingsBtn || !settingsMenu || !settingsRoot) return;

    const menuItems = () => [...settingsMenu.querySelectorAll('[role="menuitem"]')];

    const syncMenuState = () => {
        settingsMenu.querySelectorAll('[data-needs-category]').forEach(item => {
            item.disabled = !currentCategoryId;
        });
    };

    const closeSettingsMenu = (focusButton = false) => {
        settingsMenu.hidden = true;
        settingsBtn.setAttribute('aria-expanded', 'false');
        if (focusButton) settingsBtn.focus();
    };

    const openSettingsMenu = () => {
        syncMenuState();
        settingsMenu.hidden = false;
        settingsBtn.setAttribute('aria-expanded', 'true');
        const first = menuItems().find(item => !item.disabled);
        first?.focus();
    };

    settingsBtn.addEventListener('click', () => {
        if (settingsMenu.hidden) openSettingsMenu();
        else closeSettingsMenu();
    });

    settingsMenu.addEventListener('keydown', (e) => {
        const items = menuItems().filter(item => !item.disabled);
        const index = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[(index + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[(index - 1 + items.length) % items.length]?.focus();
        } else if (e.key === 'Home') {
            e.preventDefault();
            items[0]?.focus();
        } else if (e.key === 'End') {
            e.preventDefault();
            items[items.length - 1]?.focus();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            closeSettingsMenu(true);
        }
    });

    document.getElementById('export-data-btn')?.addEventListener('click', async () => {
        closeSettingsMenu();
        try {
            await exportData();
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Could not export your data. Please try again.');
        }
    });

    document.getElementById('import-data-btn')?.addEventListener('click', () => {
        closeSettingsMenu();
        importInput?.click();
    });

    importInput?.addEventListener('change', async () => {
        const file = importInput.files && importInput.files[0];
        importInput.value = '';
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            const data = normalizeBackup(parsed);
            const confirmed = confirm('Import this backup? It replaces the categories, sections, and bookmarks already saved in this browser.');
            if (!confirmed) return;
            await applyImportedData(data);
        } catch (error) {
            console.error('Error importing data:', error);
            alert(error && error.message ? error.message : 'Could not import that file.');
        }
    });

    document.getElementById('customize-chrome-btn')?.addEventListener('click', () => {
        closeSettingsMenu();
        customizeChrome();
    });

    document.getElementById('expand-sections-btn')?.addEventListener('click', () => {
        closeSettingsMenu();
        setCurrentSectionsCollapsed(false);
    });

    document.getElementById('collapse-sections-btn')?.addEventListener('click', () => {
        closeSettingsMenu();
        setCurrentSectionsCollapsed(true);
    });

    window.addEventListener('click', (e) => {
        if (!settingsRoot.contains(e.target)) closeSettingsMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !settingsMenu.hidden) {
            closeSettingsMenu(true);
        }
    }, true);
}

function setupEventListeners() {
    categoriesList.addEventListener('dragover', handleCategoriesDragOver);
    categoriesList.addEventListener('drop', handleCategoriesDrop);

    bookmarksList.addEventListener('click', handleBookmarksClick);
    bookmarksList.addEventListener('dragover', handleBookmarksDragOver);
    bookmarksList.addEventListener('dragleave', handleBookmarksDragLeave);
    bookmarksList.addEventListener('drop', handleBookmarksDrop);

    toggleCategoriesBtn.addEventListener('click', () => {
        sidebarState.categoriesCollapsed = !sidebarState.categoriesCollapsed;
        applySidebarState();
        saveSidebarState();
    });

    toggleTabsBtn.addEventListener('click', () => {
        sidebarState.tabsCollapsed = !sidebarState.tabsCollapsed;
        applySidebarState();
        saveSidebarState();
    });

    addCategoryBtn.addEventListener('click', () => {
        openModal(addCategoryModal);
    });

    addSectionBtn.addEventListener('click', () => {
        openModal(addSectionModal);
    });

    addBookmarkBtn.addEventListener('click', () => {
        bookmarkSectionSelect.innerHTML = '';
        const uncategorized = document.createElement('option');
        uncategorized.value = '';
        uncategorized.textContent = 'Uncategorized';
        bookmarkSectionSelect.appendChild(uncategorized);

        sections
            .filter(section => section.categoryId === currentCategoryId)
            .forEach(section => {
                const option = document.createElement('option');
                option.value = section.id;
                option.textContent = section.name;
                bookmarkSectionSelect.appendChild(option);
            });

        openModal(addBookmarkModal);
    });

    refreshTabsBtn.addEventListener('click', loadOpenTabs);

    if (saveAllBtn) {
        saveAllBtn.addEventListener('click', saveAllOpenTabs);
    }

    if (bookmarkSearchInput) {
        bookmarkSearchInput.addEventListener('input', () => {
            renderBookmarks();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            bookmarkSearchInput.value = '';
            bookmarkSearchInput.focus();
            renderBookmarks();
        });
    }

    document.querySelectorAll('.close, [data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.closest('.modal'));
        });
    });

    updateSidebarLayout();
    setupSettingsMenu();

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });

    document.addEventListener('keydown', (e) => {
        const open = [...document.querySelectorAll('.modal')].find(modal => modal.style.display === 'flex');

        if (e.key === 'Escape') {
            if (open) {
                e.preventDefault();
                closeModal(open);
                return;
            }
            if (document.activeElement === bookmarkSearchInput && bookmarkSearchInput.value) {
                bookmarkSearchInput.value = '';
                renderBookmarks();
            }
            return;
        }

        if (e.key === '/' && !open && document.getElementById('settings-menu')?.hidden !== false && !isTypingTarget(document.activeElement)) {
            e.preventDefault();
            bookmarkSearchInput?.focus();
            return;
        }

        if (e.key !== 'Tab' || !open) return;

        const focusable = [...open.querySelectorAll('button, input, select, textarea, a[href]')]
            .filter(el => !el.disabled && el.offsetParent !== null);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    let bookmarkLayoutFrame = 0;
    let bookmarkColumnCount = getColumnCount();
    window.addEventListener('resize', () => {
        cancelAnimationFrame(bookmarkLayoutFrame);
        bookmarkLayoutFrame = requestAnimationFrame(() => {
            const next = getColumnCount();
            if (next !== bookmarkColumnCount) {
                bookmarkColumnCount = next;
                renderBookmarks();
            }
        });
    });

    addCategoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        if (name) {
            addCategory(name);
            categoryNameInput.value = '';
            closeModal(addCategoryModal);
        }
    });

    addSectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = sectionNameInput.value.trim();
        if (name) {
            addSection(name);
            sectionNameInput.value = '';
            closeModal(addSectionModal);
        }
    });

    if (renameSectionForm) {
        renameSectionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const section = sections.find(item => item.id === renamingSectionId);
            const name = renameSectionInput.value.trim();
            if (!section || !name) return;

            try {
                if (name !== section.name) {
                    section.name = name;
                    await SaveItDB.put(STORES.SECTIONS, section);
                    renderBookmarks();
                }
                renamingSectionId = null;
                closeModal(renameSectionModal);
            } catch (error) {
                console.error('Error updating section:', error);
                alert('Error updating section. Please try again.');
            }
        });
    }

    addBookmarkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = bookmarkTitleInput.value.trim();
        const url = bookmarkUrlInput.value.trim();
        const sectionId = bookmarkSectionSelect.value || null;

        if (title && url) {
            addBookmark(title, url, sectionId);
            bookmarkTitleInput.value = '';
            bookmarkUrlInput.value = '';
            closeModal(addBookmarkModal);
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

// Render open tabs
function renderOpenTabs() {
    openTabsList.setAttribute('aria-busy', 'false');
    openTabsList.innerHTML = '';

    if (!tabsAccess) {
        openTabsList.appendChild(createEmptyState(
            'Open tabs stay in Chrome',
            'Use SaveIt as your new tab page to see the tabs you have open and drag them into a category.'
        ));
        updateSummaries();
        return;
    }

    const filteredTabs = openTabs.filter(tab => !isOwnNewTab(tab.url));

    if (filteredTabs.length === 0) {
        openTabsList.appendChild(createEmptyState('No other tabs', 'Tabs you open will show up here, ready to save.'));
        updateSummaries();
        return;
    }

    filteredTabs.forEach(tab => {
        const title = tab.title || 'Untitled tab';
        const host = displayHost(tab.url);
        const tabItem = document.createElement('div');
        tabItem.className = 'tab-item';
        tabItem.dataset.id = tab.id;
        tabItem.dataset.url = tab.url || '';
        tabItem.dataset.title = title;
        tabItem.draggable = true;
        tabItem.tabIndex = 0;
        tabItem.setAttribute('role', 'listitem');
        tabItem.setAttribute('aria-label', host ? `Switch to ${title}, ${host}` : `Switch to ${title}`);

        const handle = document.createElement('span');
        handle.className = 'drag-handle tab-drag-handle';
        handle.innerHTML = ICON.grip;
        handle.setAttribute('aria-hidden', 'true');

        const info = document.createElement('div');
        info.className = 'tab-info';

        const icon = document.createElement('span');
        icon.className = 'tab-icon';
        const parsed = safeHttpUrl(tab.url);
        let src = tab.favIconUrl || '';
        if (!src && parsed) src = getFaviconUrl(parsed.href);
        if (src) {
            const img = document.createElement('img');
            img.alt = '';
            img.src = src;
            img.addEventListener('error', () => {
                icon.replaceChildren();
                icon.textContent = title.charAt(0).toUpperCase() || '•';
                icon.classList.add('favicon-letter');
            });
            icon.appendChild(img);
        } else {
            icon.textContent = title.charAt(0).toUpperCase() || '•';
            icon.classList.add('favicon-letter');
        }

        const text = document.createElement('div');
        text.className = 'tab-text';
        const titleEl = document.createElement('div');
        titleEl.className = 'tab-title';
        titleEl.textContent = title;
        const domainEl = document.createElement('div');
        domainEl.className = 'tab-domain';
        domainEl.textContent = host;
        text.append(titleEl, domainEl);
        info.append(icon, text);
        tabItem.append(handle, info);

        tabItem.addEventListener('dragstart', (e) => {
            draggedItem = tabItem;
            draggedItemType = 'tab';
            draggedTabData = {
                id: tab.id,
                title: tab.title,
                url: tab.url
            };

            const dragImage = document.createElement('div');
            dragImage.className = 'tab-drag-image';
            dragImage.style.position = 'absolute';
            dragImage.style.top = '-1000px';
            if (src) {
                const dragIcon = document.createElement('img');
                dragIcon.alt = '';
                dragIcon.src = src;
                dragIcon.width = 16;
                dragIcon.height = 16;
                dragImage.appendChild(dragIcon);
            }
            document.body.appendChild(dragImage);

            e.dataTransfer.setDragImage(dragImage, 15, 15);
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', tab.url || title);

            setTimeout(() => {
                tabItem.classList.add('dragging');
                dragImage.remove();
            }, 0);
        });

        tabItem.addEventListener('dragend', () => {
            tabItem.classList.remove('dragging');
            draggedItem = null;
            draggedItemType = null;
        });

        const activate = () => activateOpenTab(tab);
        tabItem.addEventListener('click', activate);
        tabItem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
            }
        });

        openTabsList.appendChild(tabItem);
    });

    updateSummaries();
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
