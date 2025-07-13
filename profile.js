document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // This block was added to fix the potential "_supabase is not defined" error.
    // Ensure the global supabase client is available. If not, uncomment the lines below.
    // const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    // const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    // const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // A simple toast notification function
    const showToast = (message, type = 'success') => {
        console.log(`Toast (${type}): ${message}`);
        if (window.Toastify) {
            const background = type === 'success' 
                ? 'linear-gradient(to right, #00b09b, #96c93d)' 
                : 'linear-gradient(to right, #ff5f6d, #ffc371)';
            
            Toastify({
                text: message,
                duration: 3000,
                gravity: "bottom",
                position: "right",
                style: { background },
            }).showToast();
        }
    };

    // --- DOM Elements ---
    const userNameHeader = document.getElementById('user-name-header');
    
    // Stat count elements
    const statsReadCountElem = document.getElementById('stats-read-count');
    const statsReadingCountElem = document.getElementById('stats-reading-count');
    const statsWantToReadCountElem = document.getElementById('stats-want-to-read-count');
    const statsShelfCountElem = document.getElementById('stats-shelf-count'); // NEW
    const statsQuoteCountElem = document.getElementById('stats-quote-count'); // NEW
    
    // Profile Info
    const profileAvatar = document.getElementById('profile-avatar');
    const headerAvatar = document.getElementById('header-avatar'); 
    const nameUpdateForm = document.getElementById('name-update-form');
    const fullNameInput = document.getElementById('full-name');
    const updateNameBtn = document.getElementById('update-name-btn');
    
    // Avatar Upload
    const avatarUploadForm = document.getElementById('avatar-upload-form');
    const avatarUploadInput = document.getElementById('avatar-upload');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const fileInputLabel = document.querySelector('.file-input-label');

    // Password Update
    const passwordUpdateForm = document.getElementById('password-update-form');
    const newPasswordInput = document.getElementById('new-password');
    const updatePasswordBtn = document.getElementById('update-password-btn');

    // Charts
    const readingChartCanvas = document.getElementById('reading-chart');
    const genreChartCanvas = document.getElementById('genre-chart'); // NEW
    const formatChartCanvas = document.getElementById('format-chart'); // NEW
    
    // Achievements
    const badgesContainer = document.getElementById('badges-container'); // NEW

    // Data Management
    const downloadDataBtn = document.getElementById('download-data-btn');
    const csvImportInput = document.getElementById('csv-import-input'); // NEW
    const importBtn = document.getElementById('import-btn'); // NEW

    // Danger Zone
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    // Theme Switcher
    const themeOptions = document.querySelectorAll('.theme-option');

    let currentUser = null;
    let readingChart = null;
    let genreChart = null; // NEW
    let formatChart = null; // NEW

    // --- Theme Switching Logic ---
    const applyTheme = (themeName) => {
        document.documentElement.className = '';
        if (themeName !== 'light') {
            document.documentElement.classList.add(`theme-${themeName}`);
        }
        localStorage.setItem('app-theme', themeName);
        updateThemeButtons(themeName);
    };

    const updateThemeButtons = (activeTheme) => {
        themeOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.theme === activeTheme);
        });
    };

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const selectedTheme = option.dataset.theme;
            applyTheme(selectedTheme);
            showToast(`থিম "${selectedTheme}"-এ পরিবর্তন করা হয়েছে।`, 'success');
        });
    });

    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('app-theme') || 'light';
        updateThemeButtons(savedTheme);
    };
    
    // --- Utility Functions ---
    const setButtonLoading = (button, isLoading) => {
        if (!button) return;
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.spinner');
        button.disabled = isLoading;
        if (isLoading) {
            buttonText?.classList.add('hidden');
            spinner?.classList.remove('hidden');
        } else {
            buttonText?.classList.remove('hidden');
            spinner?.classList.add('hidden');
        }
    };

    // --- Data Fetching and Display ---

    /**
     * Fetches all necessary data from Supabase in parallel.
     */
    const fetchAllData = async () => {
        if (!currentUser) return;
        try {
            const [
                { data: books, error: booksError },
                { count: shelfCount, error: shelfError },
                { count: quoteCount, error: quoteError },
                { data: userBadges, error: badgeError }
            ] = await Promise.all([
                _supabase.from('books').select('status,genre,format,created_at').eq('user_id', currentUser.id),
                _supabase.from('custom_shelves').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                _supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                _supabase.from('user_badges').select('badges(name, description, icon)').eq('user_id', currentUser.id)
            ]);

            if (booksError || shelfError || quoteError || badgeError) {
                throw new Error(booksError?.message || shelfError?.message || quoteError?.message || badgeError?.message);
            }
            
            return { books, shelfCount, quoteCount, userBadges };

        } catch (error) {
            console.error('Error fetching all data:', error);
            showToast('প্রোফাইলের ডেটা লোড করতে সমস্যা হয়েছে।', 'error');
            return null;
        }
    };

    /**
     * Calculates and displays all statistics on the page.
     * @param {Array} books - The user's book data.
     * @param {number} shelfCount - The total number of custom shelves.
     * @param {number} quoteCount - The total number of saved quotes.
     */
    const displayAllStats = (books, shelfCount, quoteCount) => {
        const readCount = books.filter(b => b.status === 'read').length;
        const readingCount = books.filter(b => b.status === 'reading').length;
        const wantToReadCount = books.filter(b => b.status === 'want_to_read').length;

        statsReadCountElem.textContent = readCount.toLocaleString('bn-BD');
        statsReadingCountElem.textContent = readingCount.toLocaleString('bn-BD');
        statsWantToReadCountElem.textContent = wantToReadCount.toLocaleString('bn-BD');
        statsShelfCountElem.textContent = (shelfCount || 0).toLocaleString('bn-BD');
        statsQuoteCountElem.textContent = (quoteCount || 0).toLocaleString('bn-BD');
    };

    /**
     * Renders all charts on the page.
     * @param {Array} books - The user's book data.
     */
    const renderAllCharts = (books) => {
        // Bar Chart: Books read per month
        const currentYear = new Date().getFullYear();
        const monthlyCounts = Array(12).fill(0);
        books.forEach(book => {
            if (book.status === 'read') {
                const readDate = new Date(book.created_at);
                if (readDate.getFullYear() === currentYear) {
                    monthlyCounts[readDate.getMonth()]++;
                }
            }
        });
        if (readingChart) readingChart.destroy();
        readingChart = new Chart(readingChartCanvas, {
            type: 'bar',
            data: {
                labels: ["জানু", "ফেব্রু", "মার্চ", "এপ্রি", "মে", "জুন", "জুলাই", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"],
                datasets: [{
                    label: `পঠিত বই (${currentYear.toLocaleString('bn-BD')})`,
                    data: monthlyCounts,
                    backgroundColor: 'rgba(120, 90, 62, 0.6)',
                    borderColor: 'rgba(120, 90, 62, 1)',
                    borderWidth: 1,
                    borderRadius: 5,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw.toLocaleString('bn-BD')} টি বই` } } }
            }
        });

        // Helper function for doughnut charts
        const createDoughnutChart = (canvas, chartInstance, data, title) => {
            if (chartInstance) chartInstance.destroy();
            const labels = Object.keys(data);
            const counts = Object.values(data);
            if (labels.length === 0) {
                canvas.parentElement.innerHTML = `<h3 class="text-lg font-semibold text-primary mb-3 text-center">${title}</h3><p class="text-center text-secondary p-8">কোনো ডেটা পাওয়া যায়নি।</p>`;
                return null;
            }
            return new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: title,
                        data: counts,
                        backgroundColor: ['#785A3E', '#A07C5B', '#C8A27C', '#E6CBA8', '#FDF8F0', '#BFA280', '#D9C2A9'],
                        hoverOffset: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
            });
        };

        // Doughnut Chart: Genre Distribution
        const genreCounts = books.reduce((acc, book) => {
            if (book.genre) { acc[book.genre] = (acc[book.genre] || 0) + 1; }
            return acc;
        }, {});
        genreChart = createDoughnutChart(genreChartCanvas, genreChart, genreCounts, 'বইয়ের ধরণ (Genre)');

        // Doughnut Chart: Format Distribution
        const formatCounts = books.reduce((acc, book) => {
            if (book.format) { acc[book.format] = (acc[book.format] || 0) + 1; }
            return acc;
        }, {});
        formatChart = createDoughnutChart(formatChartCanvas, formatChart, formatCounts, 'বইয়ের ফরম্যাট');
    };

    /**
     * Displays the user's earned badges.
     * @param {Array} userBadges - The user's badge data from Supabase.
     */
    const displayUserBadges = (userBadges) => {
        badgesContainer.innerHTML = ''; // Clear previous badges
        if (!userBadges || userBadges.length === 0) {
            badgesContainer.innerHTML = '<p class="text-secondary col-span-full text-center">এখনো কোনো ব্যাজ অর্জন করা হয়নি।</p>';
            return;
        }

        userBadges.forEach(item => {
            const badge = item.badges;
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge-item';
            badgeElement.innerHTML = `
                <div class="badge-icon">${badge.icon || '🏆'}</div>
                <div class="badge-name">${badge.name}</div>
                <p class="badge-description">${badge.description}</p>
            `;
            badgesContainer.appendChild(badgeElement);
        });
    };

    // --- Event Handlers ---
    nameUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFullName = fullNameInput.value.trim();
        if (!newFullName) return showToast('অনুগ্রহ করে আপনার নাম লিখুন।', 'error');
        setButtonLoading(updateNameBtn, true);
        try {
            const { data: { user } } = await _supabase.auth.updateUser({ data: { full_name: newFullName } });
            await _supabase.from('profiles').upsert({ id: user.id, username: newFullName });
            showToast('আপনার নাম সফলভাবে আপডেট করা হয়েছে!');
            userNameHeader.textContent = `স্বাগতম, ${newFullName}`;
        } catch (error) {
            showToast('নাম আপডেট করা সম্ভব হয়নি।', 'error');
        } finally {
            setButtonLoading(updateNameBtn, false);
        }
    });

    avatarUploadInput.addEventListener('change', () => {
        const file = avatarUploadInput.files[0];
        fileInputLabel.textContent = file ? file.name : 'ফাইল বাছাই করুন';
        uploadAvatarBtn.disabled = !file;
    });

    avatarUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = avatarUploadInput.files[0];
        if (!file) return showToast('অনুগ্রহ করে একটি ছবি বাছাই করুন।', 'error');
        setButtonLoading(uploadAvatarBtn, true);
        try {
            const filePath = `${currentUser.id}/avatar.${file.name.split('.').pop()}`;
            await _supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            await _supabase.from('profiles').upsert({ id: currentUser.id, avatar_url: filePath });
            const { data } = await _supabase.storage.from('avatars').createSignedUrl(filePath, 3600);
            if(profileAvatar) profileAvatar.src = data.signedUrl;
            if(headerAvatar) headerAvatar.src = data.signedUrl;
            showToast('প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!');
        } catch (error) {
            showToast('প্রোফাইল ছবি আপডেট করা সম্ভব হয়নি।', 'error');
        } finally {
            setButtonLoading(uploadAvatarBtn, false);
            avatarUploadForm.reset();
            fileInputLabel.textContent = 'ফাইল বাছাই করুন';
            uploadAvatarBtn.disabled = true;
        }
    });

    passwordUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value.trim();
        if (newPassword.length < 6) return showToast('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
        setButtonLoading(updatePasswordBtn, true);
        try {
            await _supabase.auth.updateUser({ password: newPassword });
            showToast('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
            passwordUpdateForm.reset();
        } catch (error) {
            showToast(`ত্রুটি: ${error.message}`, 'error');
        } finally {
            setButtonLoading(updatePasswordBtn, false);
        }
    });

    downloadDataBtn.addEventListener('click', async () => {
        showToast('ডেটা প্রস্তুত করা হচ্ছে...');
        try {
            const { data: books, error } = await _supabase.from('books').select('*').eq('user_id', currentUser.id);
            if (error) throw error;
            if (!books.length) return showToast('ডাউনলোড করার মতো কোনো বই নেই।', 'info');
            
            const csv = Papa.unparse(books);
            const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'amar_pathshala_data.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('ডেটা ডাউনলোড শুরু হয়েছে।');
        } catch (err) {
            showToast('ডেটা ডাউনলোড করা সম্ভব হয়নি।', 'error');
        }
    });

    /**
     * Handles the Goodreads CSV import process.
     */
    importBtn.addEventListener('click', () => {
        const file = csvImportInput.files[0];
        if (!file) {
            return showToast('অনুগ্রহ করে একটি CSV ফাইল বাছাই করুন।', 'error');
        }
        showToast('ফাইল পার্স করা হচ্ছে...');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                showToast('ইম্পোর্ট শুরু হচ্ছে... এটি কিছুক্ষণ সময় নিতে পারে।');
                const goodreadsBooks = results.data;
                const booksToInsert = [];

                for (const book of goodreadsBooks) {
                    // Map Goodreads columns to your Supabase columns
                    const newBook = {
                        user_id: currentUser.id,
                        title: book['Title'],
                        author: book['Author'],
                        isbn: book['ISBN13'] || book['ISBN'],
                        page_count: parseInt(book['Number of Pages'], 10) || null,
                        cover_image_url: book['Book Id'] ? `https://images.gr-assets.com/books/v1/books/show/${book['Book Id']}.jpg` : null,
                        rating: parseInt(book['My Rating'], 10) || null,
                        finish_date: book['Date Read'] ? new Date(book['Date Read']).toISOString() : null,
                        personal_notes: book['My Review'] || null,
                        status: 'want_to_read' // Default status
                    };

                    // Determine status from bookshelves
                    const shelves = book['Bookshelves'] || '';
                    if (shelves.includes('read')) {
                        newBook.status = 'read';
                    } else if (shelves.includes('currently-reading')) {
                        newBook.status = 'reading';
                    }
                    
                    if (newBook.title && newBook.author) {
                       booksToInsert.push(newBook);
                    }
                }

                if (booksToInsert.length === 0) {
                    return showToast('ফাইল থেকে কোনো বৈধ বই পাওয়া যায়নি।', 'error');
                }

                try {
                    const { error } = await _supabase.from('books').insert(booksToInsert);
                    if (error) throw error;
                    
                    showToast(`সফলভাবে ${booksToInsert.length.toLocaleString('bn-BD')}টি বই ইম্পোর্ট করা হয়েছে!`, 'success');
                    // Refresh page data after successful import
                    initializePageContent();
                } catch (error) {
                    console.error('Bulk insert error:', error);
                    showToast('বইগুলো ডাটাবেসে যোগ করতে সমস্যা হয়েছে।', 'error');
                }
            },
            error: (err) => {
                showToast(`ফাইল পড়তে সমস্যা হয়েছে: ${err.message}`, 'error');
            }
        });
    });

    deleteAccountBtn.addEventListener('click', () => {
        showToast('এই কার্যকারিতাটির জন্য একটি নিরাপদ কাস্টম মডেল প্রয়োজন।', 'info');
    });

    /**
     * Fetches data and populates the page content. Can be re-called to refresh.
     */
    const initializePageContent = async () => {
        const allData = await fetchAllData();
        if (allData) {
            const { books, shelfCount, quoteCount, userBadges } = allData;
            displayAllStats(books, shelfCount, quoteCount);
            renderAllCharts(books);
            displayUserBadges(userBadges);
        }
    };
    
    /**
     * Main function to initialize the entire page on first load.
     */
    const initializePage = async () => {
        initializeTheme();
        try {
            const { data: { user }, error: authError } = await _supabase.auth.getUser();
            if (authError || !user) {
                window.location.replace('login.html');
                return;
            }
            currentUser = user;
            
            const { data: profile } = await _supabase.from('profiles').select('username, avatar_url').eq('id', currentUser.id).single();
            const displayName = profile?.username || user.user_metadata?.full_name || 'ব্যবহারকারী';
            
            userNameHeader.textContent = `স্বাগতম, ${displayName}`;
            fullNameInput.value = displayName;
            
            let avatarSrc = `https://placehold.co/128x128/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            if (profile?.avatar_url) {
                const { data } = await _supabase.storage.from('avatars').createSignedUrl(profile.avatar_url, 3600);
                if (data) avatarSrc = data.signedUrl;
            }
            if (profileAvatar) profileAvatar.src = avatarSrc;
            if (headerAvatar) headerAvatar.src = avatarSrc;

            await initializePageContent();

        } catch (error) {
            console.error("Error initializing page:", error);
            showToast('পৃষ্ঠা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।', 'error');
        }
    };

    initializePage();
});
