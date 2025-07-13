document.addEventListener('DOMContentLoaded', () => {
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
    const statsShelfCountElem = document.getElementById('stats-shelf-count');
    const statsQuoteCountElem = document.getElementById('stats-quote-count');

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

    // Achievements
    const badgesContainer = document.getElementById('badges-container');

    // Data Management
    const downloadDataBtn = document.getElementById('download-data-btn');
    const csvImportInput = document.getElementById('csv-import-input');
    const importBtn = document.getElementById('import-btn');

    // Danger Zone
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const logoutBtn = document.getElementById('logout-btn'); // New Logout Button

    // Theme Switcher
    const themeOptions = document.querySelectorAll('.theme-option');

    // Reading Goal Elements
    const goalProgressText = document.getElementById('goal-progress-text');
    const goalProgressBar = document.getElementById('goal-progress-bar');
    const goalUpdateForm = document.getElementById('goal-update-form');
    const readingGoalInput = document.getElementById('reading-goal-input');
    const updateGoalBtn = document.getElementById('update-goal-btn');

    let currentUser = null;
    let readingChart = null;

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
            if (option) {
                option.classList.toggle('active', option.dataset.theme === activeTheme);
            }
        });
    };

    if (themeOptions.length > 0) {
        themeOptions.forEach(option => {
            if (option) {
                option.addEventListener('click', () => {
                    const selectedTheme = option.dataset.theme;
                    applyTheme(selectedTheme);
                    showToast(`থিম "${selectedTheme}"-এ পরিবর্তন করা হয়েছে।`, 'success');
                });
            }
        });
    }

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
            if (buttonText) buttonText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
        } else {
            if (buttonText) buttonText.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    };

    // --- Data Fetching and Display ---
    const fetchAllData = async () => {
        if (!currentUser) return;
        try {
            const [
                { data: books, error: booksError },
                { count: shelfCount, error: shelfError },
                { count: quoteCount, error: quoteError },
                { data: userBadges, error: badgeError }
            ] = await Promise.all([
                _supabase.from('books').select('status,created_at,finish_date').eq('user_id', currentUser.id),
                _supabase.from('custom_shelves').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                _supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('user_id', currentUser.id),
                _supabase.from('user_badges').select('badges(name, description, icon_url)').eq('user_id', currentUser.id)
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

    const displayAllStats = (books, shelfCount, quoteCount) => {
        const readCount = books.filter(b => b.status === 'read').length;
        const readingCount = books.filter(b => b.status === 'reading').length;
        const wantToReadCount = books.filter(b => b.status === 'want_to_read').length;

        if (statsReadCountElem) statsReadCountElem.textContent = readCount.toLocaleString('bn-BD');
        if (statsReadingCountElem) statsReadingCountElem.textContent = readingCount.toLocaleString('bn-BD');
        if (statsWantToReadCountElem) statsWantToReadCountElem.textContent = wantToReadCount.toLocaleString('bn-BD');
        if (statsShelfCountElem) statsShelfCountElem.textContent = (shelfCount || 0).toLocaleString('bn-BD');
        if (statsQuoteCountElem) statsQuoteCountElem.textContent = (quoteCount || 0).toLocaleString('bn-BD');
    };

    const renderAllCharts = (books) => {
        const readingChartCanvas = document.getElementById('reading-chart');
        if (readingChartCanvas) {
            const currentYear = new Date().getFullYear();
            const monthlyCounts = Array(12).fill(0);
            books.forEach(book => {
                const dateStr = book.status === 'read' ? book.finish_date : book.created_at;
                if (dateStr) {
                    const readDate = new Date(dateStr);
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
                    responsive: true, 
                    maintainAspectRatio: false,
                    animation: false,
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw.toLocaleString('bn-BD')} টি বই` } } }
                }
            });
        }
    };

    const displayUserBadges = (userBadges) => {
        if (!badgesContainer) return;
        badgesContainer.innerHTML = '';
        if (!userBadges || userBadges.length === 0) {
            badgesContainer.innerHTML = '<p class="text-secondary col-span-full text-center">এখনো কোনো ব্যাজ অর্জন করা হয়নি।</p>';
            return;
        }
        userBadges.forEach(item => {
            const badge = item.badges;
            if (badge) {
                const badgeElement = document.createElement('div');
                badgeElement.className = 'badge-item';
                badgeElement.innerHTML = `
                    <div class="badge-icon">${badge.icon_url || '🏆'}</div>
                    <div class="badge-name">${badge.name}</div>
                    <p class="badge-description">${badge.description}</p>
                `;
                badgesContainer.appendChild(badgeElement);
            }
        });
    };
    
    // --- Reading Goal Functions ---
    const displayReadingGoal = (readCount, goal) => {
        const currentGoal = goal || 0;
        if (readingGoalInput) readingGoalInput.value = currentGoal > 0 ? currentGoal : '';

        if (currentGoal > 0) {
            const progress = Math.min((readCount / currentGoal) * 100, 100);
            if (goalProgressBar) goalProgressBar.style.width = `${progress}%`;
            if (goalProgressText) goalProgressText.textContent = `${readCount.toLocaleString('bn-BD')} / ${currentGoal.toLocaleString('bn-BD')} বই`;
        } else {
            if (goalProgressBar) goalProgressBar.style.width = '0%';
            if (goalProgressText) goalProgressText.textContent = 'কোনো লক্ষ্য নির্ধারণ করা হয়নি';
        }
    };

    // --- Event Handlers ---
    if (nameUpdateForm) {
        nameUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!fullNameInput) return;
            const newFullName = fullNameInput.value.trim();
            if (!newFullName) return showToast('অনুগ্রহ করে আপনার নাম লিখুন।', 'error');
            setButtonLoading(updateNameBtn, true);
            try {
                const { data: { user } } = await _supabase.auth.updateUser({ data: { full_name: newFullName } });
                await _supabase.from('profiles').upsert({ id: user.id, username: newFullName });
                showToast('আপনার নাম সফলভাবে আপডেট করা হয়েছে!');
                if (userNameHeader) userNameHeader.textContent = `স্বাগতম, ${newFullName}`;
            } catch (error) {
                showToast('নাম আপডেট করা সম্ভব হয়নি।', 'error');
            } finally {
                setButtonLoading(updateNameBtn, false);
            }
        });
    }

    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', () => {
            const file = avatarUploadInput.files[0];
            if (fileInputLabel) fileInputLabel.textContent = file ? file.name : 'ফাইল বাছাই করুন';
            if (uploadAvatarBtn) uploadAvatarBtn.disabled = !file;
        });
    }

    if (avatarUploadForm) {
        avatarUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!avatarUploadInput) return;
            const file = avatarUploadInput.files[0];
            if (!file) return showToast('অনুগ্রহ করে একটি ছবি বাছাই করুন।', 'error');
            setButtonLoading(uploadAvatarBtn, true);
            try {
                const filePath = `${currentUser.id}/avatar.${file.name.split('.').pop()}`;
                await _supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
                await _supabase.from('profiles').upsert({ id: currentUser.id, avatar_url: filePath });
                const { data } = await _supabase.storage.from('avatars').createSignedUrl(filePath, 3600);
                if (data) {
                    if (profileAvatar) profileAvatar.src = data.signedUrl;
                    if (headerAvatar) headerAvatar.src = data.signedUrl;
                }
                showToast('প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!');
            } catch (error) {
                showToast('প্রোফাইল ছবি আপডেট করা সম্ভব হয়নি।', 'error');
            } finally {
                setButtonLoading(uploadAvatarBtn, false);
                avatarUploadForm.reset();
                if (fileInputLabel) fileInputLabel.textContent = 'ফাইল বাছাই করুন';
                if (uploadAvatarBtn) uploadAvatarBtn.disabled = true;
            }
        });
    }

    if (passwordUpdateForm) {
        passwordUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!newPasswordInput) return;
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
    }

    if (goalUpdateForm) {
        goalUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newGoal = parseInt(readingGoalInput.value, 10);
            if (!newGoal || newGoal < 1) {
                return showToast('অনুগ্রহ করে একটি সঠিক সংখ্যা দিন।', 'error');
            }
            setButtonLoading(updateGoalBtn, true);
            try {
                const { error } = await _supabase
                    .from('profiles')
                    .update({ reading_goal: newGoal })
                    .eq('id', currentUser.id);
    
                if (error) throw error;
    
                showToast('আপনার লক্ষ্য সফলভাবে সেভ হয়েছে!');
                
                const { count, error: countError } = await _supabase
                    .from('books')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', currentUser.id)
                    .eq('status', 'read');
                
                if (countError) throw countError;
                displayReadingGoal(count, newGoal);
    
            } catch (error) {
                console.error('Error updating goal:', error);
                showToast('লক্ষ্য সেভ করতে সমস্যা হয়েছে।', 'error');
            } finally {
                setButtonLoading(updateGoalBtn, false);
            }
        });
    }

    if (downloadDataBtn) {
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
    }

    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (!csvImportInput) return showToast('CSV import element not found.', 'error');
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
                    const booksToInsert = goodreadsBooks.map(book => {
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
                            status: 'want_to_read'
                        };
                        const shelves = book['Bookshelves'] || '';
                        if (shelves.includes('read')) newBook.status = 'read';
                        else if (shelves.includes('currently-reading')) newBook.status = 'reading';
                        return newBook;
                    }).filter(book => book.title && book.author);

                    if (booksToInsert.length === 0) {
                        return showToast('ফাইল থেকে কোনো বৈধ বই পাওয়া যায়নি।', 'error');
                    }
                    try {
                        const { error } = await _supabase.from('books').insert(booksToInsert);
                        if (error) throw error;
                        showToast(`সফলভাবে ${booksToInsert.length.toLocaleString('bn-BD')}টি বই ইম্পোর্ট করা হয়েছে!`, 'success');
                        initializePage();
                    } catch (error) {
                        console.error('Bulk insert error:', error);
                        showToast('বইগুলো ডাটাবেসে যোগ করতে সমস্যা হয়েছে।', 'error');
                    }
                },
                error: (err) => showToast(`ফাইল পড়তে সমস্যা হয়েছে: ${err.message}`, 'error')
            });
        });
    }
    
    // --- New Logout Handler ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                showToast('লগ আউট করা হচ্ছে...', 'info');
                const { error } = await _supabase.auth.signOut();
                if (error) {
                    throw error;
                }
                // Redirect to login page after a short delay to allow toast to be seen
                setTimeout(() => {
                    window.location.replace('login.html');
                }, 1000);
            } catch (error) {
                console.error('Error logging out:', error);
                showToast('লগ আউট করতে সমস্যা হয়েছে।', 'error');
            }
        });
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            showToast('এই কার্যকারিতাটির জন্য একটি নিরাপদ কাস্টম মডেল প্রয়োজন।', 'info');
        });
    }

    const initializePageContent = async (profile) => {
        const allData = await fetchAllData();
        if (allData) {
            const { books, shelfCount, quoteCount, userBadges } = allData;
            const readCount = books.filter(b => b.status === 'read').length;
            displayAllStats(books, shelfCount, quoteCount);
            renderAllCharts(books);
            displayUserBadges(userBadges);
            displayReadingGoal(readCount, profile?.reading_goal);
        }
    };

    const initializePage = async () => {
        initializeTheme();
        try {
            const { data: { user }, error: authError } = await _supabase.auth.getUser();
            if (authError || !user) {
                window.location.replace('login.html');
                return;
            }
            currentUser = user;

            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('username, avatar_url, reading_goal')
                .eq('id', currentUser.id)
                .single();
            
            if (profileError) {
                console.error("Error fetching profile:", profileError);
            }

            const displayName = profile?.username || user.user_metadata?.full_name || 'ব্যবহারকারী';
            if (userNameHeader) userNameHeader.textContent = `স্বাগতম, ${displayName}`;
            if (fullNameInput) fullNameInput.value = displayName;

            let avatarSrc = `https://placehold.co/128x128/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            if (profile?.avatar_url) {
                const { data } = await _supabase.storage.from('avatars').createSignedUrl(profile.avatar_url, 3600);
                if (data) avatarSrc = data.signedUrl;
            }
            if (profileAvatar) profileAvatar.src = avatarSrc;
            if (headerAvatar) headerAvatar.src = avatarSrc;

            await initializePageContent(profile);

        } catch (error) {
            console.error("Error initializing page:", error);
            showToast('পৃষ্ঠা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।', 'error');
        }
    };

    initializePage();
});
