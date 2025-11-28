"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookie-consent");
      if (!consent) setShow(true); // Show banner only if no decision yet
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
    window.location.reload(); // reload to initialize analytics
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-2 z-50">
      <p className="text-sm md:text-base">
        We use cookies to improve your experience. You can accept or decline cookies.
      </p>
      <div className="flex gap-2">
        <button
          onClick={acceptCookies}
          className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded"
        >
          Accept
        </button>
        <button
          onClick={declineCookies}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
