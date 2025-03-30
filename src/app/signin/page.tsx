'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignin = async () => {
    setError('');
  
    const res = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      localStorage.removeItem('userEmail');         // ✅ 기존 사용자 제거
      localStorage.setItem('token', data.token);    // ✅ 토큰 저장
      localStorage.setItem('userEmail', email);     // ✅ 새 사용자 저장
      router.push('/dashboard');                    // ✅ 이동
    } else {
      setError(data.error || 'Signin failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-green-100 p-6">
      {/* 모션으로 감싸서 등장 애니메이션 추가 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-lg shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Sign In
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
        />

        <button
          onClick={handleSignin}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors"
        >
          Sign In
        </button>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}

        <p className="mt-6 text-sm text-center text-gray-700">
          Don't have an account?{' '}
          <Link href="/signup" className="text-green-600 hover:underline">
            Sign up here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
