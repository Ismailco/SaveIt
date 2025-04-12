// DOM Elements
const categoriesList = document.getElementById('categories-list');
const bookmarksList = document.getElementById('bookmarks-list');
const openTabsList = document.getElementById('open-tabs-list');
const addCategoryBtn = document.getElementById('add-category-btn');
const addSectionBtn = document.getElementById('add-section-btn');
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
const closeButtons = document.querySelectorAll('.close');

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

    // Load collapsed sections state
    const savedCollapsedSections = localStorage.getItem('saveItCollapsedSections');
    if (savedCollapsedSections) {
        collapsedSections = JSON.parse(savedCollapsedSections);
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem('saveItSidebarState');
    if (savedSidebarState) {
        sidebarState = JSON.parse(savedSidebarState);
        applySidebarState();
    }
}

// Apply saved sidebar state
function applySidebarState() {
    if (sidebarState.categoriesCollapsed) {
        categoriesPanel.classList.add('collapsed');
        toggleCategoriesBtn.classList.add('collapsed');
    }

    if (sidebarState.tabsCollapsed) {
        tabsPanel.classList.add('collapsed');
        toggleTabsBtn.classList.add('collapsed');
    }

    // Update bookmarks section expanded state
    if (sidebarState.categoriesCollapsed || sidebarState.tabsCollapsed) {
        bookmarksSection.classList.add('expanded');
    }
}

// Save sidebar state to localStorage
function saveSidebarState() {
    localStorage.setItem('saveItSidebarState', JSON.stringify(sidebarState));
}

// Load data from localStorage
function loadDataFromLocalStorage() {
    const savedCategories = localStorage.getItem('saveItCategories');
    const savedBookmarks = localStorage.getItem('saveItBookmarks');
    const savedSections = localStorage.getItem('saveItSections');

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

    if (savedSections) {
        sections = JSON.parse(savedSections);
    } else {
        // Add sample sections if none exist
        sections = [
            { id: 'section-1', categoryId: 'category-1', name: 'Development', order: 0 },
            { id: 'section-2', categoryId: 'category-1', name: 'Documentation', order: 1 },
            { id: 'section-3', categoryId: 'category-2', name: 'Entertainment', order: 0 }
        ];
        saveSectionsToLocalStorage();
    }

    if (savedBookmarks) {
        bookmarks = JSON.parse(savedBookmarks);

        // Update existing bookmarks to include sectionId if they don't have one
        bookmarks.forEach(bookmark => {
            if (bookmark.sectionId === undefined) {
                bookmark.sectionId = null; // Default to no section
            }
        });
    } else {
        // Add sample bookmarks if none exist
        bookmarks = [
            { id: 'bookmark-1', categoryId: 'category-1', sectionId: 'section-1', title: 'GitHub', url: 'https://www.github.com', order: 0 },
            { id: 'bookmark-2', categoryId: 'category-1', sectionId: 'section-1', title: 'Stack Overflow', url: 'https://stackoverflow.com', order: 1 },
            { id: 'bookmark-3', categoryId: 'category-1', sectionId: 'section-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', order: 0 },
            { id: 'bookmark-4', categoryId: 'category-1', sectionId: null, title: 'Google', url: 'https://www.google.com', order: 0 },
            { id: 'bookmark-5', categoryId: 'category-2', sectionId: 'section-3', title: 'YouTube', url: 'https://www.youtube.com', order: 0 },
            { id: 'bookmark-6', categoryId: 'category-2', sectionId: 'section-3', title: 'Netflix', url: 'https://www.netflix.com', order: 1 },
            { id: 'bookmark-7', categoryId: 'category-2', sectionId: null, title: 'Twitter', url: 'https://twitter.com', order: 0 },
            { id: 'bookmark-8', categoryId: 'category-2', sectionId: null, title: 'Reddit', url: 'https://www.reddit.com', order: 1 }
        ];
        saveBookmarksToLocalStorage();
    }

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

    saveCategoriesToLocalStorage();
    saveSectionsToLocalStorage();
    saveBookmarksToLocalStorage();
}

