'use client';

import React from 'react';
import logo from '@/assets/logo.svg';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full px-6 py-8 flex items-center justify-center">
      <div className="flex items-center space-x-4">
        <Image src={logo} alt="CollabFS Logo" height={60} width={60} />
        <span className="text-6xl font-serif font-normal text-black tracking-tight">
          CollabFS
        </span>
      </div>
    </header>
  );
}
