import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { db, type CaseNote } from '../db';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: CaseNote | null; // যদি এডিট করতে চাই, তবে আগের ডেটা এখানে আসবে
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, onClose, noteToEdit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // মোডাল ওপেন হলে বা এডিট বাটনে চাপ দিলে ফিল্ডগুলো আপডেট হবে
  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [noteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const now = Date.now();

    if (noteToEdit && noteToEdit.id) {
      // যদি আগের নোট থাকে, তবে অফলাইনে আপডেট (Edit) হবে
      await db.caseNotes.update(noteToEdit.id, {
        title,
        content,
        updatedAt: now,
      });
    } else {
      // নতুন নোট হলে অফলাইনে ডাটাবেজে সেভ (Add) হবে
      await db.caseNotes.add({
        title,
        content,
        createdAt: now,
        updatedAt: now,
      });
    }

    onClose(); // কাজ শেষে মোডাল বন্ধ হবে
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* মোডাল হেডার */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">
            {noteToEdit ? 'Edit Case Note' : 'Add New Case Note'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 text-slate-500 transition">
            <X size={20} />
          </button>
        </div>

        {/* ফর্ম */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter case title..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Content / Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write case notes here..."
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
          </div>

          {/* বাটন্স */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {noteToEdit ? 'Save Changes' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};