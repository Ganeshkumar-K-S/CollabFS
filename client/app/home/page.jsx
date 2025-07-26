import React from 'react'
import Header from '@/components/Header'
import ProfileDropdown from '@/components/ProfileDropDown'

const Page = () => {
  const userName = 'Harivansh B'

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7]">
      <div className='flex justify-between items-center p-4'>
        <Header />
        <ProfileDropdown userName={userName} />
      </div>
    </div>
  )
}

export default Page