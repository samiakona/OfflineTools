import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 🟢 ১. এগুলো ইমপোর্ট করুন
import './index.css'
import App from './App.tsx'

// 🟢 ২. একটি QueryClient ইনস্ট্যান্স তৈরি করুন
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ব্রাউজার ট্যাবে ফোকাস করলে যাতে বারবার অটো রি-ফেচ না হয় (ঐচ্ছিক)
      retry: 1, // এপিআই ফেইল করলে সর্বোচ্চ ১ বার চেষ্টা করবে
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 🟢 ৩. QueryClientProvider দিয়ে App কম্পোনেন্টকে র‍্যাপ করুন */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)