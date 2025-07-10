document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    // This block was added to fix the potential "_supabase is not defined" error.
    // Ensure the global supabase client is available. If not, uncomment the lines below.
    // const SUPABASE_URL = 'YOUR_SUPABASE_URL';
    // const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
    // const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // A simple toast notification function (assuming a global showToast is available)
    const showToast = (message, type = 'success') => {
        // Fallback toast if global one isn't found
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
    const totalBooksReadElem = document.getElementById('total-books-read');
    const totalPagesReadElem = document.getElementById('total-pages-read');
    
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

    // Chart
    const readingChartCanvas = document.getElementById('reading-chart');
    
    // Data Management
    const downloadDataBtn = document.getElementById('download-data-btn');

    // Danger Zone
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    let currentUser = null;
    let readingChart = null;

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

    const calculateAndDisplayStats = async () => {
        if (!currentUser) return;

        totalBooksReadElem.textContent = 'লোড হচ্ছে...';
        totalPagesReadElem.textContent = 'লোড হচ্ছে...';

        try {
            const { data: books, error } = await _supabase
                .from('books')
                .select('status, page_count')
                .eq('user_id', currentUser.id);

            if (error) throw error;

            const readBooks = books.filter(book => book.status === 'read');
            const totalBooks = readBooks.length;
            const totalPages = readBooks.reduce((sum, book) => sum + (Number(book.page_count) || 0), 0);

            totalBooksReadElem.textContent = totalBooks.toLocaleString('bn-BD');
            totalPagesReadElem.textContent = totalPages.toLocaleString('bn-BD');
        } catch(error) {
            console.error('Error fetching book stats:', error);
            totalBooksReadElem.textContent = 'ত্রুটি';
            totalPagesReadElem.textContent = 'ত্রুটি';
            showToast('পরিসংখ্যান লোড করা সম্ভব হয়নি।', 'error');
        }
    };

    nameUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newFullName = fullNameInput.value.trim();
        if (!newFullName) {
            showToast('অনুগ্রহ করে আপনার নাম লিখুন।', 'error');
            return;
        }

        setButtonLoading(updateNameBtn, true);

        try {
            const { data: { user }, error: userError } = await _supabase.auth.updateUser({
                data: { full_name: newFullName }
            });
            if (userError) throw userError;

            const { error: profileError } = await _supabase
                .from('profiles')
                .upsert({ id: currentUser.id, username: newFullName }, { onConflict: 'id' });

            if (profileError) throw profileError;

            showToast('আপনার নাম সফলভাবে আপডেট করা হয়েছে!');
            userNameHeader.textContent = `স্বাগতম, ${newFullName}`;

        } catch (error) {
            console.error('Name update error:', error);
            showToast('নাম আপডেট করা সম্ভব হয়নি।', 'error');
        } finally {
            setButtonLoading(updateNameBtn, false);
        }
    });

    avatarUploadInput.addEventListener('change', () => {
        const file = avatarUploadInput.files[0];
        if (file) {
            fileInputLabel.textContent = file.name;
            uploadAvatarBtn.disabled = false;
        } else {
            fileInputLabel.textContent = 'ফাইল বাছাই করুন';
            uploadAvatarBtn.disabled = true;
        }
    });

    avatarUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = avatarUploadInput.files[0];
        if (!file) {
            showToast('অনুগ্রহ করে একটি ছবি বাছাই করুন।', 'error');
            return;
        }

        setButtonLoading(uploadAvatarBtn, true);

        try {
            // 1. Define the file path, not a full URL.
            const fileExt = file.name.split('.').pop();
            const filePath = `${currentUser.id}/avatar.${fileExt}`;

            // 2. Upload the file to the private 'avatars' bucket.
            const { error: uploadError } = await _supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true, // Overwrite existing file for the user
                });
            if (uploadError) throw uploadError;

            // 3. Update the 'profiles' table with the FILE PATH.
            const { error: updateError } = await _supabase
                .from('profiles')
                .upsert({ id: currentUser.id, avatar_url: filePath }, { onConflict: 'id' });
            if (updateError) throw updateError;
            
            // 4. Create a short-lived signed URL to display the image immediately.
            const { data: signedUrlData, error: signedUrlError } = await _supabase.storage
                .from('avatars')
                .createSignedUrl(filePath, 60); // Valid for 60 seconds
            if (signedUrlError) throw signedUrlError;

            // 5. Set the image sources to the new signed URL.
            const newAvatarSrc = signedUrlData.signedUrl;
            if(profileAvatar) profileAvatar.src = newAvatarSrc;
            if(headerAvatar) headerAvatar.src = newAvatarSrc;
            
            showToast('প্রোফাইল ছবি সফলভাবে আপলোড হয়েছে!');

        } catch (error) {
            console.error('Avatar upload/update error:', error);
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

        if (newPassword.length < 6) {
            showToast('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।', 'error');
            return;
        }

        setButtonLoading(updatePasswordBtn, true);

        try {
            const { error } = await _supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            showToast('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
            passwordUpdateForm.reset();

        } catch (error) {
            console.error('Password update error:', error);
            showToast(`ত্রুটি: ${error.message}`, 'error');
        } finally {
            setButtonLoading(updatePasswordBtn, false);
        }
    });

    const renderReadingChart = async () => {
        // Chart rendering logic remains the same
        if (!currentUser || !readingChartCanvas) return;
        
        try {
            const { data: books, error } = await _supabase
                .from('books')
                .select('status, created_at')
                .eq('user_id', currentUser.id)
                .eq('status', 'read');

            if (error) throw error;

            const currentYear = new Date().getFullYear();
            const monthlyCounts = Array(12).fill(0);
            const bengaliMonths = [
                "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
                "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
            ];
            
            books.forEach(book => {
                const readDate = new Date(book.created_at);
                if (readDate.getFullYear() === currentYear) {
                    const month = readDate.getMonth();
                    monthlyCounts[month]++;
                }
            });

            if (readingChart) {
                readingChart.destroy();
            }

            readingChart = new Chart(readingChartCanvas, {
                type: 'bar',
                data: {
                    labels: bengaliMonths,
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
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } },
                    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${c.raw.toLocaleString('bn-BD')} টি বই` } } }
                }
            });
        } catch (error) {
            console.error('Chart data fetch error:', error);
            showToast('চার্টের ডেটা লোড করা সম্ভব হয়নি।', 'error');
        }
    };

    const exportDataToCSV = async () => {
        // Data export logic remains the same
        showToast('ডেটা প্রস্তুত করা হচ্ছে...');
        try {
            const { data: books, error } = await _supabase
                .from('books')
                .select('title,author,status,page_count,rating,personal_notes,created_at')
                .eq('user_id', currentUser.id);

            if (error) throw error;
            if (books.length === 0) {
                showToast('ডাউনলোড করার মতো কোনো বই নেই।', 'info');
                return;
            }
            const headers = ['Title', 'Author', 'Status', 'Page Count', 'Rating (1-5)', 'Personal Notes', 'Date Added'];
            let csvContent = headers.join(',') + '\r\n';
            books.forEach(b => {
                const row = [`"${b.title||''}"`,`"${b.author||''}"`,b.status||'',b.page_count||'',b.rating||'',`"${(b.personal_notes||'').replace(/"/g,'""')}"`,new Date(b.created_at).toLocaleDateString('en-CA')];
                csvContent += row.join(',') + '\r\n';
            });
            const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', 'amar_pathshala_data.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('ডেটা ডাউনলোড শুরু হয়েছে।');
        } catch (err) {
            console.error('Data export error:', err);
            showToast('ডেটা ডাউনলোড করা সম্ভব হয়নি।', 'error');
        }
    };

    downloadDataBtn.addEventListener('click', exportDataToCSV);

    deleteAccountBtn.addEventListener('click', () => {
        // This requires a secure confirmation modal, not window.confirm
        showToast('এই কার্যকারিতাটির জন্য একটি নিরাপদ কাস্টম মডেল প্রয়োজন।', 'info');
    });

    const initializePage = async () => {
        try {
            const { data: { user }, error: authError } = await _supabase.auth.getUser();
            if (authError || !user) {
                window.location.replace('login.html');
                return;
            }
            
            currentUser = user;
            
            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (profileError) throw profileError;

            const displayName = profile?.username || user.user_metadata?.full_name || 'ব্যবহারকারী';
            
            userNameHeader.textContent = `স্বাগতম, ${displayName}`;
            fullNameInput.value = displayName;
            
            // 1. Set a default avatar source.
            let avatarSrc = `https://placehold.co/128x128/EAE0D5/4A3F35?text=${encodeURIComponent(displayName.charAt(0))}`;
            
            // 2. If an avatar path exists in the profile, create a signed URL for it.
            if (profile && profile.avatar_url) {
                try {
                    const { data: signedUrlData, error: signedUrlError } = await _supabase.storage
                        .from('avatars')
                        .createSignedUrl(profile.avatar_url, 3600); // Valid for 1 hour

                    if (signedUrlError) throw signedUrlError;
                    
                    // 3. If successful, update the avatar source.
                    avatarSrc = signedUrlData.signedUrl;

                } catch (error) {
                    console.error('Error creating signed URL for profile avatar:', error);
                    showToast('প্রোফাইল ছবি লোড করা যায়নি।', 'error');
                    // If creating the URL fails, the placeholder will be used.
                }
            }

            // 4. Set the avatar sources on the page.
            if (profileAvatar) profileAvatar.src = avatarSrc;
            if (headerAvatar) headerAvatar.src = avatarSrc;

            await Promise.all([
                calculateAndDisplayStats(),
                renderReadingChart()
            ]);

        } catch (error) {
            console.error("Error initializing page:", error);
            showToast('পৃষ্ঠা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।', 'error');
        }
    };

    initializePage();
});
