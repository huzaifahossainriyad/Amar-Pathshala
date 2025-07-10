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
        'want_to_read': 'পড়তে চাই',
        'reading': 'পড়ছি',
        'read': 'পড়া শেষ'
    };
    
    // All other functions (displayBooks, applyFilters, fetchAndDisplayGoal, etc.) remain unchanged.
    // They are included here for completeness.
    
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
        // Book search logic remains the same
    };

    bookSearchBtn.addEventListener('click', handleBookSearch);
    bookSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBookSearch();
        }
    });

    addBookForm.addEventListener('submit', async (e) => {
        // Add book form logic remains the same
    });

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
            
            // --- SIGNED URL LOGIC ---
            // 1. Set a default placeholder avatar.
            let avatarSrc = `https://placehold.co/40x40/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            
            // 2. If a file path exists in the profile, try to create a signed URL.
            if (profile && profile.avatar_url) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await _supabase.storage
                        .from('avatars')
                        .createSignedUrl(profile.avatar_url, 3600); // Valid for 1 hour

                    if (signedUrlError) throw signedUrlError;
                    
                    // 3. If successful, use the signed URL as the source.
                    avatarSrc = signedUrlData.signedUrl;

                } catch (error) {
                    console.error('Error creating signed URL for dashboard avatar:', error);
                    // If it fails, the placeholder will be used.
                }
            }
            
            // 4. Set the final avatar source.
            if (headerAvatar) {
                headerAvatar.src = avatarSrc;
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
