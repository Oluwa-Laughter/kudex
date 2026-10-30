'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function Logo({ size = 'md', showSubtitle = false }: LogoProps) {
  const dimensions = {
    sm: { img: 30, text: 'text-xl', sub: 'text-sm' },
    md: { img: 38, text: 'text-2xl', sub: 'text-sm' },
    lg: { img: 48, text: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <div className="relative flex items-center justify-center">
        <div className="dark:hidden">
          <Image
            src="/logo.svg"
            alt="Kudex Logo"
            width={dimensions.img}
            height={dimensions.img}
            className="transition-transform duration-200 group-hover:scale-105"
            priority
          />
        </div>
        <div className="hidden dark:block">
          <Image
            src="/logo-dark.svg"
            alt="Kudex Logo"
            width={dimensions.img}
            height={dimensions.img}
            className="transition-transform duration-200 group-hover:scale-105"
            priority
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span
          className={`font-heading font-bold leading-none tracking-tight text-foreground ${dimensions.text}`}
        >
          Kudex
        </span>
        {showSubtitle && (
          <span className={`mt-0.5 text-primary ${dimensions.sub}`}>
            Confidential Settlement
          </span>
        )}
      </div>
    </Link>
  );
}