// Save categories to localStorage
function saveCategoriesToLocalStorage() {
    localStorage.setItem('saveItCategories', JSON.stringify(categories));
}

// Save sections to localStorage
function saveSectionsToLocalStorage() {
    localStorage.setItem('saveItSections', JSON.stringify(sections));
}

// Save bookmarks to localStorage
function saveBookmarksToLocalStorage() {
    localStorage.setItem('saveItBookmarks', JSON.stringify(bookmarks));
}

// Save collapsed sections state
function saveCollapsedSectionsToLocalStorage() {
    localStorage.setItem('saveItCollapsedSections', JSON.stringify(collapsedSections));
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
    const categorySections = sections.filter(section => section.categoryId === currentCategoryId)
        .sort((a, b) => a.order - b.order);

    if (categoryBookmarks.length === 0 && categorySections.length === 0) {
        const noBookmarks = document.createElement('p');
        noBookmarks.textContent = 'No bookmarks in this category yet.';
        noBookmarks.style.textAlign = 'center';
        noBookmarks.style.color = '#a0a0a0';
        noBookmarks.style.gridColumn = 'span 5';
        bookmarksList.appendChild(noBookmarks);
        return;
    }

    // Group bookmarks by section
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

    // Create sections and render bookmarks
    categorySections.forEach(section => {
        const sectionBookmarks = bookmarksBySection[section.id] || [];
        createSectionElement(section, sectionBookmarks);
    });

    // Render bookmarks without a section (default section)
    if (defaultBookmarks.length > 0) {
        const defaultSectionDiv = document.createElement('div');
        defaultSectionDiv.className = 'default-section';

        const defaultSectionTitle = document.createElement('div');
        defaultSectionTitle.className = 'default-section-title';
        defaultSectionTitle.textContent = 'Uncategorized';

        defaultSectionDiv.appendChild(defaultSectionTitle);

        defaultBookmarks.sort((a, b) => a.order - b.order);

        const bookmarksContainer = document.createElement('div');
        bookmarksContainer.className = 'section-bookmarks';

        defaultBookmarks.forEach(bookmark => {
            const bookmarkElement = createBookmarkElement(bookmark);
            bookmarksContainer.appendChild(bookmarkElement);
        });

        defaultSectionDiv.appendChild(bookmarksContainer);
        bookmarksList.appendChild(defaultSectionDiv);
    }

    // Setup drag and drop for bookmarks list
    setupBookmarksListDragDrop();
}

