'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapImage from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle, FontFamily } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Highlighter,
  Minus,
  RemoveFormatting,
  Table2,
  Rows3,
  Columns3,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadMedia } from '@org/api';

const ImageWithCaption = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      title: { default: null },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { title, ...rest } = HTMLAttributes;
    if (title) {
      return [
        'figure',
        { class: 'image-with-caption' },
        ['img', rest],
        ['figcaption', {}, title],
      ];
    }
    return ['img', rest];
  },
  parseHTML() {
    return [
      {
        tag: 'figure.image-with-caption',
        getAttrs(node) {
          const img = (node as HTMLElement).querySelector('img');
          const figcaption = (node as HTMLElement).querySelector('figcaption');
          return {
            src: img?.getAttribute('src'),
            alt: img?.getAttribute('alt'),
            title: figcaption?.textContent || img?.getAttribute('title'),
          };
        },
      },
      {
        tag: 'img[src]',
        getAttrs(node) {
          return {
            src: (node as HTMLElement).getAttribute('src'),
            alt: (node as HTMLElement).getAttribute('alt'),
            title: (node as HTMLElement).getAttribute('title'),
          };
        },
      },
    ];
  },
});

interface RichTextEditorProps {
  content: string | object;
  onChange: (content: string, json: object) => void;
  placeholder?: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all duration-150 ${
        isActive
          ? 'bg-[#003153] text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      } disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({ rows: 0, cols: 0 });
  const tablePickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your article...',
      }),
      ImageWithCaption.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full h-auto mx-auto' },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#003153] dark:text-[#F59E0B] underline cursor-pointer' },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TextStyle.configure(),
      FontFamily.configure(),
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onCreate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4 ' +
          'prose-headings:text-gray-900 dark:prose-headings:text-white ' +
          'prose-p:text-gray-700 dark:prose-p:text-gray-300 ' +
          'prose-a:text-[#003153] dark:prose-a:text-[#F59E0B] ' +
          'prose-blockquote:border-l-[#003153] dark:prose-blockquote:border-l-[#F59E0B] ' +
          'prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1 ' +
          'prose-table:border-collapse prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:p-2 ' +
          'prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:p-2 prose-th:bg-gray-100 dark:prose-th:bg-gray-700',
      },
    },
  });

  const [uploading, setUploading] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  const addImage = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const media = await uploadMedia(file);
        setPendingImageUrl(media.url);
        setImageCaption('');
        setShowCaptionInput(true);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [editor]);

  const insertImageWithCaption = useCallback(() => {
    if (!editor || !pendingImageUrl) return;
    editor.chain().focus().setImage({
      src: pendingImageUrl,
      ...(imageCaption ? { title: imageCaption } : {}),
    }).run();
    setPendingImageUrl('');
    setImageCaption('');
    setShowCaptionInput(false);
  }, [editor, pendingImageUrl, imageCaption]);

  const cancelImageInsert = useCallback(() => {
    setPendingImageUrl('');
    setImageCaption('');
    setShowCaptionInput(false);
  }, []);

  // Close table picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLink = useCallback(() => {
    if (!editor) return;

    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    setShowLinkInput(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  if (!editor) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
      {/* Toolbar */}
      <div className="sticky top-[7.5rem] z-20 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-t-xl">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Undo / Redo */}
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Font Family */}
          <select
            value={editor.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              if (e.target.value) {
                editor.chain().focus().setFontFamily(e.target.value).run();
              } else {
                editor.chain().focus().unsetFontFamily().run();
              }
            }}
            className="h-8 px-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#003153] appearance-none cursor-pointer"
            title="Font Family"
          >
            <option value="">Default</option>
            <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter</option>
            <option value="Arial" style={{ fontFamily: 'Arial' }}>Arial</option>
            <option value="Georgia" style={{ fontFamily: 'Georgia' }}>Georgia</option>
            <option value="Times New Roman" style={{ fontFamily: 'Times New Roman' }}>Times New Roman</option>
            <option value="Courier New" style={{ fontFamily: 'Courier New' }}>Courier New</option>
            <option value="Verdana" style={{ fontFamily: 'Verdana' }}>Verdana</option>
            <option value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS' }}>Trebuchet MS</option>
            <option value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
          </select>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              if (editor.isActive('blockquote')) {
                editor.chain().focus().lift('blockquote').run();
              } else {
                // Collapse selection to current paragraph before wrapping
                const { from } = editor.state.selection;
                const $from = editor.state.doc.resolve(from);
                const start = $from.start($from.depth);
                const end = $from.end($from.depth);
                editor.chain().focus().setTextSelection({ from: start, to: end }).wrapIn('blockquote').run();
              }
            }}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Table */}
          <div className="relative" ref={tablePickerRef}>
            <ToolbarButton onClick={() => setShowTablePicker(!showTablePicker)} isActive={editor.isActive('table')} title="Insert Table">
              <Table2 className="w-4 h-4" />
            </ToolbarButton>
            {showTablePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 z-50">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {tableHover.rows > 0 ? `${tableHover.rows} × ${tableHover.cols}` : 'Select size'}
                </p>
                <div className="grid grid-cols-6 gap-1">
                  {Array.from({ length: 36 }, (_, i) => {
                    const row = Math.floor(i / 6) + 1;
                    const col = (i % 6) + 1;
                    const isHighlighted = row <= tableHover.rows && col <= tableHover.cols;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`w-5 h-5 rounded-sm border transition-colors ${
                          isHighlighted
                            ? 'bg-[#003153] border-[#003153]'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        onMouseEnter={() => setTableHover({ rows: row, cols: col })}
                        onClick={() => {
                          editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run();
                          setShowTablePicker(false);
                          setTableHover({ rows: 0, cols: 0 });
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {editor.isActive('table') && (
            <>
              <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                <Rows3 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                <Columns3 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <Trash2 className="w-4 h-4" />
              </ToolbarButton>
            </>
          )}

          <ToolbarDivider />

          {/* Link & Image */}
          <ToolbarButton onClick={toggleLink} isActive={editor.isActive('link')} title="Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} disabled={uploading} title="Image">
            {uploading ? (
              <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </ToolbarButton>

          <ToolbarDivider />

          {/* Clear formatting */}
          <ToolbarButton onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear Formatting">
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Link input */}
        {showLinkInput && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 h-8 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
              }}
              autoFocus
            />
            <button type="button" onClick={applyLink} className="h-8 px-3 text-sm font-medium text-white bg-[#003153] rounded-lg hover:opacity-90">
              Apply
            </button>
            <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} className="h-8 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Cancel
            </button>
          </div>
        )}

        {/* Caption input for image */}
        {showCaptionInput && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <img
                src={pendingImageUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="w-full h-8 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003153]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); insertImageWithCaption(); }
                    if (e.key === 'Escape') { cancelImageInsert(); }
                  }}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={insertImageWithCaption} className="h-8 px-3 text-sm font-medium text-white bg-[#003153] rounded-lg hover:opacity-90">
                    Insert
                  </button>
                  <button type="button" onClick={cancelImageInsert} className="h-8 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      {/* Word count */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
          {' · '}
          {editor.storage.characterCount?.words?.() ?? editor.getText().split(/\s+/).filter(Boolean).length} words
        </p>
      </div>
    </div>
  );
}
