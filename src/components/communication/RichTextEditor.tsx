import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, Type, Smile, ChevronDown, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeFont, setActiveFont] = useState('Inter');
  const [activeSize, setActiveSize] = useState('16px');
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContent = useRef(content);

  // Sync initial content or external changes only when not focused
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = content;
        lastContent.current = content;
      }
    }
  }, [content]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      lastContent.current = newContent;
      onChange(newContent);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      lastContent.current = newContent;
      onChange(newContent);
    }
  };

  const fonts = ['Inter', 'Poppins', 'Kanit', 'Optima', 'Roboto', 'Merriweather', 'Monospace'];
  const sizes = ['12px', '14px', '16px', '20px', '24px', '32px'];
  const emojis = [
    '😀', '😍', '🙌', '🚀', '✨', '💡', '❤️', '✅', '⚠️', '📍',
    '🌟', '🔥', '🎉', '👏', '💪', '🤝', '🌍', '🏥', '🍎', '🏠',
    '📱', '💻', '✉️', '📞', '💬', '🔔', '🎨', '⚙️', '📈', '📋'
  ];
  const colors = [
    '#000000', '#475569', '#6366f1', '#10b981', '#f43f5e', 
    '#f59e0b', '#8b5cf6', '#0ea5e9', '#ec4899', '#ffffff'
  ];

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all relative">
      {/* Toolbar */}
      <div className="bg-slate-50 p-2 border-b border-slate-100 flex flex-wrap items-center gap-1 rounded-t-2xl relative z-30">
        {/* Font Select */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            {activeFont} <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
            {fonts.map(f => (
              <button 
                key={f}
                type="button"
                onClick={() => { execCommand('fontName', f); setActiveFont(f); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm"
                style={{ fontFamily: f }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Size Select */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            {activeSize} <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-1">
            {sizes.map(s => (
              <button 
                key={s}
                type="button"
                onClick={() => { execCommand('fontSize', '3'); setActiveSize(s); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        {/* Formatting Actions */}
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Bold">
          <Bold size={18} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Italic">
          <Italic size={18} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Underline">
          <Underline size={18} />
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        {/* Color Picker */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200"
            title="Cor do Texto"
          >
            <Palette size={18} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 grid grid-cols-5 gap-2 w-max">
              {colors.map(c => (
                <button 
                  key={c}
                  type="button"
                  onClick={() => { execCommand('foreColor', c); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        {/* Alignment */}
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200">
          <AlignLeft size={18} />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200">
          <AlignCenter size={18} />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200">
          <AlignRight size={18} />
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200">
          <List size={18} />
        </button>

        {/* Emoji Picker */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200"
            title="Emojis"
          >
            <Smile size={18} />
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 grid grid-cols-6 gap-2 w-max max-h-60 overflow-y-auto">
              {emojis.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => { execCommand('insertHTML', e); setShowEmojiPicker(false); }}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-8 focus:outline-none prose prose-slate max-w-none prose-p:my-2"
        style={{ fontFamily: activeFont, fontSize: activeSize }}
      />
    </div>
  );
}


