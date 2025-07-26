import React from 'react'

// Your existing ProfilePicture component (circle only)
const ProfilePicture = ({ userName }) => {
  // Function to get initials from username
  const getInitials = (name) => {
    if (!name) return '?';
        
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    } else {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
  };

  // Function to generate random background color
  const getRandomColor = (name) => {
    if (!name) return '#6B7280';
        
    // Use the name as seed for consistent color per user
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
      '#7C3AED', '#9333EA', '#C026D3', '#DB2777', '#E11D48', '#57534E',
      '#BE123C', '#C2410C', '#B45309', '#A16207', '#4D7C0F', '#15803D',
      '#047857', '#0F766E', '#0E7490', '#0369A1', '#1D4ED8', '#3730A3',
      '#6D28D9', '#7E22CE', '#A21CAF', '#BE185D', '#BE123C', '#44403C'
    ];
        
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(userName);
  const backgroundColor = getRandomColor(userName);

  return (
    <div 
      className="flex font-sans items-center justify-center text-white font-bold text-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
      style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: backgroundColor
      }}
    >
      {initials}
    </div>
  );
};

export default ProfilePicture;