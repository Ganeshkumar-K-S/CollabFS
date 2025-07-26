'use client';

import React from 'react';

export default function TextContent() {
  return (
    <div className="space-y-8 text-left px-4 md:px-0">
      <div className="space-y-4 max-w-xl">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-normal text-foreground leading-tight tracking-tight">
          Collaborate,<br />
          <span className="block">seamlessly</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-sans">
          A privacy-first workspace to chat, share files, and build together — all in one place.
        </p>
      </div>
    </div>
  );
}
