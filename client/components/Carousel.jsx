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
    { title: "Workspace Analytics", image: carousel1 },
    { title: "Team Collaboration", image: carousel2 },
    { title: "File Management", image: carousel3 },
    { title: "Performance Tracking", image: carousel4 }
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
    <div className="order-3 lg:order-3 w-full max-w-lg lg:max-w-xl mx-auto font-sans">
      <div className="bg-card rounded-3xl shadow-xl p-8 border border-muted/50">
        {/* Header Text */}
        <div className="mb-6 text-center space-y-1">
          <h3 className="text-sm text-muted-foreground tracking-wide">
            Discover workspace features and insights.
          </h3>
          <h2 className="text-xl md:text-2xl font-serif text-foreground">
            Feature Highlights
          </h2>
        </div>

        {/* Carousel */}
        <div className="relative h-72 overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselData.map((card, index) => (
              <div key={index} className="w-full flex-shrink-0 h-full">
                <div className="bg-muted/30 rounded-xl p-6 h-full flex flex-col">
                  <h3 className="text-lg font-serif text-center text-foreground mb-4">
                    {card.title}
                  </h3>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full h-44 md:h-48">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover rounded-xl shadow-sm"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-5 space-x-2">
          {carouselData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-orange-500 scale-110' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-orange-500 h-full transition-all duration-1000"
            style={{
              width: `${((currentIndex + 1) / carouselData.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Carousel;
