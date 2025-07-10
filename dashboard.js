document.addEventListener('DOMContentLoaded', () => {
    // Assuming Supabase Client and showToast are loaded from a global config

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
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };
    
    const displayBooks = (booksToDisplay) => {
        booksContainer.innerHTML = ''; 
        booksToDisplay.forEach(book => {
            const bookLink = document.createElement('a');
            bookLink.href = `book-details.html?id=${book.id}`;
            bookLink.className = 'book-card-link group';

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
            
            bookLink.appendChild(bookCard);
            booksContainer.appendChild(bookLink);
        });
    };
    
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
            .maybeSingle(); // Use maybeSingle for safety

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
                .order('created_at', { ascending: false });

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

    const handleBookSearch = async () => {
        const query = bookSearchInput.value.trim();
        if (!query) return;
        const searchButtonText = bookSearchBtn.querySelector('.button-text');
        const searchSpinner = bookSearchBtn.querySelector('.spinner');
        bookSearchBtn.disabled = true;
        searchButtonText.classList.add('hidden');
        searchSpinner.classList.remove('hidden');
        searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">অনুসন্ধান চলছে...</p>`;
        try {
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            
            searchResultsContainer.innerHTML = '';
            if (!data.items || data.items.length === 0) {
                searchResultsContainer.innerHTML = `<p class="text-center text-gray-500 p-4">কোনো বই খুঁজে পাওয়া যায়নি।</p>`;
                return;
            }
            data.items.slice(0, 5).forEach(book => {
                const { volumeInfo } = book;
                const resultItem = document.createElement('div');
                resultItem.className = 'p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0';
                resultItem.innerHTML = `<p class="font-semibold text-sm text-[#4A3F35]">${volumeInfo.title}</p><p class="text-xs text-gray-600">${volumeInfo.authors ? volumeInfo.authors.join(', ') : 'লেখক অজানা'}</p>`;
                resultItem.addEventListener('click', () => {
                    document.getElementById('book-title').value = volumeInfo.title || '';
                    document.getElementById('book-author').value = volumeInfo.authors ? volumeInfo.authors.join(', ') : '';
                    document.getElementById('book-cover-url').value = volumeInfo.imageLinks?.thumbnail || '';
                    document.getElementById('book-page-count').value = volumeInfo.pageCount || '';
                    searchResultsContainer.innerHTML = '';
                    bookSearchInput.value = '';
                });
                searchResultsContainer.appendChild(resultItem);
            });
        } catch (error) {
            searchResultsContainer.innerHTML = `<p class="text-center text-red-500 p-4">অনুসন্ধান ব্যর্থ হয়েছে।</p>`;
        } finally {
            bookSearchBtn.disabled = false;
            searchButtonText.classList.remove('hidden');
            searchSpinner.classList.add('hidden');
        }
    };

    bookSearchBtn.addEventListener('click', handleBookSearch);
    bookSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBookSearch();
        }
    });

    addBookForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bookData = {
            title: document.getElementById('book-title').value.trim(),
            author: document.getElementById('book-author').value.trim(),
            cover_image_url: document.getElementById('book-cover-url').value.trim() || null,
            page_count: parseInt(document.getElementById('book-page-count').value, 10) || null,
            status: document.getElementById('book-status').value,
            user_id: currentUser.id
        };
        if (!bookData.title || !bookData.author) {
            showToast('অনুগ্রহ করে বইয়ের নাম এবং লেখকের নাম দিন।', 'error');
            return;
        }

        const saveButtonText = saveBookBtn.querySelector('.button-text');
        const saveSpinner = saveBookBtn.querySelector('.spinner');
        saveBookBtn.disabled = true;
        saveButtonText.classList.add('hidden');
        saveSpinner.classList.remove('hidden');

        const { error } = await _supabase.from('books').insert([bookData]);

        saveBookBtn.disabled = false;
        saveButtonText.classList.remove('hidden');
        saveSpinner.classList.add('hidden');

        if (error) {
            showToast('বইটি যোগ করা সম্ভব হয়নি।', 'error');
            console.error("Save book error:", error);
        } else {
            showToast('বইটি সফলভাবে যোগ করা হয়েছে');
            hideModal();
            fetchBooks();
        }
    });

    const checkUserAndInitialize = async () => {
        const { data: { session } } = await _supabase.auth.getSession();
        if (session?.user) {
            currentUser = session.user;
            
            // --- FIX START: Changed .single() to .maybeSingle() ---
            // This prevents a 406 error if the user has no profile row yet.
            const { data: profile, error } = await _supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', currentUser.id)
                .maybeSingle(); // Use maybeSingle() instead of single()

            if (error) {
                // Log the error but don't crash the page
                console.error("Error fetching profile:", error);
            }
            // --- FIX END ---

            // Safely access profile data, providing fallbacks if it's null
            const displayName = profile?.username || currentUser.user_metadata?.full_name || 'ব্যবহারকারী';
            userWelcomeMessage.textContent = `স্বাগতম, ${displayName}`;
            
            // Set header avatar, using a fallback if profile or avatar_url is missing
            if (profile?.avatar_url) {
                headerAvatar.src = profile.avatar_url;
            } else {
                headerAvatar.src = `https://placehold.co/40x40/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            }

            fetchBooks();
        } else {
            window.location.replace('login.html');
        }
    };
    
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
    
    checkUserAndInitialize();
});
