'use client'

import { navLinks } from '@/constants/objects'
import Link from 'next/link'
import { Button } from './ui/button'

import { 
  SignedIn, 
  SignedOut, 
  UserButton,
  SignInButton,
  SignUpButton 
} from "@clerk/nextjs";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4">
      
      <Link 
        href="/" 
        className="text-blue-500 text-xl font-bold tracking-tight"
      >
        Generator
      </Link>

      <nav className="hidden md:flex space-x-2 ml-auto text-sm text-gray-600">

        {/* Only show *public* links to everyone */}
        {navLinks
          .filter(link => link.href !== '/dashboard/projects')
          .map(link => (
            <Link key={link.name} href={link.href}>
              <Button 
                variant="ghost"
                className="cursor-pointer hover:text-blue-500 hover:bg-white"
              >
                {link.name}
              </Button>
            </Link>
          ))}

        {/* Dashboard link ONLY for signed-in users */}
        <SignedIn>
          <Link href="/dashboard/projects">
            <Button 
              variant="ghost"
              className="cursor-pointer hover:text-blue-500 hover:bg-white"
            >
              Dashboard
            </Button>
          </Link>

          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8"
              }
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="default">Sign In</Button>
          </SignInButton>

          <SignUpButton mode="modal">
            <Button variant="secondary">Sign Up</Button>
          </SignUpButton>
        </SignedOut>

      </nav>
    </header>
  )
}
