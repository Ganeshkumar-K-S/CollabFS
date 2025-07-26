import React from 'react'
import logo from '@/assets/logo.svg';
import Image from 'next/image';
export default function Header(){
  return (
    <header className="w-full px-6 py-10 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Image src={logo} height={48} width={48}/>
          <span className="text-2xl font-light text-gray-800">CollabFS</span>
        </div>
    </header>
  )
}