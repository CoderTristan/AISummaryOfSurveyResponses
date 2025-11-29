"use client";

import { useState } from "react";
import { navLinks } from "@/constants/objects";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";

import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b h-14 flex items-center px-4">
      <Link
        href="/"
        className="flex items-center gap-2 text-xl text-black font-bold tracking-tight"
      >
        <img src="/favicon-32x32.png" alt="OneQ logo" width={24} height={24} />
        OneQ
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex space-x-2 ml-auto text-sm text-gray-600">
        {navLinks
          .filter((link) => link.href !== "/dashboard/projects")
          .map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}>
                <Button
                  variant="ghost"
                  className={`cursor-pointer hover:text-blue-500 hover:bg-white ${
                    isActive ? "text-blue-500" : ""
                  }`}
                >
                  {link.name}
                </Button>
              </Link>
            );
          })}

        <SignedIn>
          <Link href="/dashboard/projects">
            <Button
              variant="default"
              className="bg-blue-400 text-white hover:bg-blue-300"
            >
              Dashboard
            </Button>
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
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

      {/* Mobile menu button */}
      <div className="md:hidden ml-auto">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {mobileMenuOpen ? (
            <span className="text-2xl">&times;</span> // X to close
          ) : (
            <span className="text-2xl">&#9776;</span> // Hamburger
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-t shadow-md flex flex-col md:hidden z-40">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link key={link.name} href={link.href}>
                <Button
                  variant="ghost"
                  className={`w-full text-left px-4 py-2 ${
                    isActive ? "text-blue-500" : "text-gray-700"
                  }`}
                  onClick={() => setMobileMenuOpen(false)} // close on click
                >
                  {link.name}
                </Button>
              </Link>
            );
          })}

          <SignedIn>
            <Link href="/dashboard/projects">
              <Button
                variant="default"
                className="w-full text-left bg-blue-400 text-white hover:bg-blue-300 px-4 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Button>
            </Link>
            <div className="px-4 py-2">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex flex-col px-4 py-2 space-y-2">
              <SignInButton mode="modal">
                <Button className="w-full">Sign In</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="secondary" className="w-full">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      )}
    </header>
  );
}
