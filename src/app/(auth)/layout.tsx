import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src="/logo.jpeg"
                alt="FIL LIMITED"
                width={80}
                height={80}
                className="object-contain rounded"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Log in</h1>
          </div>
          {children}
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">© FIL Limited 2025</p>
        </div>
      </div>
    </div>
  );
}
