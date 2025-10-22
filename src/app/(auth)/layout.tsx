import React from 'react';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src="/logo.jpeg"
                alt="Quintet Private Bank"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Investment CRM</h1>
            <p className="mt-2 text-gray-600">Manage your investments with ease</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
