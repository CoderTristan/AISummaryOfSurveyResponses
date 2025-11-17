'use client'

import { navLinks } from '@/constants/objects'
import Link from 'next/link'
import { Button } from './ui/button'

export default function Header() {
  return (
    <header className="bg-white px-4 py-3 flex justify-between items-center">
      <Link href='/' className="text-blue-500 text-xl font-bold tracking-tight">Generator</Link>
      <nav className="hidden md:flex space-x-4 text-sm text-gray-500">
        {navLinks.map((link: any) => (
            <Link key={link.name} href={link.href}>
                <Button variant="ghost" className="cursor-pointer hover:text-blue-500 hover:bg-white">
                    {link.name}
                </Button>
            </Link>
        ))}
      </nav>
    </header>
  )
}