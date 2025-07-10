// =================================================================
//                        config.js (নতুন ফাইল)
// =================================================================
// এই ফাইলটিতে সকল শেয়ার করা কনফিগারেশন এবং ফাংশন থাকবে।
// অন্যান্য HTML ফাইলে এই ফাইলটিকে অবশ্যই অন্য JS ফাইলের আগে যুক্ত করতে হবে।
// =================================================================

// --- Supabase Client Initialization (Centralized) ---
// এখানে আপনার Supabase প্রজেক্টের URL এবং নিরাপদ Anon Key রাখা হয়েছে।
const SUPABASE_URL = 'https://mfdjzklkwndjifsomxtm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZGp6a2xrd25kamlmc29teHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTMwMTMsImV4cCI6MjA2NzM2OTAxM30.qF407SzDMtbJHFt7GAOxNVeObhAmt0t_nGH3CtVGtPs';

// _supabase ভ্যারিয়েবলটি এখন অন্য স্ক্রিপ্টগুলোর জন্য বিশ্বব্যাপী উপলব্ধ হবে।
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Toast Notification Helper (Centralized) ---
// এই ফাংশনটি পুরো অ্যাপ জুড়ে সুন্দর নোটিফিকেশন দেখানোর জন্য ব্যবহৃত হবে।
const showToast = (message, type = 'success') => {
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
};
