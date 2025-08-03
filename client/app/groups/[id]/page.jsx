'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

const Page = () => {
  const router = useRouter();
  const pathname = usePathname(); // This gives you the current route path
  router.replace(`${pathname}/files`); // Redirects to the same path, effectively refreshing the page
}

export default Page;