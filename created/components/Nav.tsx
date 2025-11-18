'use client'

import { navLinks } from '@/constants/objects'
import Link from 'next/link'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4">
      {/* Logo */}
      <Link 
        href="/" 
        className="text-blue-500 text-xl font-bold tracking-tight"
      >
        Generator
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex space-x-2 ml-auto text-sm text-gray-600">
        {navLinks.map((link: any) => (
          <Link key={link.name} href={link.href}>
            <Button 
              variant="ghost" 
              className="cursor-pointer hover:text-blue-500 hover:bg-white"
            >
              {link.name}
            </Button>
          </Link>
        ))}
      </nav>
    </header>
  )
}
