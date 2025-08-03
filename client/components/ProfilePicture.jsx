'use client';

import React from 'react';

const ProfilePicture = ({ userName, size = 36 }) => {
    const getInitials = (name) => {
        if (!name) return '?';

        const parts = name.trim().split(' ');
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        } else {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        }
    };

    const getRandomColor = (name) => {
        if (!name) return '#6B7280';

        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        const colors = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
            '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
            '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#78716C',
            '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D', '#16A34A',
            '#059669', '#0D9488', '#0891B2', '#0284C7', '#2563EB', '#4F46E5',
            '#7C3AED', '#9333EA', '#C026D3', '#DB2777', '#E11D48', '#57534E'
        ];

        return colors[Math.abs(hash) % colors.length];
    };

    // Calculate values directly instead of using state
    const initials = getInitials(userName);
    const backgroundColor = getRandomColor(userName);
    const fontSize = size >= 100 ? 'text-3xl' : size >= 60 ? 'text-xl' : 'text-lg';

    return (
        <div
            className={`flex font-sans items-center justify-center text-white font-bold ${fontSize} flex-shrink-0`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                backgroundColor: backgroundColor
            }}
        >
            {initials}
        </div>
    );
};

export default ProfilePicture;