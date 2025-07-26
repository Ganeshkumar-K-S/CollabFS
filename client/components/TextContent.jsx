import React from 'react';

export default function TextContent() {
  return (
    <div className="space-y-8 text-left">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-black leading-tight">
          Collaborate,<br />
          <span className="block">seamlessly</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-800 max-w-md">
          A privacy-first workspace to chat, share files, and build together — all in one place.
        </p>
      </div>
    </div>
  );
}
