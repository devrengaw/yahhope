import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Smile, 
  ChevronDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Palette, 
  Image as ImageIcon, 
  Upload, 
  Link2, 
  Loader2,
  X
} from 'lucide-react';
import { uploadBlogImage } from '../../lib/imageUpload';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeFont, setActiveFont] = useState('Inter');
  const [activeSize, setActiveSize] = useState('16px');

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
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

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    } else if (editorRef.current) {
      editorRef.current.focus();
    }
  };

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

  const insertHtmlAtCursor = (html: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement('div');
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      let lastNode: ChildNode | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        const newRange = range.cloneRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else if (editorRef.current) {
      editorRef.current.innerHTML += html;
    }

    handleInput();
  };

  const insertImageIntoEditor = (src: string, captionText = 'Foto da matéria') => {
    const imgHtml = `
      <figure style="margin: 1.5rem 0; text-align: center;">
        <img src="${src}" alt="${captionText}" style="max-width: 100%; border-radius: 1rem; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block;" />
        <figcaption style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; font-family: monospace;">${captionText}</figcaption>
      </figure>
      <p><br></p>
    `;
    insertHtmlAtCursor(imgHtml);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    try {
      setIsUploadingImage(true);
      const url = await uploadBlogImage(file, { maxWidth: 1200, quality: 0.85 });
      insertImageIntoEditor(url, file.name.replace(/\.[^/.]+$/, ''));
      setShowImageModal(false);
    } catch {
      alert('Falha ao processar a imagem. Tente novamente.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteOrDrop = (e: React.DragEvent | React.ClipboardEvent) => {
    const items = 'dataTransfer' in e ? e.dataTransfer?.files : (e as React.ClipboardEvent).clipboardData?.files;
    if (items && items.length > 0) {
      const file = items[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleFileUpload(file);
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    insertImageIntoEditor(imageUrlInput.trim());
    setImageUrlInput('');
    setShowImageModal(false);
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
      {/* Hidden file input for direct file choosing */}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="bg-slate-50 p-2 border-b border-slate-100 flex flex-wrap items-center gap-1 rounded-t-2xl relative z-30">
        {/* Font Select */}
        <div className="relative group">
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            {activeFont} <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 p-1">
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
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 hover:bg-white rounded-lg text-xs font-semibold text-slate-600 transition-all border border-transparent hover:border-slate-200">
            {activeSize} <ChevronDown size={14} />
          </button>
          <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-slate-200 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 p-1">
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
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Negrito">
          <Bold size={17} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Itálico">
          <Italic size={17} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Sublinhado">
          <Underline size={17} />
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
            <Palette size={17} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 grid grid-cols-5 gap-2 w-max">
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
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Alinhar à Esquerda">
          <AlignLeft size={17} />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Centralizar">
          <AlignCenter size={17} />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Alinhar à Direita">
          <AlignRight size={17} />
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Lista com Marcadores">
          <List size={17} />
        </button>

        {/* Upload Image Button */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              saveSelection();
              setShowImageModal(!showImageModal);
            }}
            className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 transition-all border border-indigo-100 bg-white flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            title="Inserir Foto no Texto"
          >
            <ImageIcon size={16} className="text-indigo-600" />
            <span className="hidden sm:inline">Foto</span>
          </button>

          {showImageModal && (
            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 w-72 sm:w-80 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-indigo-600" /> Inserir Imagem
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowImageModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Upload directly from device */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-200 transition-colors cursor-pointer"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processando imagem...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Fazer Upload do Computador</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="h-[1px] bg-slate-200 flex-1" />
                  <span>Ou por link</span>
                  <div className="h-[1px] bg-slate-200 flex-1" />
                </div>

                <form onSubmit={handleUrlSubmit} className="space-y-2">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Link2 size={13} />
                    <span>Inserir via Link</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Emoji Picker */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200"
            title="Emojis"
          >
            <Smile size={17} />
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 grid grid-cols-6 gap-2 w-max max-h-60 overflow-y-auto">
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
        onDrop={handlePasteOrDrop}
        onPaste={handlePasteOrDrop}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="min-h-[420px] p-8 focus:outline-none prose prose-slate max-w-none prose-p:my-2 prose-img:rounded-2xl"
        style={{ fontFamily: activeFont, fontSize: activeSize }}
      />
    </div>
  );
}
