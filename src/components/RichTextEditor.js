'use client'

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import 'highlight.js/styles/github-dark.css';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Node } from '@tiptap/core';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { TextStyle, Color, LineHeight } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Mark } from '@tiptap/core';
import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
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

// ─── Resizable Image Node View (React component rendered per image) ───────────
const ResizableImageView = ({ node, updateAttributes, selected }) => {
    const imgRef = useRef(null);
    const startX = useRef(0);
    const startW = useRef(0);

    const onMouseDown = useCallback((e, isLeft) => {
        e.preventDefault();
        e.stopPropagation();
        startX.current = e.clientX;
        startW.current = imgRef.current ? imgRef.current.offsetWidth : (node.attrs.width || 400);

        const onMove = (moveEvt) => {
            const dx = moveEvt.clientX - startX.current;
            const delta = isLeft ? -dx : dx;
            const newWidth = Math.max(80, Math.round(startW.current + delta));
            updateAttributes({ width: newWidth });
        };

        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [node.attrs.width, updateAttributes]);

    const width = node.attrs.width ? `${node.attrs.width}px` : 'auto';
    const handle = {
        position: 'absolute', width: 10, height: 10,
        background: '#d97706', border: '2px solid #fff',
        borderRadius: 2, zIndex: 10, cursor: 'ew-resize',
    };

    return (
        <NodeViewWrapper
            as="span"
            style={{ display: 'inline-block', position: 'relative', maxWidth: '100%', lineHeight: 0, verticalAlign: 'middle' }}
        >
            <img
                ref={imgRef}
                src={node.attrs.src}
                alt={node.attrs.alt || ''}
                title={node.attrs.title || ''}
                style={{
                    width, height: 'auto', display: 'block', borderRadius: 4,
                    outline: selected ? '2px solid #d97706' : 'none',
                    outlineOffset: 2, userSelect: 'none', pointerEvents: selected ? 'none' : 'auto'
                }}
                draggable={false}
            />
            {selected && (
                <>
                    {/* Left handle */}
                    <span onMouseDown={(e) => onMouseDown(e, true)}
                        style={{ ...handle, top: '50%', left: -6, transform: 'translateY(-50%)',
                            cursor: 'w-resize', bottom: 'auto' }} />
                    {/* Right handle */}
                    <span onMouseDown={(e) => onMouseDown(e, false)}
                        style={{ ...handle, top: '50%', right: -6, transform: 'translateY(-50%)',
                            cursor: 'e-resize', bottom: 'auto' }} />
                    {/* Bottom-right corner */}
                    <span onMouseDown={(e) => onMouseDown(e, false)}
                        style={{ ...handle, bottom: -5, right: -5, cursor: 'se-resize', top: 'auto' }} />
                    {/* Bottom-left corner */}
                    <span onMouseDown={(e) => onMouseDown(e, true)}
                        style={{ ...handle, bottom: -5, left: -5, cursor: 'sw-resize', top: 'auto' }} />
                </>
            )}
        </NodeViewWrapper>
    );
};

// ─── ResizableImage TipTap Extension ────────────────────────────────────────
const ResizableImage = Node.create({
    name: 'image',
    group: 'inline',
    inline: true,
    draggable: true,
    selectable: true,

    addAttributes() {
        return {
            src:   { default: null },
            alt:   { default: null },
            title: { default: null },
            width: {
                default: null,
                parseHTML: (el) => {
                    const w = el.style.width || el.getAttribute('width');
                    return w ? parseInt(w, 10) : null;
                },
                renderHTML: (attrs) => {
                    if (!attrs.width) return {};
                    return { style: `width:${attrs.width}px`, width: attrs.width };
                },
            },
        };
    },

    parseHTML() {
        return [{ tag: 'img[src]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', { ...HTMLAttributes, class: 'max-w-full h-auto rounded' }];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageView);
    },

    addCommands() {
        return {
            setImage: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
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

    // Image Upload Modal States
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageAlt, setImageAlt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState('');

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
            ResizableImage,
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
        setImageAlt('');
        setImageUrl('');
        setImageFile(null);
        setImageUploadError('');
        setShowImageModal(true);
    };

    const handleImageSubmit = async () => {
        if (!imageAlt.trim()) {
            setImageUploadError('Alt text is required for search engines.');
            return;
        }

        setImageUploading(true);
        setImageUploadError('');

        try {
            let finalUrl = imageUrl;

            if (imageFile) {
                // Upload directly to Bunny CDN (same config as products/add)
                const BUNNY_STORAGE_ZONE = 'cly-bunny';
                const BUNNY_STORAGE_REGION = 'storage.bunnycdn.com';
                const BUNNY_PULL_ZONE = 'https://cly-pull-bunny.b-cdn.net';
                const BUNNY_API_KEY = '22cfd8b3-8021-40a3-b100a9d48bc0-7dc3-4654';

                const originalName = imageFile.name;
                const lastDot = originalName.lastIndexOf('.');
                const nameWithoutExt = lastDot > 0 ? originalName.substring(0, lastDot) : originalName;
                const ext = lastDot > 0 ? originalName.substring(lastDot) : '';
                const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                let suffix = '';
                for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
                const newFileName = `${nameWithoutExt}_${suffix}${ext}`;

                // Only encode the filename — do NOT encode the '/' in the path
                const objectKey = `blog/${encodeURIComponent(newFileName)}`;
                const uploadUrl = `https://${BUNNY_STORAGE_REGION}/${BUNNY_STORAGE_ZONE}/${objectKey}`;
                const publicUrl = `${BUNNY_PULL_ZONE}/${objectKey}`;

                const res = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { AccessKey: BUNNY_API_KEY, 'Content-Type': imageFile.type },
                    body: imageFile,
                });

                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error(`Upload failed: ${res.status} - ${errText}`);
                }

                finalUrl = publicUrl;
            }

            if (!finalUrl) {
                throw new Error('Please select a file to upload or enter an external image URL.');
            }

            editor.chain().focus().setImage({ src: finalUrl, alt: imageAlt }).run();
            setShowImageModal(false);
            setImageAlt('');
            setImageUrl('');
            setImageFile(null);
        } catch (error) {
            console.error('Error inserting image:', error);
            setImageUploadError(error.message || 'Failed to upload image.');
        } finally {
            setImageUploading(false);
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
        '#6633FF', '#CC00FF', '#FF0066', '#FF9878', '#FFCC00', '#99FF00',
        '#00FFCC', '#0099FF', '#9878FF', '#CC00CC', '#FF0066'
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

            {/* Image Upload Modal */}
            {showImageModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-gray-900 text-lg">Insert Image</h3>
                            <button
                                type="button"
                                onClick={() => setShowImageModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {imageUploadError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
                                    {imageUploadError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Option A: Upload Local File
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        setImageFile(e.target.files[0]);
                                        setImageUrl(''); // Clear url
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 transition-all"
                                    disabled={imageUploading}
                                />
                            </div>

                            <div className="relative py-2 flex items-center justify-center">
                                <span className="absolute bg-white px-3 text-xs text-gray-400 font-bold uppercase">Or</span>
                                <div className="w-full border-t border-gray-100"></div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Option B: Image URL
                                </label>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => {
                                        setImageUrl(e.target.value);
                                        setImageFile(null); // Clear file
                                    }}
                                    placeholder="https://example.com/image.png"
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                                    disabled={imageUploading}
                                />
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Alt Text (Required for SEO)
                                </label>
                                <input
                                    type="text"
                                    value={imageAlt}
                                    onChange={(e) => setImageAlt(e.target.value)}
                                    placeholder="Describe this image for search engines..."
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all text-gray-800"
                                    required
                                    disabled={imageUploading}
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowImageModal(false)}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
                                    disabled={imageUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleImageSubmit}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5"
                                    disabled={imageUploading}
                                >
                                    {imageUploading ? 'Inserting...' : 'Insert Image'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
