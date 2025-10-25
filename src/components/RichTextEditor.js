'use client'

import { useState, useRef, useEffect } from 'react';

const RichTextEditor = ({ value, onChange, placeholder = "Enter content..." }) => {
    const editorRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const insertList = (type) => {
        execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList');
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertHeading = (level) => {
        execCommand('formatBlock', `h${level}`);
    };

    const insertParagraph = () => {
        execCommand('formatBlock', 'p');
    };

    const insertLineBreak = () => {
        execCommand('insertHTML', '<br>');
    };

    const clearFormatting = () => {
        execCommand('removeFormat');
    };

    const ToolbarButton = ({ onClick, children, title, isActive = false }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                }`}
        >
            {children}
        </button>
    );

    const ToolbarSeparator = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
                {/* Text Formatting */}
                <div className="flex items-center gap-1">
                    <ToolbarButton onClick={() => execCommand('bold')} title="Bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('italic')} title="Italic">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4M8 20h4M12 4l-2 16" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('underline')} title="Underline">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-3-3m3 3l3-3" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={clearFormatting} title="Clear Formatting">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* Headings */}
                <div className="flex items-center gap-1">
                    <ToolbarButton onClick={() => insertHeading(1)} title="Heading 1">
                        H1
                    </ToolbarButton>
                    <ToolbarButton onClick={() => insertHeading(2)} title="Heading 2">
                        H2
                    </ToolbarButton>
                    <ToolbarButton onClick={() => insertHeading(3)} title="Heading 3">
                        H3
                    </ToolbarButton>
                    <ToolbarButton onClick={insertParagraph} title="Paragraph">
                        P
                    </ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* Lists */}
                <div className="flex items-center gap-1">
                    <ToolbarButton onClick={() => insertList('unordered')} title="Bullet List">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => insertList('ordered')} title="Numbered List">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* Alignment */}
                <div className="flex items-center gap-1">
                    <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Align Left">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Align Center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={() => execCommand('justifyRight')} title="Align Right">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </ToolbarButton>
                </div>

                <ToolbarSeparator />

                {/* Links and Line Breaks */}
                <div className="flex items-center gap-1">
                    <ToolbarButton onClick={insertLink} title="Insert Link">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </ToolbarButton>
                    <ToolbarButton onClick={insertLineBreak} title="Line Break">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </ToolbarButton>
                </div>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`min-h-[300px] p-4 focus:outline-none rich-text-editor ${isFocused ? 'ring-2 ring-blue-500' : ''
                    }`}
                style={{
                    minHeight: '300px',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                }}
                data-placeholder={placeholder}
                suppressContentEditableWarning={true}
            />

            {/* Placeholder */}
            {!value && !isFocused && (
                <div className="absolute top-16 left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}

            {/* Character count */}
            <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 border-t border-gray-300">
                {value ? value.replace(/<[^>]*>/g, '').length : 0} characters
            </div>
        </div>
    );
};

export default RichTextEditor;
