'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        router.push('/auth/login');
    }, [router]);

    return <p className="text-center mt-8">Redirecting to login...</p>;
}
