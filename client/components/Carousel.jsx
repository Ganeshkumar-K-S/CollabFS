'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import carousel1 from '@/assets/carousel-1.jpeg';
import carousel2 from '@/assets/carousel-2.jpeg';
import carousel3 from '@/assets/carousel-3.jpeg';
import carousel4 from '@/assets/carousel-4.jpeg';

const Carousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const carouselData = [
    {
      title: "Workspace Analytics",
      image: carousel1
    },
    {
      title: "Team Collaboration", 
      image: carousel2
    },
    {
      title: "File Management",
      image: carousel3
    },
    {
      title: "Performance Tracking",
      image: carousel4
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === carouselData.length - 1 ? 0 : prevIndex + 1
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [carouselData.length]);

  return (
    <div className="order-3 lg:order-3 w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-4 text-center">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Discover workspace features and insights.
          </h3>
          <h2 className="text-lg font-semibold text-gray-900">
            Feature Highlights
          </h2>
        </div>

        <div className="relative h-64 overflow-hidden rounded-xl">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselData.map((card, index) => (
              <div key={index} className="w-full flex-shrink-0 h-full">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 h-full flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                    {card.title}
                  </h3>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full h-40">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover rounded-lg shadow-md"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-100"
            style={{ 
              width: `${((currentIndex + 1) / carouselData.length) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );

};

export default Carousel;