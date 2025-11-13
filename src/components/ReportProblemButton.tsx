'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import ReportProblemModal from './ReportProblemModal';

export default function ReportProblemButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center gap-2 group"
        aria-label="Report a Problem"
      >
        <AlertCircle className="h-6 w-6" />
        <span className="hidden md:block font-medium">Report a Problem</span>
      </button>
      <ReportProblemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

