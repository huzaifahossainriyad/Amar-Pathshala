document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const userWelcomeMessage = document.getElementById('user-welcome-message');
    const headerAvatar = document.getElementById('header-avatar');
    const logoutButton = document.getElementById('logout-button');
    const addBookBtn = document.getElementById('add-book-btn');
    const addBookModal = document.getElementById('add-book-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalBtnIcon = document.getElementById('close-modal-btn-icon');
    const addBookForm = document.getElementById('add-book-form');
    const booksContainer = document.getElementById('books-container');
    const saveBookBtn = document.getElementById('save-book-btn');
    const modalTitle = document.getElementById('modal-title');
    const bookSearchInput = document.getElementById('book-search-input');
    const bookSearchBtn = document.getElementById('book-search-btn');
    const searchResultsContainer = document.getElementById('search-results');
    const librarySearchInput = document.getElementById('library-search-input');
    const statusFilter = document.getElementById('status-filter');
    const customShelfFilter = document.getElementById('custom-shelf-filter');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const libraryControls = document.getElementById('library-controls');
    const goalTitle = document.getElementById('goal-title');
    const goalProgressText = document.getElementById('goal-progress-text');
    const goalProgressBarContainer = document.getElementById('goal-progress-bar-container');
    const setGoalBtn = document.getElementById('set-goal-btn');
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalInput = document.getElementById('goal-input');
    const closeGoalModalBtn = document.getElementById('close-goal-modal-btn');
    const modalShelvesContainer = document.getElementById('modal-shelves-container');

    // --- Loan Out Modal Elements ---
    const loanOutModal = document.getElementById('loan-out-modal');
    const loanOutForm = document.getElementById('loan-out-form');
    const loanBookTitleEl = document.getElementById('loan-book-title');
    const cancelLoanOutBtn = document.getElementById('cancel-loan-out-btn');

    let currentUser = null;
    let localBooks = [];
    let customShelves = [];

    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ',
        'on_loan': 'ধারে দেওয়া'
    };

    // --- Function: Display Books (MODIFIED as per instructions) ---
    const displayBooks = (booksToDisplay) => {
        booksContainer.innerHTML = '';
        const isTbrView = statusFilter.value === 'want_to_read';

        if (!Array.isArray(booksToDisplay)) {
            console.error("displayBooks expects an array, but received:", booksToDisplay);
            return;
        }

        booksToDisplay.forEach((book, index) => {
            // --- Create Main Card Element ---
            const bookCard = document.createElement('div');
            bookCard.className = 'group relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 transform hover:-translate-y-1.5 flex flex-col';

            // --- Prepare Data for the Card ---
            const coverImageUrl = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=${encodeURIComponent(book.title)}`;
            const isLoanedOut = book.on_loan;
            const statusText = isLoanedOut ? statusMap['on_loan'] : (statusMap[book.status] || 'N/A');
            const pageCountText = book.page_count ? `${book.page_count.toLocaleString('bn-BD')} পৃষ্ঠা` : '';

            // --- Card Inner HTML based on the new template ---
            // This template is replaced as per user instructions.
            // Functionality like dynamic status color is preserved.
            const cardInnerHtml = `
                <a href="book-details.html?id=${book.id}" class="block relative w-full h-64 bg-gray-200 dark:bg-gray-700">
                    <img src="${coverImageUrl}" alt="${book.title} Cover" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover';">
                </a>

                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-md font-bold text-gray-900 dark:text-white truncate" title="${book.title}">
                        ${book.title}
                    </h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        - ${book.author}
                    </p>
                    
                    <div class="flex-grow"></div>

                    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold ${isLoanedOut ? 'text-red-600 dark:text-red-500' : 'text-indigo-600 dark:text-indigo-400'}">${statusText}</span>
                            <span>${pageCountText}</span>
                        </div>
                    </div>
                </div>

                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <!-- This container will be populated by JS -->
                </div>
            `;

            bookCard.innerHTML = cardInnerHtml;

            // --- Add Controls (TBR Reorder or Options Menu) ---
            const controlsContainer = bookCard.querySelector('.absolute.top-2.right-2');
            if (controlsContainer) {
                if (isTbrView) {
                    // Add TBR reorder controls for the "Want to Read" shelf
                    const reorderControls = document.createElement('div');
                    reorderControls.className = 'flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300';
                    
                    const upButton = `
                        <button class="tbr-up-btn bg-white/80 rounded-full p-1 shadow-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" data-id="${book.id}" aria-label="Move Up" ${index === 0 ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-700 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"/></svg>
                        </button>`;

                    const downButton = `
                        <button class="tbr-down-btn bg-white/80 rounded-full p-1 shadow-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" data-id="${book.id}" aria-label="Move Down" ${index === booksToDisplay.length - 1 ? 'disabled' : ''}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-700 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                        </button>`;

                    reorderControls.innerHTML = upButton + downButton;
                    controlsContainer.appendChild(reorderControls);
                } else {
                    // Add the three-dots options menu for all other shelves
                    const optionsMenuHtml = `
                        <button ${isLoanedOut ? 'disabled' : ''} data-book-id-menu="${book.id}" class="book-options-btn p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoanedOut ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100'}" aria-haspopup="true" aria-expanded="false">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-700 dark:text-gray-300 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        <div id="menu-${book.id}" class="book-options-menu hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-30" role="menu" aria-orientation="vertical">
                            <div class="py-1" role="none">
                                <a href="book-details.html?id=${book.id}" class="text-gray-700 dark:text-gray-200 block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">বিবরণ দেখুন</a>
                                <button data-book-id="${book.id}" data-book-title="${book.title}" class="loan-out-btn text-gray-700 dark:text-gray-200 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">ধার দিন</button>
                            </div>
                        </div>
                    `;
                    controlsContainer.innerHTML = optionsMenuHtml;
                }
            }

            // --- Append the completed card to the container ---
            booksContainer.appendChild(bookCard);
        });
    };

    // --- Function: Apply Filters ---
    const applyFilters = async () => {
        const searchTerm = librarySearchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;
        const selectedShelfId = customShelfFilter.value;

        let booksToFilter = [...localBooks];

        booksToFilter.forEach(book => book.on_loan = false);

        try {
            const {
                data: loanedBookIds,
                error
            } = await _supabase
                .from('loans')
                .select('book_id')
                .eq('user_id', currentUser.id)
                .eq('is_returned', false);

            if (error) throw error;

            const loanedIds = new Set(loanedBookIds.map(l => l.book_id));
            booksToFilter.forEach(book => {
                if (loanedIds.has(book.id)) {
                    book.on_loan = true;
                }
            });

        } catch (err) {
            console.error('Error fetching loaned books status:', err);
            showToast('ধারে দেওয়া বইয়ের তথ্য আনতে সমস্যা হয়েছে।', 'error');
        }

        if (selectedStatus === 'on_loan') {
            booksToFilter = booksToFilter.filter(book => book.on_loan);
        } else if (selectedStatus !== 'all') {
            booksToFilter = booksToFilter.filter(book => book.status === selectedStatus);
        }

        if (selectedShelfId !== 'all') {
            try {
                const {
                    data: bookShelfIds,
                    error
                } = await _supabase
                    .from('book_shelves')
                    .select('book_id')
                    .eq('shelf_id', selectedShelfId);

                if (error) throw error;

                const ids = bookShelfIds.map(bs => bs.book_id);
                booksToFilter = booksToFilter.filter(book => ids.includes(book.id));
            } catch (err) {
                console.error('Error fetching books from shelf:', err);
                showToast('শেলফ থেকে বই আনতে সমস্যা হয়েছে।', 'error');
                booksToFilter = [];
            }
        }

        const filteredBooks = booksToFilter.filter(book => {
            const titleMatch = book.title.toLowerCase().includes(searchTerm);
            const authorMatch = book.author.toLowerCase().includes(searchTerm);
            return titleMatch || authorMatch;
        });

        if (filteredBooks.length > 0) {
            emptyState.classList.add('hidden');
            booksContainer.classList.remove('hidden');
            displayBooks(filteredBooks);
        } else {
            booksContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            if (localBooks.length > 0) {
                emptyState.querySelector('h3').textContent = 'কোনো বই পাওয়া যায়নি';
                emptyState.querySelector('p').textContent = 'আপনার ফিল্টার বা সার্চের সাথে মেলে এমন কোনো বই নেই।';
            } else {
                emptyState.querySelector('h3').textContent = 'আপনার পাঠশালা এখনো খালি';
                emptyState.querySelector('p').textContent = 'আপনি এখনো কোনো বই যোগ করেননি। "নতুন বই যোগ করুন" বাটনে ক্লিক করে আপনার প্রথম বইটি যোগ করুন!';
            }
        }
    };

    librarySearchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    customShelfFilter.addEventListener('change', applyFilters);

    // --- Function: Fetch and Display Goal ---
    const fetchAndDisplayGoal = async () => {
        if (!currentUser) return;
        const currentYear = new Date().getFullYear();
        const bengaliYear = currentYear.toLocaleString('bn-BD', {
            useGrouping: false
        });
        const completedBooks = localBooks.filter(book => book.status === 'read').length;
        const {
            data: goalData,
            error: goalError
        } = await _supabase.from('goals').select('target_books').eq('user_id', currentUser.id).eq('year', currentYear).maybeSingle();
        if (goalError) {
            console.error('Error fetching goal:', goalError);
            return;
        }
        if (goalData) {
            const target = goalData.target_books;
            const progressPercentage = target > 0 ? Math.min((completedBooks / target) * 100, 100) : 0;
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = `${completedBooks.toLocaleString('bn-BD')} / ${target.toLocaleString('bn-BD')} টি বই`;
            goalProgressBarContainer.innerHTML = `<div class="bg-[#785A3E] dark:bg-indigo-600 h-full rounded-full text-center text-white text-xs flex items-center justify-center transition-all duration-500" style="width: ${progressPercentage}%;">${Math.round(progressPercentage)}%</div>`;
        } else {
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = 'এই বছরের জন্য কোনো লক্ষ্য ঠিক করা হয়নি।';
            goalProgressBarContainer.innerHTML = '';
        }
    };

    // --- Function: Fetch Custom Shelves ---
    const fetchCustomShelves = async () => {
        if (!currentUser) return;
        try {
            const {
                data,
                error
            } = await _supabase.from('custom_shelves').select('id, name').eq('user_id', currentUser.id).order('name', {
                ascending: true
            });
            if (error) throw error;
            customShelves = data;
            customShelfFilter.innerHTML = '<option value="all">সব শেলফ</option>';
            customShelves.forEach(shelf => {
                const option = document.createElement('option');
                option.value = shelf.id;
                option.textContent = shelf.name;
                customShelfFilter.appendChild(option);
            });
        } catch (err) {
            console.error('Fetch custom shelves failed:', err);
            showToast('কাস্টম শেলফ লোড করা যায়নি।', 'error');
        }
    };

    // --- Function: Fetch Books ---
    const fetchBooks = async () => {
        if (!currentUser) return;
        loader.classList.remove('hidden');
        booksContainer.classList.add('hidden');
        libraryControls.classList.add('hidden');
        emptyState.classList.add('hidden');
        try {
            const {
                data,
                error
            } = await _supabase.from('books').select('*').eq('user_id', currentUser.id).order('tbr_order', {
                ascending: true,
                nullsFirst: false
            }).order('created_at', { ascending: false });
            if (error) throw error;
            localBooks = data;
            if (localBooks.length > 0) {
                libraryControls.classList.remove('hidden');
            }
            await fetchCustomShelves();
            await applyFilters();
            await fetchAndDisplayGoal();
        } catch (err) {
            console.error('Fetch books failed:', err);
            showToast('বই লোড করা সম্ভব হয়নি।', 'error');
        } finally {
            loader.classList.add('hidden');
        }
    };

    // --- Modal Controls ---
    const showModal = () => {
        addBookModal.classList.remove('hidden');
        setTimeout(() => modalContent.classList.remove('scale-95', 'opacity-0'), 10);
    };
    const hideModal = () => {
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            addBookModal.classList.add('hidden');
            addBookForm.reset();
            searchResultsContainer.innerHTML = '';
            bookSearchInput.value = '';
            document.getElementById('edit-book-id').value = '';
            modalTitle.textContent = 'নতুন বই যোগ করুন';
            modalShelvesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">শেলফ লোড হচ্ছে...</p>';
        }, 300);
    };

    // --- Feature 1: Populate Shelves in Modal ---
    const populateShelvesInModal = async () => {
        if (!currentUser) return;
        if (customShelves.length === 0) {
            modalShelvesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-sm">আপনার কোনো কাস্টম শেলফ নেই।</p>';
            return;
        }
        modalShelvesContainer.innerHTML = '';
        customShelves.forEach(shelf => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.className = 'flex items-center';
            checkboxDiv.innerHTML = `
                <input type="checkbox" id="shelf-${shelf.id}" name="shelf-selection" value="${shelf.id}" class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-[#785A3E] focus:ring-[#A07C5B]">
                <label for="shelf-${shelf.id}" class="ml-3 block text-sm text-gray-700 dark:text-gray-300">${shelf.name}</label>
            `;
            modalShelvesContainer.appendChild(checkboxDiv);
        });
    };

    addBookBtn.addEventListener('click', () => {
        modalTitle.textContent = 'নতুন বই যোগ করুন';
        saveBookBtn.querySelector('.button-text').textContent = 'সেভ করুন';
        populateShelvesInModal();
        showModal();
    });
    closeModalBtn.addEventListener('click', hideModal);
    closeModalBtnIcon.addEventListener('click', hideModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) hideModal();
    });

    // --- Goal Modal Logic ---
    setGoalBtn.addEventListener('click', async () => {
        const currentYear = new Date().getFullYear();
        const {
            data
        } = await _supabase.from('goals').select('target_books').eq('user_id', currentUser.id).eq('year', currentYear).maybeSingle();
        goalInput.value = data ? data.target_books : '';
        goalModal.classList.remove('hidden');
    });
    closeGoalModalBtn.addEventListener('click', () => goalModal.classList.add('hidden'));
    goalModal.addEventListener('click', (e) => {
        if (e.target === goalModal) goalModal.classList.add('hidden');
    });
    goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newGoal = parseInt(goalInput.value, 10);
        if (isNaN(newGoal) || newGoal < 1) {
            showToast('অনুগ্রহ করে একটি সঠিক সংখ্যা দিন।', 'error');
            return;
        }
        const currentYear = new Date().getFullYear();
        const {
            error
        } = await _supabase.from('goals').upsert({
            user_id: currentUser.id,
            year: currentYear,
            target_books: newGoal
        }, {
            onConflict: 'user_id, year'
        });
        if (error) {
            showToast('লক্ষ্য ঠিক করতে সমস্যা হয়েছে।', 'error');
        } else {
            showToast('আপনার পড়ার লক্ষ্য সফলভাবে সেট করা হয়েছে!');
            goalModal.classList.add('hidden');
            await fetchAndDisplayGoal();
        }
    });

    // --- Book Search from Google API ---
    const handleBookSearch = async () => {
        const query = bookSearchInput.value.trim();
        if (!query) return;
        const searchBtnText = bookSearchBtn.querySelector('.button-text');
        const spinner = bookSearchBtn.querySelector('.spinner');
        searchBtnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        bookSearchBtn.disabled = true;
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=bn&maxResults=5`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            searchResultsContainer.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const volumeInfo = item.volumeInfo;
                    const resultDiv = document.createElement('div');
                    resultDiv.className = 'p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b last:border-b-0 border-gray-200 dark:border-gray-600';
                    resultDiv.textContent = `${volumeInfo.title} - ${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}`;
                    resultDiv.addEventListener('click', () => {
                        document.getElementById('book-title').value = volumeInfo.title || '';
                        document.getElementById('book-author').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
                        document.getElementById('book-cover-url').value = volumeInfo.imageLinks?.thumbnail || '';
                        document.getElementById('book-page-count').value = volumeInfo.pageCount || '';
                        if (volumeInfo.categories && volumeInfo.categories.length > 0) {
                            document.getElementById('book-genre').value = volumeInfo.categories[0];
                        }
                        searchResultsContainer.innerHTML = '';
                    });
                    searchResultsContainer.appendChild(resultDiv);
                });
            } else {
                searchResultsContainer.innerHTML = '<p class="p-3 text-gray-500 dark:text-gray-400">কোনো ফলাফল পাওয়া যায়নি।</p>';
            }
        } catch (error) {
            console.error("Error searching books:", error);
            searchResultsContainer.innerHTML = '<p class="p-3 text-red-500">অনুসন্ধানে সমস্যা হয়েছে।</p>';
        } finally {
            searchBtnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            bookSearchBtn.disabled = false;
        }
    };
    bookSearchBtn.addEventListener('click', handleBookSearch);
    bookSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBookSearch();
        }
    });

    // --- Form Submission (Add/Edit Book) ---
    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtnText = saveBookBtn.querySelector('.button-text');
        const spinner = saveBookBtn.querySelector('.spinner');
        saveBtnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        saveBookBtn.disabled = true;
        try {
            const formData = new FormData(addBookForm);
            const bookId = document.getElementById('edit-book-id').value;
            const bookData = {
                title: formData.get('book-title'),
                author: formData.get('book-author'),
                cover_image_url: formData.get('book-cover-url'),
                page_count: parseInt(formData.get('book-page-count'), 10) || null,
                status: formData.get('book-status'),
                genre: formData.get('book-genre').trim() || null,
                format: formData.get('book-format'),
                user_id: currentUser.id
            };
            if (!bookId && bookData.status === 'want_to_read') {
                bookData.tbr_order = Date.now();
            }
            let response;
            if (bookId) {
                delete bookData.user_id;
                response = await _supabase.from('books').update(bookData).eq('id', bookId).select().single();
            } else {
                response = await _supabase.from('books').insert(bookData).select().single();
            }
            const {
                data: savedBook,
                error
            } = response;
            if (error) throw error;
            const selectedShelfIds = Array.from(addBookForm.querySelectorAll('input[name="shelf-selection"]:checked')).map(checkbox => checkbox.value);
            
            await _supabase.from('book_shelves').delete().eq('book_id', savedBook.id);
            if (selectedShelfIds.length > 0) {
                const bookShelvesData = selectedShelfIds.map(shelfId => ({
                    book_id: savedBook.id,
                    shelf_id: shelfId,
                    user_id: currentUser.id
                }));
                const {
                    error: shelfError
                } = await _supabase.from('book_shelves').insert(bookShelvesData);
                if (shelfError) {
                    console.error('Error adding book to shelves:', shelfError);
                    showToast('বইটি শেলফে যোগ করতে সমস্যা হয়েছে।', 'warning');
                }
            }
            if (savedBook.status === 'read') {
                checkAndAwardBadges(currentUser.id, savedBook.id);
            }
            showToast(bookId ? 'বই সফলভাবে আপডেট করা হয়েছে!' : 'বই সফলভাবে যোগ করা হয়েছে!', 'success');
            hideModal();
            fetchBooks();
        } catch (err) {
            console.error('Save book failed:', err);
            showToast('বই সেভ করা সম্ভব হয়নি।', 'error');
        } finally {
            saveBtnText.classList.remove('hidden');
            spinner.classList.add('hidden');
            saveBookBtn.disabled = false;
        }
    });

    // --- Comprehensive Event Listener for Books Container ---
    booksContainer.addEventListener('click', async (e) => {
        const upBtn = e.target.closest('.tbr-up-btn');
        const downBtn = e.target.closest('.tbr-down-btn');
        const optionsBtn = e.target.closest('.book-options-btn');
        const loanOutBtn = e.target.closest('.loan-out-btn');

        // --- Handle Options Menu Toggle ---
        if (optionsBtn) {
            e.preventDefault();
            e.stopPropagation();
            const bookId = optionsBtn.dataset.bookIdMenu;
            const menu = document.getElementById(`menu-${bookId}`);
            const isHidden = menu.classList.contains('hidden');
            document.querySelectorAll('.book-options-menu').forEach(m => m.classList.add('hidden'));
            if (isHidden) {
                menu.classList.remove('hidden');
            }
            return;
        }

        // --- Handle Loan Out Button Click ---
        if (loanOutBtn) {
            e.preventDefault();
            e.stopPropagation();
            const bookId = loanOutBtn.dataset.bookId;
            const bookTitle = loanOutBtn.dataset.bookTitle;

            if (loanBookTitleEl) {
                loanBookTitleEl.textContent = bookTitle;
            }
            if (loanOutForm) {
                loanOutForm.dataset.bookId = bookId;
            }
            if (loanOutModal) {
                loanOutModal.classList.remove('hidden');
                const dueDateInput = loanOutModal.querySelector('#due-date');
                if (dueDateInput) {
                    const twoWeeksFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
                    dueDateInput.value = twoWeeksFromNow.toISOString().split('T')[0];
                }
            }
            loanOutBtn.closest('.book-options-menu').classList.add('hidden');
            return;
        }

        // --- Handle TBR Reordering Logic ---
        if (upBtn || downBtn) {
            const button = upBtn || downBtn;
            if (button.disabled) return;
            const bookId = button.dataset.id;
            const direction = upBtn ? 'up' : 'down';
            const currentViewBooks = localBooks.filter(book => book.status === 'want_to_read');
            const currentIndex = currentViewBooks.findIndex(b => b.id == bookId);
            if (currentIndex === -1) return;
            const siblingIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (siblingIndex < 0 || siblingIndex >= currentViewBooks.length) return;
            const bookA = currentViewBooks[currentIndex];
            const bookB = currentViewBooks[siblingIndex];
            const tempOrder = bookA.tbr_order;
            bookA.tbr_order = bookB.tbr_order;
            bookB.tbr_order = tempOrder;
            loader.classList.remove('hidden');
            try {
                const updatePromises = [
                    _supabase.from('books').update({
                        tbr_order: bookA.tbr_order
                    }).eq('id', bookA.id),
                    _supabase.from('books').update({
                        tbr_order: bookB.tbr_order
                    }).eq('id', bookB.id)
                ];
                const results = await Promise.all(updatePromises);
                const anError = results.find(res => res.error);
                if (anError) throw anError.error;
                await fetchBooks();
                showToast('বইয়ের অগ্রাধিকার পরিবর্তন করা হয়েছে।', 'success');
            } catch (err) {
                console.error('Reorder failed:', err);
                showToast('অগ্রাধিকার পরিবর্তন করা সম্ভব হয়নি।', 'error');
                bookB.tbr_order = bookA.tbr_order;
                bookA.tbr_order = tempOrder;
            } finally {
                loader.classList.add('hidden');
            }
        }
    });

    // --- Loan Out Modal Form Submission ---
    if (loanOutForm) {
        loanOutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loanOutForm.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const bookId = loanOutForm.dataset.bookId;
                const borrowerName = loanOutForm.querySelector('#borrower-name').value.trim();
                const dueDate = loanOutForm.querySelector('#due-date').value;

                if (!borrowerName || !dueDate) {
                    showToast('অনুগ্রহ করে সব তথ্য পূরণ করুন।', 'error');
                    throw new Error("Form incomplete");
                }

                const newLoan = {
                    book_id: bookId,
                    user_id: currentUser.id,
                    borrower_name: borrowerName,
                    due_date: dueDate,
                    loan_date: new Date().toISOString(),
                    is_returned: false
                };

                const {
                    error
                } = await _supabase.from('loans').insert(newLoan);
                if (error) throw error;

                showToast('বইটি সফলভাবে ধার দেওয়া হয়েছে।', 'success');
                loanOutModal.classList.add('hidden');
                loanOutForm.reset();
                
                await applyFilters();

            } catch (err) {
                console.error('Loan book submission failed:', err);
                if (err.message !== "Form incomplete") {
                    showToast('বই ধার দিতে সমস্যা হয়েছে।', 'error');
                }
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    // --- Loan Out Modal Cancellation ---
    if (cancelLoanOutBtn) {
        cancelLoanOutBtn.addEventListener('click', () => {
            loanOutModal.classList.add('hidden');
            loanOutForm.reset();
        });
    }
    if (loanOutModal) {
        loanOutModal.addEventListener('click', (e) => {
            if (e.target === loanOutModal) {
                loanOutModal.classList.add('hidden');
                loanOutForm.reset();
            }
        });
    }

    // --- Close menus if clicking outside ---
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.book-options-btn')) {
            document.querySelectorAll('.book-options-menu').forEach(menu => {
                if (!menu.classList.contains('hidden')) {
                    menu.classList.add('hidden');
                }
            });
        }
    });

    // --- Function: Check and Award Badges (Placeholder) ---
    const checkAndAwardBadges = (userId, bookId) => {
        console.log(`Checking badges for user: ${userId} after reading book: ${bookId}`);
    };

    // --- Function: Check User and Initialize ---
    const checkUserAndInitialize = async () => {
        const {
            data: {
                session
            }
        } = await _supabase.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            const {
                data: profile
            } = await _supabase.from('profiles').select('username, avatar_url').eq('id', currentUser.id).maybeSingle();
            const displayName = profile?.username || currentUser.user_metadata?.full_name || 'ব্যবহারকারী';
            userWelcomeMessage.textContent = `স্বাগতম, ${displayName}`;
            let avatarSrc = `https://placehold.co/40x40/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            if (profile && profile.avatar_url) {
                try {
                    const {
                        data: signedUrlData,
                        error: signedUrlError
                    } = await _supabase.storage.from('avatars').createSignedUrl(profile.avatar_url, 3600);
                    if (signedUrlError) throw signedUrlError;
                    avatarSrc = signedUrlData.signedUrl;
                } catch (error) {
                    console.error('Error creating signed URL for dashboard avatar:', error);
                }
            }
            if (headerAvatar) {
                headerAvatar.src = avatarSrc;
            }
            
            const mobileHeaderAvatar = document.getElementById('mobile-header-avatar');
            if(mobileHeaderAvatar) mobileHeaderAvatar.src = avatarSrc;
            
            const mobileUserWelcomeMessage = document.getElementById('mobile-user-welcome-message');
            if(mobileUserWelcomeMessage) mobileUserWelcomeMessage.textContent = `স্বাগতম, ${displayName}`;


            // Fetch all necessary data on initialization
            await fetchBooks();
        } else {
            window.location.replace('login.html');
        }
    };

    // --- Logout Button Listener ---
    const handleLogout = async () => {
        logoutButton.disabled = true;
        const mobileLogoutButton = document.getElementById('mobile-logout-button');
        if(mobileLogoutButton) mobileLogoutButton.disabled = true;

        const {
            error
        } = await _supabase.auth.signOut();
        if (error) {
            showToast('লগআউট করা সম্ভব হয়নি।', 'error');
            logoutButton.disabled = false;
            if(mobileLogoutButton) mobileLogoutButton.disabled = false;
        } else {
            window.location.replace('index.html');
        }
    };

    logoutButton.addEventListener('click', handleLogout);
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    if(mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);


    checkUserAndInitialize();
});
