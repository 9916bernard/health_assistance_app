'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';
import symtomsenseLogo from '/public/symtomsense.png';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    setError('');
    setSuccess(false);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      // 3초 후 자동으로 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } else {
      setError(data.error || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-green-100 p-6">
      {/* 상단에 이미지 배치 */}
      <Image
        src={symtomsenseLogo}
        alt="Symptom Sense"
        width={450}
        height={450}
        className="mb-4"
      />

      {/* 중앙에 위치하는 회원가입 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-lg shadow-lg"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors"
        >
          Create Account
        </button>

        {error && (
          <p className="mt-4 text-red-600 text-sm text-center">{error}</p>
        )}

        {success && (
          <p className="mt-4 text-green-700 text-sm text-center">
            Account created successfully! Please log in.
          </p>
        )}

        <p className="mt-6 text-sm text-center text-gray-700">
          Already have an account?{' '}
          <Link href="/signin" className="text-green-600 hover:underline">
            Log in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
