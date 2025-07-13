/**
 * loans.js
 * উদ্দেশ্য: 'আমার পাঠশালা' অ্যাপ্লিকেশনের ধার-দেনা পেজের সমস্ত কার্যকারিতা নিয়ন্ত্রণ করা।
 * সংস্করণ: 8.0 (History Management Update)
 * লেখক: Gemini & Riyad Hossain Huzaifa
 * বর্ণনা: এই ফাইলটি ব্যবহারকারীর সেশন যাচাই করে, Supabase থেকে ধার তালিকা লোড করে এবং নতুন ফিচার যোগ করে:
 * 1. লোন অ্যানালিটিক্স
 * 2. লোন তথ্য সম্পাদনা
 * 3. ঋণগ্রহীতার যোগাযোগ ও নোট
 * 4. আনডু (Undo) কার্যকারিতা
 * 5. ইতিহাস সার্চ ও ফিল্টার
 * 6. বাল্ক অ্যাকশন
 * 7. ক্যালেন্ডার ইন্টিগ্রেশন
 * 8. উন্নত UI/UX এবং ফিডব্যাক
 * 9. ইতিহাস থেকে লোন পুনরায় চালু (Re-activate) করা
 * 10. ইতিহাস থেকে রেকর্ড স্থায়ীভাবে মুছে ফেলা
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM উপাদানসমূহ নির্বাচন ---
    const loanedOutTab = document.getElementById('loaned-out-tab');
    const borrowedTab = document.getElementById('borrowed-tab');
    const loanedOutPanel = document.getElementById('loaned-out-panel');
    const borrowedPanel = document.getElementById('borrowed-panel');
    const historyToggle = document.getElementById('history-toggle');
    const historySearchContainer = document.getElementById('history-search-container');
    const historySearchInput = document.getElementById('history-search-input');
    
    // অ্যানালিটিক্স কার্ড
    const statsMostLoaned = document.getElementById('stats-most-loaned');
    const statsTopBorrower = document.getElementById('stats-top-borrower');
    const statsAvgDuration = document.getElementById('stats-avg-duration');
    
    // এডিট মডাল
    const editLoanModal = document.getElementById('edit-loan-modal');
    const editLoanForm = document.getElementById('edit-loan-form');
    const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
    
    // বাল্ক অ্যাকশন
    const bulkActionBar = document.getElementById('bulk-action-bar');
    const bulkSelectedCount = document.getElementById('bulk-selected-count');
    const bulkReturnBtn = document.getElementById('bulk-return-btn');
    
    // টোস্ট নোটিফিকেশন
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    const toastUndoBtn = document.getElementById('toast-undo-btn');

    // --- স্টেট ভ্যারিয়েবল ---
    let currentUser = null;
    let showHistory = false;
    let allLoans = []; // সব লোনের ডেটা এখানে ক্যাশ করা হবে
    let allBorrowed = []; // সব ধার করা বইয়ের ডেটা
    let selectedItems = new Set(); // বাল্ক অ্যাকশনের জন্য
    let undoTimeout = null;
    let lastReturnedItem = null;

    // --- হেলপার ফাংশন ---
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const showToast = (message, isUndoable = false) => {
        clearTimeout(undoTimeout); // আগের কোনো টাইমার থাকলে বাতিল করুন
        toastMessage.textContent = message;
        toast.classList.remove('hidden', 'toast-enter-from');
        
        if (isUndoable) {
            toastUndoBtn.classList.remove('hidden');
            undoTimeout = setTimeout(() => {
                hideToast();
                lastReturnedItem = null; // আনডু করার সুযোগ শেষ
            }, 5000); // ৫ সেকেন্ড পর টোস্ট অটোমেটিক হাইড হবে
        } else {
            toastUndoBtn.classList.add('hidden');
            setTimeout(hideToast, 3000); // ৩ সেকেন্ড পর সাধারণ টোস্ট হাইড হবে
        }
    };

    const hideToast = () => {
        toast.classList.add('toast-leave-to');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('toast-leave-to');
        }, 500);
    };

    const showLoader = (panel) => {
        panel.innerHTML = `<div class="text-center py-10 flex flex-col items-center justify-center text-gray-500"><svg class="animate-spin h-8 w-8 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p>তালিকা লোড হচ্ছে...</p></div>`;
    };

    const showEmptyMessage = (panel, message) => {
        panel.innerHTML = `<div class="text-center py-10 px-4 bg-gray-50 rounded-lg"><p class="text-gray-500">${message}</p></div>`;
    };

    // --- প্রধান ফাংশনসমূহ ---

    /**
     * ব্যবহারকারী লগইন করা আছে কিনা তা পরীক্ষা করে এবং প্রধান ফাংশনগুলো শুরু করে।
     */
    const checkUserSession = async () => {
        try {
            if (typeof _supabase === 'undefined') throw new Error("Supabase client is not initialized.");
            const { data: { session }, error } = await _supabase.auth.getSession();
            if (error) throw error;
            if (!session?.user) {
                window.location.href = 'login.html';
                return;
            }
            currentUser = session.user;
            await fetchAllData();
        } catch (error) {
            console.error("সেশন যাচাই করতে সমস্যা:", error.message);
            showEmptyMessage(loanedOutPanel, "ব্যবহারকারীর তথ্য যাচাই করা যায়নি।");
            showEmptyMessage(borrowedPanel, "অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।");
        }
    };

    /**
     * ডাটাবেস থেকে সব ডেটা এনে ক্যাশ করে এবং UI রেন্ডার করে।
     */
    const fetchAllData = async () => {
        if (!currentUser) return;
        showLoader(loanedOutPanel);
        showLoader(borrowedPanel);

        try {
            const [loansRes, borrowedRes] = await Promise.all([
                _supabase.from('loans').select(`*, books(title)`).eq('user_id', currentUser.id),
                _supabase.from('borrowed_books').select(`*`).eq('user_id', currentUser.id)
            ]);

            if (loansRes.error) throw loansRes.error;
            if (borrowedRes.error) throw borrowedRes.error;

            allLoans = loansRes.data;
            allBorrowed = borrowedRes.data;

            renderAllLists();
            calculateAndDisplayAnalytics(allLoans); // অ্যানালিটিক্স গণনা
        } catch (error) {
            console.error('ডেটা আনতে সমস্যা:', error.message);
            showEmptyMessage(loanedOutPanel, 'বইয়ের তালিকা আনতে ব্যর্থ।');
            showEmptyMessage(borrowedPanel, 'সংযোগ পরীক্ষা করুন।');
        }
    };
    
    /**
     * উভয় তালিকা (ধার দেওয়া ও নেওয়া) ফিল্টার ও সার্চ করে রেন্ডার করে।
     */
    const renderAllLists = () => {
        renderLoanedOutBooks();
        renderBorrowedBooks();
    };

    /**
     * Feature 1: লোন পরিসংখ্যান গণনা এবং প্রদর্শন।
     */
    const calculateAndDisplayAnalytics = (loans) => {
        const returnedLoans = loans.filter(l => l.is_returned && l.returned_at && l.loan_date);

        if (returnedLoans.length === 0) {
            statsMostLoaned.textContent = 'কোনো ইতিহাস নেই';
            statsTopBorrower.textContent = 'কোনো ইতিহাস নেই';
            statsAvgDuration.textContent = 'N/A';
            return;
        }

        // Most Loaned Book
        const bookCounts = returnedLoans.reduce((acc, loan) => {
            const title = loan.books?.title || 'অজানা বই';
            acc[title] = (acc[title] || 0) + 1;
            return acc;
        }, {});
        const mostLoaned = Object.keys(bookCounts).reduce((a, b) => bookCounts[a] > bookCounts[b] ? a : b, 'N/A');
        statsMostLoaned.textContent = mostLoaned;

        // Top Borrower
        const borrowerCounts = returnedLoans.reduce((acc, loan) => {
            const name = loan.borrower_name || 'অজানা ব্যক্তি';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});
        const topBorrower = Object.keys(borrowerCounts).reduce((a, b) => borrowerCounts[a] > borrowerCounts[b] ? a : b, 'N/A');
        statsTopBorrower.textContent = topBorrower;

        // Average Loan Duration
        const totalDuration = returnedLoans.reduce((acc, loan) => {
            const loanDate = new Date(loan.loan_date);
            const returnDate = new Date(loan.returned_at);
            const diffTime = Math.abs(returnDate - loanDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return acc + diffDays;
        }, 0);
        const avgDays = Math.round(totalDuration / returnedLoans.length);
        statsAvgDuration.textContent = `${avgDays} দিন`;
    };

    /**
     * ধার দেওয়া বা নেওয়া বইয়ের জন্য একটি কার্ড তৈরি করে।
     */
    const createLoanCard = (item, type) => {
        const isLoaned = type === 'loaned';
        const title = isLoaned ? (item.books?.title || 'অজানা বই') : item.title;
        const personLabel = isLoaned ? 'ঋণগ্রহীতা' : 'ঋণদাতা';
        const personName = isLoaned ? item.borrower_name : item.lender_name;
        const date = isLoaned ? item.loan_date : item.borrow_date;
        const isOverdue = !item.is_returned && item.due_date && new Date(item.due_date) < new Date();
        
        const cardSelectedClass = selectedItems.has(item.id.toString()) ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-white';

        // --- নতুন অ্যাকশন বাটন লজিক ---
        let actionButtons;
        if (item.is_returned) {
            // ইতিহাস ভিউ: পুনরায় চালু করুন এবং স্থায়ীভাবে মুছুন বাটন
            actionButtons = `
                <div class="flex items-center gap-2">
                    <button data-id="${item.id}" data-type="${type}" class="reactivate-btn flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                        <i class="fa-solid fa-rotate-left mr-2"></i> পুনরায় চালু করুন
                    </button>
                    <button data-id="${item.id}" data-type="${type}" class="delete-btn text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors" title="স্থায়ীভাবে মুছুন">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        } else {
            // সক্রিয় লোন ভিউ: ফেরত, সম্পাদনা, ক্যালেন্ডার বাটন
            actionButtons = `
                <button data-id="${item.id}" data-type="${type}" class="return-btn w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-sm font-medium text-white ${isLoaned ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isLoaned ? 'focus:ring-green-500' : 'focus:ring-yellow-500'} transition-colors">
                    <i class="fa-solid fa-check mr-2"></i> ${isLoaned ? 'ফেরত পেয়েছি' : 'ফেরত দিয়েছি'}
                </button>
                <div class="flex gap-2">
                    <button data-id="${item.id}" data-type="${type}" class="edit-btn text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100" title="সম্পাদনা"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button data-id="${item.id}" data-type="${type}" data-title="${title}" data-due-date="${item.due_date}" data-borrower="${personName}" class="calendar-btn text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100" title="ক্যালেন্ডারে যোগ করুন"><i class="fa-solid fa-calendar-plus"></i></button>
                </div>
            `;
        }

        return `
            <div class="loan-card relative rounded-lg shadow-md p-4 transition-all hover:shadow-lg ${isOverdue ? 'border-l-4 border-red-500' : 'border-l-4 border-indigo-500'} ${cardSelectedClass}" data-id="${item.id}">
                ${!item.is_returned ? `<input type="checkbox" data-id="${item.id}" class="bulk-checkbox absolute top-3 right-3 h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">` : ''}
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex-grow pr-10">
                        <h3 class="text-lg font-bold text-gray-900">${title}</h3>
                        <p class="text-sm text-gray-600">${personLabel}: <span class="font-semibold">${personName}</span></p>
                        ${item.borrower_contact ? `<p class="text-sm text-gray-500">যোগাযোগ: ${item.borrower_contact}</p>` : ''}
                        <div class="text-xs text-gray-500 mt-2 space-y-1">
                            <p><span class="font-semibold">ধার করার তারিখ:</span> ${formatDate(date)}</p>
                            <p><span class="font-semibold">ফেরতের সম্ভাব্য তারিখ:</span> ${formatDate(item.due_date)}</p>
                            ${item.is_returned ? `<p class="text-green-700 font-semibold"><span class="font-medium">ফেরত দেওয়ার তারিখ:</span> ${formatDate(item.returned_at)}</p>` : ''}
                            ${isOverdue ? `<p class="text-red-600 font-bold mt-1">ফেরতের তারিখ পার হয়ে গেছে!</p>` : ''}
                            ${item.notes ? `<p class="mt-2 text-gray-600 bg-gray-100 p-2 rounded-md"><span class="font-semibold">নোট:</span> ${item.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="card-actions mt-2 sm:mt-0 flex flex-col sm:flex-row gap-2 items-center flex-shrink-0">
                        ${actionButtons}
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * ধার দেওয়া বইয়ের তালিকা রেন্ডার করে।
     */
    const renderLoanedOutBooks = () => {
        let filteredData = showHistory ? allLoans : allLoans.filter(l => !l.is_returned);
        const searchTerm = historySearchInput.value.toLowerCase();

        if (showHistory && searchTerm) {
            filteredData = filteredData.filter(loan =>
                (loan.books?.title?.toLowerCase() || '').includes(searchTerm) ||
                (loan.borrower_name?.toLowerCase() || '').includes(searchTerm)
            );
        }
        
        filteredData.sort((a, b) => new Date(b.loan_date) - new Date(a.loan_date));

        if (filteredData.length === 0) {
            showEmptyMessage(loanedOutPanel, showHistory ? 'আপনার ধারের কোনো ইতিহাস নেই।' : 'আপনি বর্তমানে কোনো বই ধার দেননি।');
        } else {
            loanedOutPanel.innerHTML = filteredData.map(loan => createLoanCard(loan, 'loaned')).join('');
        }
    };

    /**
     * ধার নেওয়া বইয়ের তালিকা রেন্ডার করে।
     */
    const renderBorrowedBooks = () => {
        let filteredData = showHistory ? allBorrowed : allBorrowed.filter(b => !b.is_returned);
        const searchTerm = historySearchInput.value.toLowerCase();

        if (showHistory && searchTerm) {
            filteredData = filteredData.filter(book =>
                (book.title?.toLowerCase() || '').includes(searchTerm) ||
                (book.lender_name?.toLowerCase() || '').includes(searchTerm)
            );
        }

        filteredData.sort((a, b) => new Date(b.borrow_date) - new Date(a.borrow_date));

        if (filteredData.length === 0) {
            showEmptyMessage(borrowedPanel, showHistory ? 'আপনার ধার করার কোনো ইতিহাস নেই।' : 'আপনি বর্তমানে কোনো বই ধার নেননি।');
        } else {
            borrowedPanel.innerHTML = filteredData.map(book => createLoanCard(book, 'borrowed')).join('');
        }
    };
    
    /**
     * Feature 4: বই ফেরত দেওয়ার হ্যান্ডলার (Undo সহ)।
     */
    const handleReturn = async (id, type) => {
        const table = type === 'loaned' ? 'loans' : 'borrowed_books';
        const allItems = type === 'loaned' ? allLoans : allBorrowed;
        const itemIndex = allItems.findIndex(i => i.id == id);
        if (itemIndex === -1) return;

        // আনডু করার জন্য আসল ডেটা সংরক্ষণ
        lastReturnedItem = { id, type, data: { ...allItems[itemIndex] } };

        const { error } = await _supabase
            .from(table)
            .update({ is_returned: true, returned_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            showToast('বই ফেরত হিসেবে চিহ্নিত করা যায়নি।', true);
            console.error('আপডেট করতে সমস্যা:', error.message);
            lastReturnedItem = null;
        } else {
            // UI তে পরিবর্তন দেখান
            allItems[itemIndex].is_returned = true;
            allItems[itemIndex].returned_at = new Date().toISOString();
            renderAllLists();
            showToast('বই ফেরত হিসেবে চিহ্নিত হয়েছে।', true); // Undoable toast
        }
    };
    
    /**
     * আনডু বাটন ক্লিক হ্যান্ডলার।
     */
    const handleUndoReturn = async () => {
        if (!lastReturnedItem) return;

        const { id, type, data } = lastReturnedItem;
        const table = type === 'loaned' ? 'loans' : 'borrowed_books';
        
        // is_returned: false এবং returned_at: null দিয়ে আপডেট করুন
        const { error } = await _supabase
            .from(table)
            .update({ is_returned: false, returned_at: null })
            .eq('id', id);
        
        if (error) {
            showToast('পূর্বাবস্থায় ফেরানো যায়নি।', true);
            console.error('Undo করতে সমস্যা:', error.message);
        } else {
            // UI তে ডেটা পুনরুদ্ধার করুন
            const allItems = type === 'loaned' ? allLoans : allBorrowed;
            const itemIndex = allItems.findIndex(i => i.id == id);
            if (itemIndex !== -1) {
                allItems[itemIndex] = data;
            }
            renderAllLists();
            hideToast();
            showToast('পূর্বাবস্থায় ফেরানো হয়েছে।');
        }
        lastReturnedItem = null;
        clearTimeout(undoTimeout);
    };

    /**
     * Feature 2: লোন এডিট মডাল খোলা এবং ডেটা পূরণ করা।
     */
    const openEditModal = (id, type) => {
        const allItems = type === 'loaned' ? allLoans : allBorrowed;
        const item = allItems.find(i => i.id == id);
        if (!item) return;

        editLoanForm.elements['id'].value = item.id;
        editLoanForm.elements['type'].value = type;
        // 'loans' টেবিলে borrower_name, 'borrowed_books' টেবিলে lender_name
        const personName = type === 'loaned' ? item.borrower_name : item.lender_name;
        editLoanForm.elements['borrower_name'].value = personName;
        // শুধুমাত্র 'loans' টেবিলের জন্য কন্টাক্ট এবং নোটস প্রযোজ্য
        editLoanForm.elements['borrower_contact'].value = item.borrower_contact || '';
        editLoanForm.elements['notes'].value = item.notes || '';
        editLoanForm.elements['due_date'].value = item.due_date;

        editLoanModal.classList.remove('hidden', 'modal-scale-enter-from');
    };
    
    const closeEditModal = () => {
        editLoanModal.classList.add('modal-scale-leave-to');
        setTimeout(() => {
            editLoanModal.classList.add('hidden');
            editLoanModal.classList.remove('modal-scale-leave-to');
        }, 300);
    };
    
    /**
     * এডিট ফর্ম সাবমিট হ্যান্ডলার।
     */
    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(editLoanForm);
        const id = formData.get('id');
        const type = formData.get('type');
        const table = type === 'loaned' ? 'loans' : 'borrowed_books';
        
        const updateData = {
            due_date: formData.get('due_date'),
        };
        
        if (type === 'loaned') {
            updateData.borrower_name = formData.get('borrower_name').trim();
            updateData.borrower_contact = formData.get('borrower_contact').trim();
            updateData.notes = formData.get('notes').trim();
        } else {
            updateData.lender_name = formData.get('borrower_name').trim();
        }

        const btn = document.getElementById('edit-form-submit-btn');
        btn.disabled = true;
        btn.textContent = 'সংরক্ষণ হচ্ছে...';

        try {
            const { error } = await _supabase.from(table).update(updateData).eq('id', id);
            if (error) throw error;
            
            // লোকাল ডেটা আপডেট
            const allItems = type === 'loaned' ? allLoans : allBorrowed;
            const itemIndex = allItems.findIndex(i => i.id == id);
            if(itemIndex !== -1) {
                Object.assign(allItems[itemIndex], updateData);
            }
            
            renderAllLists();
            closeEditModal();
            showToast('তথ্য সফলভাবে আপডেট করা হয়েছে।');
        } catch (error) {
            console.error('এডিট করতে সমস্যা:', error.message);
            showToast(`ত্রুটি: ${error.message}`, true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'পরিবর্তন সংরক্ষণ করুন';
        }
    };

    /**
     * Feature 9: একটি ফেরত দেওয়া লোন পুনরায় চালু করা।
     */
    const handleReactivate = async (id, type) => {
        if (!confirm('আপনি কি নিশ্চিতভাবে এই লোনটি পুনরায় চালু করতে চান?')) {
            return;
        }

        const table = type === 'loaned' ? 'loans' : 'borrowed_books';
        try {
            const { error } = await _supabase
                .from(table)
                .update({ is_returned: false, returned_at: null })
                .eq('id', id);

            if (error) throw error;

            showToast('লোন সফলভাবে পুনরায় চালু করা হয়েছে।');
            await fetchAllData(); // UI রিফ্রেশ করার জন্য ডেটা পুনরায় লোড করুন
        } catch (error) {
            showToast('লোন পুনরায় চালু করা যায়নি।', true);
            console.error('পুনরায় চালু করতে সমস্যা:', error.message);
        }
    };

    /**
     * Feature 10: একটি ঐতিহাসিক রেকর্ড স্থায়ীভাবে মুছে ফেলা।
     */
    const handleDelete = async (id, type) => {
        if (!confirm('এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। আপনি কি নিশ্চিতভাবে এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?')) {
            return;
        }

        const table = type === 'loaned' ? 'loans' : 'borrowed_books';
        try {
            const { error } = await _supabase
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast('রেকর্ড স্থায়ীভাবে মুছে ফেলা হয়েছে।');
            await fetchAllData(); // UI রিফ্রেশ করার জন্য ডেটা পুনরায় লোড করুন
        } catch (error) {
            showToast('রেকর্ড মোছা যায়নি।', true);
            console.error('মুছে ফেলতে সমস্যা:', error.message);
        }
    };


    /**
     * Feature 6: বাল্ক অ্যাকশন বার আপডেট।
     */
    const updateBulkActionBar = () => {
        const count = selectedItems.size;
        if (count > 0) {
            bulkSelectedCount.textContent = count;
            bulkActionBar.style.transform = 'translateY(0)';
        } else {
            bulkActionBar.style.transform = 'translateY(100%)';
        }
    };
    
    /**
     * বাল্ক রিটার্ন হ্যান্ডলার।
     */
    const handleBulkReturn = async () => {
        if (selectedItems.size === 0) return;

        const updates = Array.from(selectedItems).map(id => {
            // বাল্ক অ্যাকশন শুধুমাত্র 'ধার দিয়েছি' ট্যাবের জন্য সক্ষম
            const table = 'loans'; 
            return _supabase.from(table)
                .update({ is_returned: true, returned_at: new Date().toISOString() })
                .eq('id', id);
        });

        bulkReturnBtn.disabled = true;
        bulkReturnBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> প্রসেস হচ্ছে...`;
        
        try {
            const results = await Promise.all(updates);
            const hasError = results.some(res => res.error);
            if (hasError) throw new Error('কিছু আইটেম আপডেট করা যায়নি।');

            // লোকাল ডেটা আপডেট
            selectedItems.forEach(id => {
                const itemIndex = allLoans.findIndex(i => i.id == id);
                if (itemIndex !== -1) {
                    allLoans[itemIndex].is_returned = true;
                    allLoans[itemIndex].returned_at = new Date().toISOString();
                }
            });

            showToast(`${selectedItems.size}টি বই ফেরত হিসেবে চিহ্নিত হয়েছে।`);
            selectedItems.clear();
            updateBulkActionBar();
            renderAllLists();

        } catch (error) {
            console.error('বাল্ক রিটার্ন সমস্যা:', error.message);
            showToast(error.message, true);
        } finally {
            bulkReturnBtn.disabled = false;
            bulkReturnBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> নির্বাচিতগুলো ফেরত নিন`;
        }
    };
    
    /**
     * Feature 7: গুগল ক্যালেন্ডার ইভেন্ট তৈরি।
     */
    const addToCalendar = (itemData) => {
        const { title, dueDate, borrower } = itemData;
        if (!dueDate) {
            showToast('ফেরতের তারিখ নির্দিষ্ট নেই।', true);
            return;
        }
        
        const formattedDate = new Date(dueDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
        
        const event = {
            text: `বই ফেরত দিন: '${title}'`,
            dates: `${formattedDate}/${formattedDate}`,
            details: `আমার পাঠশালা অ্যাপ থেকে অনুস্মারক। \nবইটি রিয়াদ হোসেন হুযাইফার কাছে ফেরত দেওয়ার কথা।\nঋণগ্রহীতা: ${borrower}`,
        };

        const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&dates=${encodeURIComponent(event.dates)}&details=${encodeURIComponent(event.details)}`;
        window.open(url, '_blank');
    };

    // --- ইভেন্ট লিসেনার সেটআপ ---
    loanedOutTab.addEventListener('click', () => {
        loanedOutTab.className = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-600';
        borrowedTab.className = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
        loanedOutPanel.classList.remove('hidden');
        borrowedPanel.classList.add('hidden');
    });

    borrowedTab.addEventListener('click', () => {
        borrowedTab.className = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-indigo-500 text-indigo-600';
        loanedOutTab.className = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
        borrowedPanel.classList.remove('hidden');
        loanedOutPanel.classList.add('hidden');
    });

    historyToggle.addEventListener('change', (e) => {
        showHistory = e.target.checked;
        historySearchContainer.classList.toggle('hidden', !showHistory);
        if (!showHistory) {
            historySearchInput.value = '';
        }
        renderAllLists();
    });
    
    historySearchInput.addEventListener('input', renderAllLists);
    
    // ইভেন্ট ডেলিগেশন ব্যবহার করে সব ক্লিক হ্যান্ডেল
    document.body.addEventListener('click', (e) => {
        const returnBtn = e.target.closest('.return-btn');
        const editBtn = e.target.closest('.edit-btn');
        const calendarBtn = e.target.closest('.calendar-btn');
        const reactivateBtn = e.target.closest('.reactivate-btn'); // নতুন
        const deleteBtn = e.target.closest('.delete-btn'); // নতুন

        if (returnBtn) {
            returnBtn.disabled = true;
            handleReturn(returnBtn.dataset.id, returnBtn.dataset.type);
        }
        if (editBtn) {
            openEditModal(editBtn.dataset.id, editBtn.dataset.type);
        }
        if (calendarBtn) {
            addToCalendar({
                title: calendarBtn.dataset.title,
                dueDate: calendarBtn.dataset.dueDate,
                borrower: calendarBtn.dataset.borrower
            });
        }
        if (reactivateBtn) {
            reactivateBtn.disabled = true;
            handleReactivate(reactivateBtn.dataset.id, reactivateBtn.dataset.type);
        }
        if (deleteBtn) {
            deleteBtn.disabled = true;
            handleDelete(deleteBtn.dataset.id, deleteBtn.dataset.type);
        }
    });
    
    // বাল্ক অ্যাকশন চেকবক্স হ্যান্ডলিং
    document.body.addEventListener('change', (e) => {
        const checkbox = e.target.closest('.bulk-checkbox');
        if (checkbox) {
            const id = checkbox.dataset.id;
            const card = checkbox.closest('.loan-card');
            if (checkbox.checked) {
                selectedItems.add(id);
                card.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-50');
            } else {
                selectedItems.delete(id);
                card.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-50');
            }
            updateBulkActionBar();
        }
    });

    bulkReturnBtn.addEventListener('click', handleBulkReturn);
    toastUndoBtn.addEventListener('click', handleUndoReturn);
    editLoanForm.addEventListener('submit', handleEditFormSubmit);
    editModalCloseBtn.addEventListener('click', closeEditModal);
    editLoanModal.addEventListener('click', (e) => {
        if (e.target === editLoanModal) closeEditModal();
    });

    // --- পৃষ্ঠা শুরু ---
    checkUserSession();
});
