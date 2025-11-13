'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/errorHandling';
import { X, Upload, File } from 'lucide-react';

interface ReportProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportProblemModal({ isOpen, onClose }: ReportProblemModalProps) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('OTHER');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Limit to 5 files
      if (attachments.length + files.length > 5) {
        setError('Maximum 5 files allowed');
        return;
      }
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('priority', priority);

      // Add attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.problemReports.create(formData);

      setSuccess(true);
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('OTHER');
      setPriority('MEDIUM');
      setAttachments([]);

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject('');
      setDescription('');
      setCategory('OTHER');
      setPriority('MEDIUM');
      setAttachments([]);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">Report a Problem</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              Problem report submitted successfully! We'll review it shortly.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="Brief description of the problem"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="Please provide detailed information about the problem..."
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="TECHNICAL">Technical</option>
              <option value="ACCOUNT">Account</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="INVESTMENT">Investment</option>
              <option value="DOCUMENT">Document</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label htmlFor="attachments" className="block text-sm font-medium mb-2">
              Attachments (Optional, max 5 files)
            </label>
            <div className="space-y-2">
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">Click to upload files</span>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  disabled={loading || attachments.length >= 5}
                  className="hidden"
                />
              </label>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={loading}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !subject || !description}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