// Create a section element
function createSectionElement(section, sectionBookmarks) {
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'bookmark-section';
    sectionDiv.dataset.id = section.id;
    sectionDiv.draggable = true;

    // Create section header
    const titleBar = document.createElement('div');
    titleBar.className = `section-title-bar ${collapsedSections[section.id] ? 'collapsed' : ''}`;

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'section-toggle';
    toggleIcon.textContent = '▼';

    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '≡';

    sectionTitle.appendChild(dragHandle);
    sectionTitle.appendChild(toggleIcon);
    sectionTitle.appendChild(document.createTextNode(section.name));

    const sectionActions = document.createElement('div');
    sectionActions.className = 'section-actions';

    const editBtn = document.createElement('span');
    editBtn.className = 'section-edit';
    editBtn.textContent = '✎';
    editBtn.title = 'Edit Section';

    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'section-delete';
    deleteBtn.textContent = '×';
    deleteBtn.dataset.id = section.id;
    deleteBtn.title = 'Delete Section';

    sectionActions.appendChild(editBtn);
    sectionActions.appendChild(deleteBtn);

    titleBar.appendChild(sectionTitle);
    titleBar.appendChild(sectionActions);

    sectionDiv.appendChild(titleBar);

    // Create section content
    const sectionContent = document.createElement('div');
    sectionContent.className = `section-content ${collapsedSections[section.id] ? 'collapsed' : ''}`;

    const bookmarksContainer = document.createElement('div');
    bookmarksContainer.className = 'section-bookmarks';

    // Check if section has bookmarks
    if (sectionBookmarks.length > 0) {
        // Sort bookmarks by order
        sectionBookmarks.sort((a, b) => a.order - b.order);

        sectionBookmarks.forEach(bookmark => {
            const bookmarkElement = createBookmarkElement(bookmark);
            bookmarksContainer.appendChild(bookmarkElement);
        });
    } else {
        // Display a message for empty sections
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-section-message';
        emptyMessage.textContent = 'This section is empty. Add bookmarks here by using the "Add Bookmark" button.';
        bookmarksContainer.appendChild(emptyMessage);
    }

    sectionContent.appendChild(bookmarksContainer);
    sectionDiv.appendChild(sectionContent);

    // Add click event for toggling section
    titleBar.addEventListener('click', (e) => {
        if (!e.target.classList.contains('section-edit') &&
            !e.target.classList.contains('section-delete') &&
            !e.target.classList.contains('drag-handle')) {

            titleBar.classList.toggle('collapsed');
            sectionContent.classList.toggle('collapsed');

            // Update collapsed state
            if (sectionContent.classList.contains('collapsed')) {
                collapsedSections[section.id] = true;
            } else {
                delete collapsedSections[section.id];
            }

            saveCollapsedSectionsToLocalStorage();
        }
    });

    // Add click event for edit button
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editSection(section.id);
    });

    // Add click event for delete button
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSection(section.id);
    });

    // Setup drag and drop for reordering sections
    sectionDiv.addEventListener('dragstart', (e) => {
        draggedItem = sectionDiv;
        draggedItemType = 'section';
        setTimeout(() => {
            sectionDiv.classList.add('dragging');
        }, 0);
    });

    sectionDiv.addEventListener('dragend', () => {
        sectionDiv.classList.remove('dragging');

        // Update section order
        if (draggedItemType === 'section') {
            const sectionItems = document.querySelectorAll('.bookmark-section');
            let order = 0;

            sectionItems.forEach(item => {
                const sectionId = item.dataset.id;
                const section = sections.find(s => s.id === sectionId);
                if (section) {
                    section.order = order++;
                }
            });

            saveSectionsToLocalStorage();
        }

        draggedItem = null;
        draggedItemType = null;
    });

    bookmarksList.appendChild(sectionDiv);
}

