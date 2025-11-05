'use client'

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useMemo, useEffect } from 'react';

const RichTextEditor = ({ value, onChange, placeholder = "Enter content..." }) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[300px] px-4 py-2',
            },
        },
    });

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (editor && value !== undefined && editor.getHTML() !== value) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    const plainTextLength = useMemo(() => {
        if (!value) return 0;
        return value.replace(/<[^>]*>/g, '').length;
    }, [value]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-2">
                {/* Headings */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        H3
                    </button>
                </div>

                {/* Text Formatting */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
                        }`}
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('italic') ? 'bg-gray-300 italic' : ''
                        }`}
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('underline') ? 'bg-gray-300 underline' : ''
                        }`}
                    >
                        <u>U</u>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('strike') ? 'bg-gray-300 line-through' : ''
                        }`}
                    >
                        <s>S</s>
                    </button>
                </div>

                {/* Lists */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('bulletList') ? 'bg-gray-300' : ''
                        }`}
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('orderedList') ? 'bg-gray-300' : ''
                        }`}
                    >
                        1. List
                    </button>
                </div>

                {/* Alignment */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        ⬅
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        ⬌
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
                        }`}
                    >
                        ➡
                    </button>
                </div>

                {/* Other */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => {
                            const url = window.prompt('Enter URL:');
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                            }
                        }}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('link') ? 'bg-gray-300' : ''
                        }`}
                    >
                        🔗 Link
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 ${
                            editor.isActive('blockquote') ? 'bg-gray-300' : ''
                        }`}
                    >
                        " Quote
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                        className="px-2 py-1 text-sm rounded hover:bg-gray-200"
                    >
                        🧹 Clear
                    </button>
                </div>
            </div>

            {/* Editor Content */}
            <div className="min-h-[300px] bg-white">
                <EditorContent editor={editor} />
            </div>

            {/* Character Count */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-300">
                {plainTextLength} characters
            </div>
        </div>
    );
};

export default RichTextEditor;
