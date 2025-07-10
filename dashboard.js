document.addEventListener('DOMContentLoaded', () => {
    // Assuming Supabase Client (_supabase) and showToast are loaded from a global config

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

    let currentUser = null;
    let localBooks = []; 

    const statusMap = {
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };
    
    // --- Function: Display Books ---
    // Displays book cards in the container.
    // Dynamically adds reorder buttons for the 'want_to_read' view.
    const displayBooks = (booksToDisplay) => {
        booksContainer.innerHTML = ''; 
        const isTbrView = statusFilter.value === 'want_to_read';

        booksToDisplay.forEach((book, index) => {
            // Use a simple div for TBR view to avoid link navigation conflicts with buttons.
            // Use an anchor tag for all other views to link to book details.
            const cardWrapper = document.createElement(isTbrView ? 'div' : 'a');
            
            cardWrapper.className = 'group relative'; // Add relative positioning for absolute child buttons
            if (!isTbrView) {
                cardWrapper.href = `book-details.html?id=${book.id}`;
            }

            const bookCard = document.createElement('div');
            bookCard.className = 'book-card bg-white/70 rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-transform duration-300 transform group-hover:scale-105 group-hover:shadow-xl';
            
            const coverImageUrl = book.cover_image_url || `https://placehold.co/400x600/EAE0D5/4A3F35?text=${encodeURIComponent(book.title)}`;
            const statusText = statusMap[book.status] || 'N/A';
            const pageCountText = book.page_count ? `${book.page_count.toLocaleString('bn-BD')} পৃষ্ঠা` : '';
            
            bookCard.innerHTML = `
                <img src="${coverImageUrl}" alt="${book.title} এর কভার" class="w-full h-64 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x600/EAE0D5/4A3F35?text=No+Cover';">
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-lg font-bold text-[#4A3F35] flex-grow">${book.title}</h3>
                    <p class="text-sm text-gray-600 mt-1 mb-3"> - ${book.author}</p>
                    <div class="mt-auto pt-2 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                        <span class="font-semibold text-[#785A3E]">${statusText}</span>
                        <span>${pageCountText}</span>
                    </div>
                </div>
            `;

            // If in TBR view, add the reorder buttons
            if (isTbrView) {
                const reorderControls = document.createElement('div');
                reorderControls.className = 'absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300';
                
                // Up button (hidden if it's the first item)
                const upButton = `
                    <button class="tbr-up-btn bg-white/80 rounded-full p-1 shadow-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" data-id="${book.id}" aria-label="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-700 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7"/></svg>
                    </button>`;

                // Down button (hidden if it's the last item)
                const downButton = `
                    <button class="tbr-down-btn bg-white/80 rounded-full p-1 shadow-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed" data-id="${book.id}" aria-label="Move Down" ${index === booksToDisplay.length - 1 ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-700 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                    </button>`;

                reorderControls.innerHTML = upButton + downButton;
                bookCard.appendChild(reorderControls);
            }
            
            cardWrapper.appendChild(bookCard);
            booksContainer.appendChild(cardWrapper);
        });
    };
    
    // --- Function: Apply Filters ---
    // Filters and displays books based on search and status dropdown.
    const applyFilters = () => {
        const searchTerm = librarySearchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredBooks = localBooks.filter(book => {
            const titleMatch = book.title.toLowerCase().includes(searchTerm);
            const authorMatch = book.author.toLowerCase().includes(searchTerm);
            const statusMatch = selectedStatus === 'all' || book.status === selectedStatus;
            return (titleMatch || authorMatch) && statusMatch;
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

    // --- Function: Fetch and Display Goal ---
    // Fetches and renders the user's reading goal for the current year.
    const fetchAndDisplayGoal = async () => {
        if (!currentUser) return;

        const currentYear = new Date().getFullYear();
        const bengaliYear = currentYear.toLocaleString('bn-BD', { useGrouping: false });
        const completedBooks = localBooks.filter(book => book.status === 'read').length;

        const { data: goalData, error: goalError } = await _supabase
            .from('goals')
            .select('target_books')
            .eq('user_id', currentUser.id)
            .eq('year', currentYear)
            .maybeSingle();

        if (goalError) {
            console.error('Error fetching goal:', goalError);
            goalTitle.textContent = 'লক্ষ্য আনতে সমস্যা হয়েছে।';
            return;
        }

        if (goalData) {
            const target = goalData.target_books;
            const progressPercentage = target > 0 ? Math.min((completedBooks / target) * 100, 100) : 0;
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = `${completedBooks.toLocaleString('bn-BD')} / ${target.toLocaleString('bn-BD')} টি বই`;
            goalProgressBarContainer.innerHTML = `<div class="bg-[#785A3E] h-full rounded-full text-center text-white text-xs flex items-center justify-center transition-all duration-500" style="width: ${progressPercentage}%;">${Math.round(progressPercentage)}%</div>`;
        } else {
            goalTitle.textContent = `${bengaliYear} সালের পড়ার লক্ষ্য`;
            goalProgressText.textContent = 'এই বছরের জন্য কোনো লক্ষ্য ঠিক করা হয়নি।';
            goalProgressBarContainer.innerHTML = '';
        }
    };

    // --- Function: Fetch Books ---
    // Fetches all books for the current user from Supabase.
    // **MODIFIED**: Now sorts by `tbr_order` to maintain priority.
    const fetchBooks = async () => {
        if (!currentUser) return;

        loader.classList.remove('hidden');
        booksContainer.classList.add('hidden');
        libraryControls.classList.add('hidden');
        emptyState.classList.add('hidden');

        try {
            const { data, error } = await _supabase
                .from('books')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('tbr_order', { ascending: true, nullsFirst: false }); // <-- SORTING LOGIC UPDATED HERE

            if (error) throw error;

            localBooks = data;
            
            if (localBooks.length > 0) {
                libraryControls.classList.remove('hidden');
            }
            
            applyFilters();
            await fetchAndDisplayGoal();

        } catch (err) {
            console.error('Fetch books failed:', err);
            showToast('বই লোড করা সম্ভব হয়নি।', 'error');
            emptyState.classList.remove('hidden');
            emptyState.querySelector('h3').textContent = 'একটি সমস্যা হয়েছে';
            emptyState.querySelector('p').textContent = 'অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।';
        } finally {
            loader.classList.add('hidden');
        }
    };

    // --- Function: Modal Controls ---
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
        }, 300);
    };

    addBookBtn.addEventListener('click', () => {
        modalTitle.textContent = 'নতুন বই যোগ করুন';
        showModal();
    });

    closeModalBtn.addEventListener('click', hideModal);
    closeModalBtnIcon.addEventListener('click', hideModal);
    addBookModal.addEventListener('click', (e) => {
        if (e.target === addBookModal) hideModal();
    });
    
    // --- Goal Modal Listeners ---
    setGoalBtn.addEventListener('click', async () => {
        const currentYear = new Date().getFullYear();
        const { data } = await _supabase.from('goals').select('target_books').eq('user_id', currentUser.id).eq('year', currentYear).maybeSingle();
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
        const { error } = await _supabase
            .from('goals')
            .upsert({ user_id: currentUser.id, year: currentYear, target_books: newGoal }, { onConflict: 'user_id, year' });

        if (error) {
            showToast('লক্ষ্য ঠিক করতে সমস্যা হয়েছে।', 'error');
        } else {
            showToast('আপনার পড়ার লক্ষ্য সফলভাবে সেট করা হয়েছে!');
            goalModal.classList.add('hidden');
            await fetchAndDisplayGoal();
        }
    });

    // --- Function: Handle Book Search ---
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
                    resultDiv.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0';
                    resultDiv.textContent = `${volumeInfo.title} - ${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author'}`;
                    resultDiv.addEventListener('click', () => {
                        document.getElementById('book-title').value = volumeInfo.title || '';
                        document.getElementById('book-author').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
                        document.getElementById('book-cover-url').value = volumeInfo.imageLinks?.thumbnail || '';
                        document.getElementById('book-page-count').value = volumeInfo.pageCount || '';
                        searchResultsContainer.innerHTML = '';
                    });
                    searchResultsContainer.appendChild(resultDiv);
                });
            } else {
                searchResultsContainer.innerHTML = '<p class="p-3 text-gray-500">কোনো ফলাফল পাওয়া যায়নি।</p>';
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

    // --- Form: Add/Edit Book ---
    // **MODIFIED**: Sets a default `tbr_order` for new 'want_to_read' books.
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
                user_id: currentUser.id
            };

            // **NEW**: If the book is new and status is 'want_to_read',
            // set tbr_order to the current timestamp to place it at the end.
            if (!bookId && bookData.status === 'want_to_read') {
                bookData.tbr_order = Date.now();
            }

            let response;
            if (bookId) {
                // This is an update, we don't change tbr_order here.
                // It's handled by the reorder buttons.
                response = await _supabase.from('books').update(bookData).eq('id', bookId).select();
            } else {
                // This is a new book.
                response = await _supabase.from('books').insert(bookData).select();
            }

            const { error } = response;
            if (error) throw error;

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

    // --- NEW: Event Listener for Reordering Books ---
    // Handles clicks on the up/down arrows in the 'want_to_read' view.
    booksContainer.addEventListener('click', async (e) => {
        const upBtn = e.target.closest('.tbr-up-btn');
        const downBtn = e.target.closest('.tbr-down-btn');

        if (!upBtn && !downBtn) return; // Exit if not a reorder button click

        const button = upBtn || downBtn;
        if (button.disabled) return; // Do nothing if button is disabled

        const bookId = button.dataset.id;
        const direction = upBtn ? 'up' : 'down';

        // Get the currently displayed books to find correct indexes
        const currentViewBooks = localBooks.filter(book => book.status === 'want_to_read');
        
        const currentIndex = currentViewBooks.findIndex(b => b.id == bookId);

        if (currentIndex === -1) return;

        const siblingIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Boundary check
        if (siblingIndex < 0 || siblingIndex >= currentViewBooks.length) {
            return;
        }

        const bookA = currentViewBooks[currentIndex];
        const bookB = currentViewBooks[siblingIndex];

        // Swap the tbr_order values
        const tempOrder = bookA.tbr_order;
        bookA.tbr_order = bookB.tbr_order;
        bookB.tbr_order = tempOrder;

        loader.classList.remove('hidden'); // Show loader during DB operation

        try {
            // --- FIX APPLIED HERE ---
            // Instead of upsert, use two explicit update calls. This is more robust
            // and ensures we are only updating existing records, not attempting to insert.
            const updatePromises = [
                _supabase.from('books').update({ tbr_order: bookA.tbr_order }).eq('id', bookA.id),
                _supabase.from('books').update({ tbr_order: bookB.tbr_order }).eq('id', bookB.id)
            ];

            const results = await Promise.all(updatePromises);

            // Check for errors in the results of the promises
            const anError = results.find(res => res.error);
            if (anError) {
                throw anError.error;
            }

            // The localBooks array is now out of sync with the database order.
            // Re-fetch to get the canonical state.
            await fetchBooks();
            showToast('বইয়ের অগ্রাধিকার পরিবর্তন করা হয়েছে।', 'success');

        } catch (err) {
            console.error('Reorder failed:', err);
            showToast('অগ্রাধিকার পরিবর্তন করা সম্ভব হয়নি।', 'error');
            // Revert local changes if DB update fails to avoid UI confusion
            bookB.tbr_order = bookA.tbr_order;
            bookA.tbr_order = tempOrder;
        } finally {
            loader.classList.add('hidden');
        }
    });


    // --- Function: Check User and Initialize ---
    // Checks for an active session and initializes the dashboard.
    const checkUserAndInitialize = async () => {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            
            const { data: profile, error } = await _supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (error) {
                console.error("Error fetching profile:", error);
            }

            const displayName = profile?.username || currentUser.user_metadata?.full_name || 'ব্যবহারকারী';
            userWelcomeMessage.textContent = `স্বাগতম, ${displayName}`;
            
            let avatarSrc = `https://placehold.co/40x40/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            
            if (profile && profile.avatar_url) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await _supabase.storage
                        .from('avatars')
                        .createSignedUrl(profile.avatar_url, 3600); 

                    if (signedUrlError) throw signedUrlError;
                    
                    avatarSrc = signedUrlData.signedUrl;

                } catch (error) {
                    console.error('Error creating signed URL for dashboard avatar:', error);
                }
            }
            
            if (headerAvatar) {
                headerAvatar.src = avatarSrc;
            }

            // Initial fetch of books
            await fetchBooks();
        } else {
            window.location.replace('login.html');
        }
    };
    
    // --- Logout Button Listener ---
    logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        const { error } = await _supabase.auth.signOut();
        if (error) {
            showToast('লগআউট করা সম্ভব হয়নি।', 'error');
            logoutButton.disabled = false;
        } else {
            window.location.replace('index.html');
        }
    });
    
    // --- Initializer Call ---
    checkUserAndInitialize();
});
