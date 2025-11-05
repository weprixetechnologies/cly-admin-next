'use client'

import { useEditor, EditorContent } from '@tiptap/react';
import 'highlight.js/styles/github-dark.css';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { TextStyle, Color, LineHeight } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Mark } from '@tiptap/core';
import { useMemo, useEffect, useState } from 'react';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import html from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';

const lowlight = createLowlight();

// Register common languages
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('json', json);
lowlight.register('sql', sql);

// Custom LetterSpacing extension
const LetterSpacing = Mark.create({
    name: 'letterSpacing',
    addAttributes() {
        return {
            letterSpacing: {
                default: null,
                parseHTML: element => element.style.letterSpacing || null,
                renderHTML: attributes => {
                    if (!attributes.letterSpacing) {
                        return {};
                    }
                    return { style: `letter-spacing: ${attributes.letterSpacing}` };
                },
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'span[style*="letter-spacing"]',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', HTMLAttributes, 0];
    },
    addCommands() {
        return {
            setLetterSpacing: (letterSpacing) => ({ commands }) => {
                return commands.setMark(this.name, { letterSpacing });
            },
            unsetLetterSpacing: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
    },
});

const RichTextEditor = ({ value, onChange, placeholder = "Enter content..." }) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showHighlightPicker, setShowHighlightPicker] = useState(false);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [showLineSpacing, setShowLineSpacing] = useState(false);
    const [showLetterSpacing, setShowLetterSpacing] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 4, 5, 6],
                },
                codeBlock: false,
            }),
            Underline,
            TextStyle,
            Color,
            LineHeight.configure({
                types: ['textStyle'],
            }),
            LetterSpacing,
            Highlight.configure({
                multicolor: true,
            }),
            Subscript,
            Superscript,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                defaultAlignment: 'left',
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded',
                },
            }),
            Table.configure({
                resizable: true,
                HTMLAttributes: {
                    class: 'border-collapse border border-gray-300 w-full',
                },
            }),
            TableRow.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300',
                },
            }),
            TableHeader.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 bg-gray-100 font-bold p-2',
                },
            }),
            TableCell.configure({
                HTMLAttributes: {
                    class: 'border border-gray-300 p-2',
                },
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            HorizontalRule,
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
                class: 'focus:outline-none min-h-[400px] px-4 py-3',
            },
        },
    });

    // Update editor content when value prop changes externally
    useEffect(() => {
        if (editor && value !== undefined && editor.getHTML() !== value) {
            editor.commands.setContent(value || '');
        }
    }, [value, editor]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (!target.closest('.line-spacing-dropdown') && !target.closest('[data-line-spacing-btn]')) {
                setShowLineSpacing(false);
            }
            if (!target.closest('.letter-spacing-dropdown') && !target.closest('[data-letter-spacing-btn]')) {
                setShowLetterSpacing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const plainTextLength = useMemo(() => {
        if (!value) return 0;
        return value.replace(/<[^>]*>/g, '').length;
    }, [value]);

    const handleAddImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const handleAddLink = () => {
        if (editor.isActive('link')) {
            const { href } = editor.getAttributes('link');
            setLinkUrl(href || '');
        }
        setShowLinkDialog(true);
    };

    const handleSetLink = () => {
        if (linkUrl) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setShowLinkDialog(false);
        setLinkUrl('');
    };

    const handleRemoveLink = () => {
        editor.chain().focus().unsetLink().run();
        setShowLinkDialog(false);
        setLinkUrl('');
    };

    const handleAddTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const colors = [
        '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
        '#FF0000', '#FF6600', '#FFCC00', '#33FF00', '#0066FF', '#6600FF',
        '#FF0099', '#FF3366', '#FF9900', '#CCFF00', '#00FF66', '#0066FF',
        '#6633FF', '#CC00FF', '#FF0066', '#FF3300', '#FFCC00', '#99FF00',
        '#00FFCC', '#0099FF', '#3300FF', '#CC00CC', '#FF0066'
    ];

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            {/* Main Toolbar */}
            <div className="border-b border-gray-300 bg-gray-50 p-2">
                <div className="flex flex-wrap gap-2">
                    {/* Undo/Redo */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            className="px-3 py-1.5 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            ↶ Undo
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            className="px-3 py-1.5 text-sm rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            ↷ Redo
                        </button>
                    </div>

                    {/* Headings */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-200' : ''
                                }`}
                            title="Heading 1"
                        >
                            H1
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-200' : ''
                                }`}
                            title="Heading 2"
                        >
                            H2
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-200' : ''
                                }`}
                            title="Heading 3"
                        >
                            H3
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setParagraph().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('paragraph') ? 'bg-blue-200' : ''
                                }`}
                            title="Paragraph"
                        >
                            P
                        </button>
                    </div>

                    {/* Text Formatting */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-blue-200 font-bold' : ''
                                }`}
                            title="Bold"
                        >
                            <strong>B</strong>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-blue-200 italic' : ''
                                }`}
                            title="Italic"
                        >
                            <em>I</em>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-blue-200 underline' : ''
                                }`}
                            title="Underline"
                        >
                            <u>U</u>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('strike') ? 'bg-blue-200 line-through' : ''
                                }`}
                            title="Strikethrough"
                        >
                            <s>S</s>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleSubscript().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('subscript') ? 'bg-blue-200' : ''
                                }`}
                            title="Subscript"
                        >
                            x<sub>2</sub>
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleSuperscript().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('superscript') ? 'bg-blue-200' : ''
                                }`}
                            title="Superscript"
                        >
                            x<sup>2</sup>
                        </button>
                    </div>

                    {/* Colors */}
                    <div className="relative border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('textStyle') ? 'bg-blue-200' : ''
                                }`}
                            title="Text Color"
                        >
                            <span className="text-blue-600">A</span>
                        </button>
                        {showColorPicker && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 w-64">
                                <div className="grid grid-cols-6 gap-1 mb-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor.chain().focus().setColor(color).run();
                                                setShowColorPicker(false);
                                            }}
                                            className="w-8 h-8 border border-gray-300 rounded hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    onChange={(e) => {
                                        editor.chain().focus().setColor(e.target.value).run();
                                        setShowColorPicker(false);
                                    }}
                                    className="w-full h-8 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>

                    {/* Highlight */}
                    <div className="relative border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('highlight') ? 'bg-blue-200' : ''
                                }`}
                            title="Highlight"
                        >
                            <span className="bg-yellow-300 px-1">A</span>
                        </button>
                        {showHighlightPicker && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 w-64">
                                <div className="grid grid-cols-6 gap-1 mb-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                editor.chain().focus().toggleHighlight({ color }).run();
                                                setShowHighlightPicker(false);
                                            }}
                                            className="w-8 h-8 border border-gray-300 rounded hover:scale-110 transition-transform"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    onChange={(e) => {
                                        editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
                                        setShowHighlightPicker(false);
                                    }}
                                    className="w-full h-8 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().unsetHighlight().run();
                                        setShowHighlightPicker(false);
                                    }}
                                    className="mt-2 w-full px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Remove Highlight
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Lists */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-blue-200' : ''
                                }`}
                            title="Bullet List"
                        >
                            • List
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-blue-200' : ''
                                }`}
                            title="Numbered List"
                        >
                            1. List
                        </button>
                    </div>

                    {/* Alignment */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-200' : ''
                                }`}
                            title="Align Left"
                        >
                            ⬅
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-200' : ''
                                }`}
                            title="Align Center"
                        >
                            ⬌
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-200' : ''
                                }`}
                            title="Align Right"
                        >
                            ➡
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-200' : ''
                                }`}
                            title="Justify"
                        >
                            ⬌⬌
                        </button>
                    </div>

                    {/* Line Spacing */}
                    <div className="relative border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            data-line-spacing-btn
                            onClick={() => setShowLineSpacing(!showLineSpacing)}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('paragraph') || editor.isActive('heading') ? 'bg-blue-200' : ''
                                }`}
                            title="Line Spacing"
                        >
                            ║
                        </button>
                        {showLineSpacing && (
                            <div className="line-spacing-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 w-48">
                                <div className="text-xs font-semibold mb-2 text-gray-700">Line Spacing</div>
                                {['1', '1.15', '1.5', '2', '2.5', '3'].map((spacing) => (
                                    <button
                                        key={spacing}
                                        type="button"
                                        onClick={() => {
                                            if (editor) {
                                                const { state } = editor;
                                                const { $from } = state.selection;
                                                const node = $from.parent;

                                                // Select the entire paragraph/heading
                                                editor.chain()
                                                    .focus()
                                                    .setTextSelection({ from: $from.start($from.depth), to: $from.end($from.depth) })
                                                    .setLineHeight(spacing)
                                                    .run();
                                            }
                                            setShowLineSpacing(false);
                                        }}
                                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                                    >
                                        {spacing}x
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().unsetLineHeight().run();
                                        setShowLineSpacing(false);
                                    }}
                                    className="mt-2 w-full text-left px-2 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Letter Spacing */}
                    <div className="relative border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            data-letter-spacing-btn
                            onClick={() => setShowLetterSpacing(!showLetterSpacing)}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('letterSpacing') ? 'bg-blue-200' : ''
                                }`}
                            title="Letter Spacing"
                        >
                            ═
                        </button>
                        {showLetterSpacing && (
                            <div className="letter-spacing-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-50 w-48">
                                <div className="text-xs font-semibold mb-2 text-gray-700">Letter Spacing</div>
                                {[
                                    { label: 'Tight', value: '-0.05em' },
                                    { label: 'Normal', value: '0' },
                                    { label: 'Wide', value: '0.05em' },
                                    { label: 'Wider', value: '0.1em' },
                                    { label: 'Widest', value: '0.15em' },
                                ].map(({ label, value }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            editor.chain().focus().setLetterSpacing(value).run();
                                            setShowLetterSpacing(false);
                                        }}
                                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                                    >
                                        {label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().unsetLetterSpacing().run();
                                        setShowLetterSpacing(false);
                                    }}
                                    className="mt-2 w-full text-left px-2 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    Reset
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Link */}
                    <div className="relative border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={handleAddLink}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-200' : ''
                                }`}
                            title="Link"
                        >
                            🔗
                        </button>
                        {showLinkDialog && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-3 z-50 w-64">
                                <input
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="Enter URL"
                                    className="w-full px-2 py-1 border border-gray-300 rounded mb-2"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleSetLink}
                                        className="flex-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        {editor.isActive('link') ? 'Update' : 'Add'}
                                    </button>
                                    {editor.isActive('link') && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLink}
                                            className="px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowLinkDialog(false);
                                            setLinkUrl('');
                                        }}
                                        className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Other Formatting */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-blue-200' : ''
                                }`}
                            title="Blockquote"
                        >
                            " Quote
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-blue-200' : ''
                                }`}
                            title="Code Block"
                        >
                            {'</>'}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            className={`px-2 py-1.5 text-sm rounded hover:bg-gray-200 ${editor.isActive('code') ? 'bg-blue-200' : ''
                                }`}
                            title="Inline Code"
                        >
                            {'<>'}
                        </button>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            className="px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                            title="Horizontal Rule"
                        >
                            ─
                        </button>
                    </div>

                    {/* Media */}
                    <div className="flex gap-1 border-r border-gray-300 pr-2">
                        <button
                            type="button"
                            onClick={handleAddImage}
                            className="px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                            title="Insert Image"
                        >
                            🖼️
                        </button>
                        <button
                            type="button"
                            onClick={handleAddTable}
                            className="px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                            title="Insert Table"
                        >
                            ⧉ Table
                        </button>
                    </div>

                    {/* Table Controls */}
                    {editor.isActive('table') && (
                        <div className="flex gap-1 border-r border-gray-300 pr-2">
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnBefore().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Add Column Before"
                            >
                                +Col←
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addColumnAfter().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Add Column After"
                            >
                                +Col→
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteColumn().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Delete Column"
                            >
                                -Col
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowBefore().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Add Row Before"
                            >
                                +Row↑
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().addRowAfter().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Add Row After"
                            >
                                +Row↓
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteRow().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Delete Row"
                            >
                                -Row
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().deleteTable().run()}
                                className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
                                title="Delete Table"
                            >
                                🗑️
                            </button>
                        </div>
                    )}

                    {/* Clear */}
                    <div>
                        <button
                            type="button"
                            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                            className="px-2 py-1.5 text-sm rounded hover:bg-gray-200"
                            title="Clear Formatting"
                        >
                            🧹 Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Content */}
            <div className="min-h-[400px] bg-white overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-300 flex justify-between items-center">
                <span>{plainTextLength} characters</span>
                <div className="flex gap-4">
                    <span>Words: {value ? value.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length : 0}</span>
                    <span>Paragraphs: {value ? (value.match(/<p[^>]*>/g) || []).length : 0}</span>
                </div>
            </div>
        </div>
    );
};

export default RichTextEditor;
