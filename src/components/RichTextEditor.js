'use client'

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const RichTextEditor = ({ value, onChange, placeholder = "Enter content..." }) => {
    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link'],
            ['clean']
        ]
    }), []);

    const formats = useMemo(() => (
        [
            'header',
            'bold', 'italic', 'underline', 'strike', 'blockquote',
            'list', 'bullet',
            'align',
            'link'
        ]
    ), []);

    const plainTextLength = useMemo(() => {
        if (!value) return 0;
        return value.replace(/<[^>]*>/g, '').length;
    }, [value]);

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            <ReactQuill
                theme="snow"
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                style={{ minHeight: 300 }}
            />
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-300">
                {plainTextLength} characters
            </div>
        </div>
    );
};

export default RichTextEditor;