// Create a bookmark element
function createBookmarkElement(bookmark) {
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
            </div>
            <span class="bookmark-delete" data-id="${bookmark.id}">&times;</span>
        `;

        // Make the bookmark item clickable
        bookmarkItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('bookmark-delete') &&
                !e.target.classList.contains('drag-handle')) {
                window.open(bookmark.url, '_blank');
            }
        });

        // Setup drag and drop for bookmark
        bookmarkItem.addEventListener('dragstart', (e) => {
            e.stopPropagation(); // Prevent parent container's dragstart
            draggedItem = bookmarkItem;
            draggedItemType = 'bookmark';
            // Store the bookmark ID and section ID
            bookmarkItem.dataset.originalSectionId = bookmark.sectionId;
            setTimeout(() => {
                bookmarkItem.classList.add('dragging');
            }, 0);
        });

        bookmarkItem.addEventListener('dragend', () => {
            bookmarkItem.classList.remove('dragging');
            draggedItem = null;
            draggedItemType = null;
        });

    } catch (e) {
        // Handle invalid URLs gracefully
        console.error(`Invalid URL for bookmark: ${bookmark.title}`, e);
    }

    return bookmarkItem;
}

// Setup drag and drop for bookmarks list
function setupBookmarksListDragDrop() {
    // Add event listeners to bookmark delete buttons
    document.querySelectorAll('.bookmark-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteBookmark(btn.dataset.id);
        });
    });

    // Make each section's bookmarks container a drop target
    document.querySelectorAll('.section-bookmarks, .default-section .section-bookmarks').forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Allow both bookmark and tab drag types
            if (draggedItemType !== 'bookmark' && draggedItemType !== 'tab') return;

            // Highlight the drop area
            container.classList.add('drag-over');

            if (draggedItemType === 'bookmark') {
                const draggable = document.querySelector('.dragging');
                if (!draggable) return;

                // Try to position within this container
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
        });

        container.addEventListener('dragleave', (e) => {
            // Only remove highlight if we're leaving to an element outside this container
            if (!e.relatedTarget || !container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            container.classList.remove('drag-over');

            // Find which section this container belongs to
            const sectionElement = container.closest('.bookmark-section') || container.closest('.default-section');
            let sectionId = null;

            if (sectionElement) {
                if (sectionElement.classList.contains('default-section')) {
                    // This is the default/uncategorized section
                    sectionId = null;
                } else {
                    // This is a regular section
                    sectionId = sectionElement.dataset.id;
                }
            }

            if (draggedItemType === 'bookmark') {
                // Get the dragged bookmark
                const bookmarkId = draggedItem.dataset.id;
                const bookmark = bookmarks.find(bm => bm.id === bookmarkId);

                if (bookmark) {
                    // Update the section assignment if it changed
                    if (bookmark.sectionId !== sectionId) {
                        bookmark.sectionId = sectionId;
                    }

                    // Update the order of all bookmarks in this section
                    const bookmarkItems = container.querySelectorAll('.bookmark-item');
                    let order = 0;

                    bookmarkItems.forEach(item => {
                        const bmId = item.dataset.id;
                        const bm = bookmarks.find(b => b.id === bmId);
                        if (bm) {
                            bm.order = order++;
                        }
                    });

                    saveBookmarksToLocalStorage();

                    // No need to re-render - the drag and drop visually places the bookmark correctly
                }
            } else if (draggedItemType === 'tab' && draggedTabData) {
                // Add the tab as a new bookmark in this section
                addBookmark(draggedTabData.title, draggedTabData.url, sectionId);

                // Show visual feedback in the tabs list
                const tabItem = document.querySelector(`.tab-item[data-id="${draggedTabData.id}"]`);
                if (tabItem) {
                    tabItem.classList.add('tab-added');
                    setTimeout(() => {
                        tabItem.classList.remove('tab-added');
                    }, 1500);
                }

                draggedTabData = null;
            }
        });
    });

    // Add drop zone for bookmarks and sections in the main bookmarks container
    bookmarksList.addEventListener('dragover', (e) => {
        e.preventDefault();

        // Only process if not already handled by a section container
        if (e.target.closest('.section-bookmarks')) return;

        // Allow bookmark, tab, and section drag types
        if (draggedItemType !== 'bookmark' && draggedItemType !== 'tab' && draggedItemType !== 'section') return;

        // Highlight the drop area
        bookmarksList.classList.add('drag-over');

        if (draggedItemType === 'section') {
            const draggable = document.querySelector('.dragging');
            if (!draggable) return;

            // Only allow dropping in the correct order relative to other sections
            const allSections = [...document.querySelectorAll('.bookmark-section:not(.dragging)')];
            const defaultSection = document.querySelector('.default-section');

            // Find the section after which we should place this one
            let afterElement = null;

            for (const section of allSections) {
                const rect = section.getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) {
                    // Ensure the section is a direct child of bookmarksList
                    if (section.parentNode === bookmarksList) {
                        afterElement = section;
                        break;
                    }
                }
            }

            if (afterElement == null && defaultSection) {
                // Check if we should place before the default section
                const rect = defaultSection.getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2 && defaultSection.parentNode === bookmarksList) {
                    afterElement = defaultSection;
                }
            }

            if (afterElement == null) {
                // Check if the draggable is already a child of bookmarksList
                if (draggable.parentNode !== bookmarksList) {
                    bookmarksList.appendChild(draggable);
                }
            } else {
                try {
                    // Only attempt to insert if both the draggable and afterElement share the same parent
                    if (afterElement.parentNode === bookmarksList) {
                        bookmarksList.insertBefore(draggable, afterElement);
                    }
                } catch (err) {
                    console.error('Error during section drag and drop:', err);
                }
            }
        }
    });

    bookmarksList.addEventListener('dragleave', (e) => {
        // Only remove highlight if not still over a child element
        if (!e.relatedTarget || !bookmarksList.contains(e.relatedTarget)) {
            bookmarksList.classList.remove('drag-over');
        }
    });

    bookmarksList.addEventListener('drop', (e) => {
        e.preventDefault();
        bookmarksList.classList.remove('drag-over');

        // Only process if not already handled by a section container
        if (e.target.closest('.section-bookmarks')) return;

        if (draggedItemType === 'tab' && draggedTabData && currentCategoryId) {
            // Add the tab as a new bookmark in the default section (null sectionId)
            addBookmark(draggedTabData.title, draggedTabData.url, null);

            // Show visual feedback in the tabs list
            const tabItem = document.querySelector(`.tab-item[data-id="${draggedTabData.id}"]`);
            if (tabItem) {
                tabItem.classList.add('tab-added');
                setTimeout(() => {
                    tabItem.classList.remove('tab-added');
                }, 1500);
            }

            draggedTabData = null;
        } else if (draggedItemType === 'section') {
            // Update section order
            const sectionItems = document.querySelectorAll('.bookmark-section');
            let order = 0;

            sectionItems.forEach(item => {
                const sectionId = item.dataset.id;
                const section = sections.find(s => s.id === sectionId);
                if (section) {
                    section.order = order++;
                }
            });

            saveSectionsToLocalStorage();
        }
    });
}

// Helper function optimized for horizontal flex wrap layout
function getDragAfterElementHorizontal(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.bookmark-item:not(.dragging)')];

    if (draggableElements.length === 0) return null;

    // Find the element whose center is closest to the cursor
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;

        // Calculate distance to center of element
        const distanceX = x - centerX;
        const distanceY = y - centerY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        // First quadrant: drag to right if x > centerX
        if (distanceX > 0 && Math.abs(distanceY) < box.height) {
            // If cursor is to the right of this element's center,
            // place the dragged item after this element
            if (distance < closest.distance) {
                return { distance, element: child.nextSibling };
            }
        }
        // If cursor is to the left of or above this element's center
        else if (distance < closest.distance) {
            return { distance, element: child };
        }

        return closest;
    }, { distance: Infinity, element: null }).element;
}

// Select a category
function selectCategory(categoryId) {
    // Update current category
    currentCategoryId = categoryId;
    localStorage.setItem('saveItSelectedCategory', categoryId);

    // Update UI
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    currentCategoryHeading.textContent = selectedCategory.name;

    // Highlight the selected category
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === categoryId);
    });

    // Enable add buttons
    addBookmarkBtn.disabled = false;
    addSectionBtn.disabled = false;

    // Render bookmarks for the selected category
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
            addSectionBtn.disabled = true;
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

// Add a new section
function addSection(name) {
    const id = `section-${Date.now()}`;
    const newSection = {
        id,
        categoryId: currentCategoryId,
        name,
        order: sections.filter(section => section.categoryId === currentCategoryId).length
    };

    sections.push(newSection);
    saveSectionsToLocalStorage();
    renderBookmarks();
}

// Edit a section
function editSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    // Prompt user for new name
    const newName = prompt('Edit section name:', section.name);
    if (newName && newName.trim() !== '') {
        section.name = newName.trim();
        saveSectionsToLocalStorage();
        renderBookmarks();
    }
}

// Delete a section
function deleteSection(sectionId) {
    if (!confirm('Are you sure you want to delete this section? All bookmarks in this section will be moved to Uncategorized.')) {
        return;
    }

    // Update bookmarks that were in this section
    bookmarks.forEach(bookmark => {
        if (bookmark.sectionId === sectionId) {
            bookmark.sectionId = null;
        }
    });

    // Remove the section
    sections = sections.filter(section => section.id !== sectionId);

    // Update localStorage
    saveSectionsToLocalStorage();
    saveBookmarksToLocalStorage();

    // Re-render bookmarks
    renderBookmarks();
}

// Add a new bookmark
function addBookmark(title, url, sectionId = null) {
    if (!currentCategoryId) return;

    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const id = `bookmark-${Date.now()}`;
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

    bookmarks.push(newBookmark);
    saveBookmarksToLocalStorage();
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
    }, 100); // Short delay to ensure the DOM is updated
}

// Setup event listeners
function setupEventListeners() {
    // Toggle panels
    toggleCategoriesBtn.addEventListener('click', () => {
        categoriesPanel.classList.toggle('collapsed');
        toggleCategoriesBtn.classList.toggle('collapsed');
        bookmarksSection.classList.toggle('expanded');

        // Update and save state
        sidebarState.categoriesCollapsed = categoriesPanel.classList.contains('collapsed');
        saveSidebarState();
    });

    toggleTabsBtn.addEventListener('click', () => {
        tabsPanel.classList.toggle('collapsed');
        toggleTabsBtn.classList.toggle('collapsed');
        bookmarksSection.classList.toggle('expanded');

        // Update and save state
        sidebarState.tabsCollapsed = tabsPanel.classList.contains('collapsed');
        saveSidebarState();
    });

    // Add category button
    addCategoryBtn.addEventListener('click', () => {
        addCategoryModal.style.display = 'block';
        categoryNameInput.focus();
    });

    // Add section button
    addSectionBtn.addEventListener('click', () => {
        addSectionModal.style.display = 'block';
        sectionNameInput.focus();
    });

    // Add bookmark button
    addBookmarkBtn.addEventListener('click', () => {
        // Populate the section dropdown
        bookmarkSectionSelect.innerHTML = '<option value="">None (Default)</option>';

        const categorySections = sections.filter(section => section.categoryId === currentCategoryId);
        categorySections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            bookmarkSectionSelect.appendChild(option);
        });

        addBookmarkModal.style.display = 'block';
        bookmarkTitleInput.focus();
    });

    // Refresh tabs button
    refreshTabsBtn.addEventListener('click', loadOpenTabs);

    // Close buttons for modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Submit category form
    addCategoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        if (name) {
            addCategory(name);
            categoryNameInput.value = '';
            addCategoryModal.style.display = 'none';
        }
    });

    // Submit section form
    addSectionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = sectionNameInput.value.trim();
        if (name) {
            addSection(name);
            sectionNameInput.value = '';
            addSectionModal.style.display = 'none';
        }
    });

    // Submit bookmark form
    addBookmarkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = bookmarkTitleInput.value.trim();
        const url = bookmarkUrlInput.value.trim();
        const sectionId = bookmarkSectionSelect.value || null;

        if (title && url) {
            addBookmark(title, url, sectionId);
            bookmarkTitleInput.value = '';
            bookmarkUrlInput.value = '';
            addBookmarkModal.style.display = 'none';
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
        tabItem.dataset.url = tab.url;
        tabItem.dataset.title = tab.title;
        tabItem.draggable = true;
        tabItem.title = "Drag to add to bookmarks or click to add to current category";

        // Get favicon or use a default
        const favicon = tab.favIconUrl || '';

        tabItem.innerHTML = `
            <div class="tab-info">
                <div class="tab-drag-handle">≡</div>
                ${favicon ? `<img src="${favicon}" class="tab-icon" alt="favicon">` : ''}
                <div class="tab-title" title="${tab.title}">${tab.title}</div>
            </div>
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

        // Make the entire tab item clickable to add as bookmark
        tabItem.addEventListener('click', () => {
            if (currentCategoryId) {
                addBookmark(tab.title, tab.url);

                // Show visual feedback
                tabItem.classList.add('tab-added');
                setTimeout(() => {
                    tabItem.classList.remove('tab-added');
                }, 1500);
            } else {
                alert('Please select a category first before adding a bookmark.');
            }
        });

        openTabsList.appendChild(tabItem);
    });
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
