import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Smile } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize the content only once or when value changes externally (not during typing)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={cn("border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Negrito"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Itálico"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Sublinhado"
        >
          <Underline size={16} />
        </button>
        
        <div className="w-px h-5 bg-slate-200 mx-1"></div>

        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Alinhar à Esquerda"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Centralizar"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
          title="Alinhar à Direita"
        >
          <AlignRight size={16} />
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1"></div>

        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="text-xs font-medium text-slate-600 bg-transparent border-none focus:ring-0 p-1 cursor-pointer"
          defaultValue=""
          title="Formatação"
        >
          <option value="" disabled>Parágrafo</option>
          <option value="H1">Título Grande</option>
          <option value="H2">Título Médio</option>
          <option value="H3">Título Pequeno</option>
          <option value="P">Texto Normal</option>
        </select>

        <div className="w-px h-5 bg-slate-200 mx-1"></div>

        <div className="relative group">
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors"
            title="Emojis"
          >
            <Smile size={16} />
          </button>
          <div className="absolute top-full right-0 md:left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl p-2 hidden group-hover:grid grid-cols-5 gap-1 z-10 w-40">
            {['😀','😂','🥰','🙏','👏','🎉','🧡','✨','🚀','💪'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                className="text-lg p-1 hover:bg-slate-100 rounded text-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-4 outline-none min-h-[250px] max-h-[400px] overflow-y-auto prose prose-sm prose-slate"
      />
    </div>
  );
}
