'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function Logo({ size = 'md', showSubtitle = true }: LogoProps) {
  const dimensions = {
    sm: { img: 30, text: 'text-lg', sub: 'text-xs' },
    md: { img: 38, text: 'text-2xl', sub: 'text-xs' },
    lg: { img: 50, text: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative flex items-center justify-center">
        {/* Dark and light responsive logo */}
        <div className="dark:hidden">
          <Image
            src="/logo.svg"
            alt="Kudex Logo"
            width={dimensions.img}
            height={dimensions.img}
            className="transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>
        <div className="hidden dark:block">
          <Image
            src="/logo-dark.svg"
            alt="Kudex Logo"
            width={dimensions.img}
            height={dimensions.img}
            className="transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight text-foreground font-mono leading-none ${dimensions.text}`}>
          KUDEX
        </span>
        {showSubtitle && (
          <span className={`font-mono uppercase tracking-widest text-[#00E599] mt-0.5 ${dimensions.sub}`}>
            SETTLEMENT NETWORK
          </span>
        )}
      </div>
    </Link>
  );
}
