import React from 'react'

export default function Header(){
  return (
    <header className="w-full px-6 py-10 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <span className="text-2xl font-light text-gray-800">CollabFS</span>
        </div>
    </header>
  )
}