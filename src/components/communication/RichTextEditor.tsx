import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
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
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  Columns,
  Rows
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
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hoverRows, setHoverRows] = useState(3);
  const [hoverCols, setHoverCols] = useState(3);
  const [tableWithHeader, setTableWithHeader] = useState(true);
  const [currentTableContext, setCurrentTableContext] = useState<{
    table: HTMLTableElement;
    row: HTMLTableRowElement | null;
    cell: HTMLTableCellElement | null;
    rowIndex: number;
    colIndex: number;
  } | null>(null);
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

  const checkTableContext = () => {
    saveSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setCurrentTableContext(null);
      return;
    }
    let node: Node | null = sel.anchorNode;
    let cell: HTMLTableCellElement | null = null;
    let row: HTMLTableRowElement | null = null;
    let table: HTMLTableElement | null = null;

    while (node && node !== editorRef.current) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        cell = node as HTMLTableCellElement;
      }
      if (node.nodeName === 'TR') {
        row = node as HTMLTableRowElement;
      }
      if (node.nodeName === 'TABLE') {
        table = node as HTMLTableElement;
        break;
      }
      node = node.parentNode;
    }

    if (table) {
      const rowIndex = row ? row.rowIndex : -1;
      const colIndex = cell ? cell.cellIndex : -1;
      setCurrentTableContext({ table, row, cell, rowIndex, colIndex });
    } else {
      setCurrentTableContext(null);
    }
  };

  const insertTable = (rows: number, cols: number, withHeader: boolean) => {
    const validRows = Math.max(1, Math.min(20, rows));
    const validCols = Math.max(1, Math.min(10, cols));

    let html = `<div class="table-container my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">`;
    html += `<table style="width: 100%; border-collapse: collapse; min-width: 450px; font-size: 0.875rem;">`;

    if (withHeader) {
      html += `<thead><tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">`;
      for (let c = 1; c <= validCols; c++) {
        html += `<th style="padding: 10px 14px; text-align: left; font-weight: 700; color: #1e293b; border: 1px solid #e2e8f0;">Coluna ${c}</th>`;
      }
      html += `</tr></thead>`;
    }

    html += `<tbody>`;
    const bodyRows = withHeader ? Math.max(1, validRows - 1) : validRows;
    for (let r = 1; r <= bodyRows; r++) {
      html += `<tr style="border-bottom: 1px solid #f1f5f9;">`;
      for (let c = 1; c <= validCols; c++) {
        html += `<td style="padding: 10px 14px; color: #334155; border: 1px solid #e2e8f0;">Item ${r}.${c}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div><p><br></p>`;

    insertHtmlAtCursor(html);
    setShowTableModal(false);
  };

  const insertRowInTable = (table: HTMLTableElement, targetRow: HTMLTableRowElement | null) => {
    const colCount = table.rows[0]?.cells.length || 3;
    const newRow = document.createElement('tr');
    newRow.style.borderBottom = '1px solid #f1f5f9';
    for (let c = 0; c < colCount; c++) {
      const td = document.createElement('td');
      td.style.padding = '10px 14px';
      td.style.color = '#334155';
      td.style.border = '1px solid #e2e8f0';
      td.innerHTML = 'Novo item';
      newRow.appendChild(td);
    }
    if (targetRow && targetRow.parentNode) {
      if (targetRow.nextSibling) {
        targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
      } else {
        targetRow.parentNode.appendChild(newRow);
      }
    } else {
      const tbody = table.querySelector('tbody') || table;
      tbody.appendChild(newRow);
    }
    handleInput();
    setShowTableModal(false);
  };

  const insertColumnInTable = (table: HTMLTableElement, targetColIndex: number) => {
    for (let i = 0; i < table.rows.length; i++) {
      const r = table.rows[i];
      const isHeaderRow = r.parentNode?.nodeName === 'THEAD' || r.cells[0]?.nodeName === 'TH';
      const cell = document.createElement(isHeaderRow ? 'th' : 'td');
      if (isHeaderRow) {
        cell.style.padding = '10px 14px';
        cell.style.fontWeight = '700';
        cell.style.color = '#1e293b';
        cell.style.border = '1px solid #e2e8f0';
        cell.style.textAlign = 'left';
        cell.textContent = `Coluna ${r.cells.length + 1}`;
      } else {
        cell.style.padding = '10px 14px';
        cell.style.color = '#334155';
        cell.style.border = '1px solid #e2e8f0';
        cell.innerHTML = 'Novo dado';
      }
      if (targetColIndex >= 0 && targetColIndex < r.cells.length) {
        const refCell = r.cells[targetColIndex];
        if (refCell.nextSibling) {
          r.insertBefore(cell, refCell.nextSibling);
        } else {
          r.appendChild(cell);
        }
      } else {
        r.appendChild(cell);
      }
    }
    handleInput();
    setShowTableModal(false);
  };

  const deleteRowInTable = (table: HTMLTableElement, targetRow: HTMLTableRowElement | null) => {
    if (targetRow) {
      targetRow.remove();
      if (table.rows.length === 0) {
        const container = table.closest('.table-container');
        if (container) container.remove();
        else table.remove();
      }
      handleInput();
      setShowTableModal(false);
    }
  };

  const deleteColumnInTable = (table: HTMLTableElement, targetColIndex: number) => {
    if (targetColIndex >= 0) {
      for (let i = 0; i < table.rows.length; i++) {
        const r = table.rows[i];
        if (r.cells[targetColIndex]) {
          r.cells[targetColIndex].remove();
        }
      }
      if (table.rows[0]?.cells.length === 0) {
        const container = table.closest('.table-container');
        if (container) container.remove();
        else table.remove();
      }
      handleInput();
      setShowTableModal(false);
    }
  };

  const deleteEntireTable = (table: HTMLTableElement) => {
    const container = table.closest('.table-container');
    if (container) {
      container.remove();
    } else {
      table.remove();
    }
    handleInput();
    setShowTableModal(false);
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
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-white hover:text-indigo-600 rounded-lg text-slate-500 transition-all border border-transparent hover:border-slate-200" title="Lista Numerada">
          <ListOrdered size={17} />
        </button>

        {/* Upload Image Button */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              saveSelection();
              setShowImageModal(!showImageModal);
              setShowTableModal(false);
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

        {/* Table Button & Dropdown */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => {
              checkTableContext();
              setShowTableModal(!showTableModal);
              setShowImageModal(false);
            }}
            className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 transition-all border border-indigo-100 bg-white flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            title="Criar e Gerenciar Tabelas"
          >
            <TableIcon size={16} className="text-indigo-600" />
            <span className="hidden sm:inline">Tabela</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          {showTableModal && (
            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 w-72 sm:w-84 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TableIcon size={14} className="text-indigo-600" /> 
                  {currentTableContext ? 'Gerenciar Tabela' : 'Inserir Tabela'}
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowTableModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X size={14} />
                </button>
              </div>

              {/* If cursor is inside a table, show quick contextual operations */}
              {currentTableContext && (
                <div className="mb-4 pb-3 border-b border-slate-100 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Opções da Tabela Selecionada
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => insertRowInTable(currentTableContext.table, currentTableContext.row)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer text-left"
                    >
                      <Rows size={13} className="text-indigo-500 shrink-0" />
                      <span>+ Linha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertColumnInTable(currentTableContext.table, currentTableContext.colIndex)}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer text-left"
                    >
                      <Columns size={13} className="text-indigo-500 shrink-0" />
                      <span>+ Coluna</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRowInTable(currentTableContext.table, currentTableContext.row)}
                      className="px-2.5 py-1.5 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer text-left"
                    >
                      <Trash2 size={13} className="text-rose-500 shrink-0" />
                      <span>Excluir Linha</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteColumnInTable(currentTableContext.table, currentTableContext.colIndex)}
                      className="px-2.5 py-1.5 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 cursor-pointer text-left"
                    >
                      <Trash2 size={13} className="text-rose-500 shrink-0" />
                      <span>Excluir Coluna</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteEntireTable(currentTableContext.table)}
                    className="w-full mt-1 px-2.5 py-1.5 bg-rose-100/60 hover:bg-rose-200/80 text-rose-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Excluir Tabela Inteira</span>
                  </button>

                  <div className="pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
                    Ou criar nova tabela abaixo
                  </div>
                </div>
              )}

              {/* Grid Selector */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-semibold">Tamanho:</span>
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {hoverRows} × {hoverCols} {tableWithHeader ? '(com cabeçalho)' : ''}
                    </span>
                  </div>
                  <div 
                    className="grid grid-cols-6 gap-1 p-2 bg-slate-50 border border-slate-200 rounded-xl w-max mx-auto"
                    onMouseLeave={() => {
                      setHoverRows(tableRows);
                      setHoverCols(tableCols);
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <div key={r} className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map((c) => {
                          const isHighlighted = r <= hoverRows && c <= hoverCols;
                          return (
                            <div
                              key={c}
                              onMouseEnter={() => {
                                setHoverRows(r);
                                setHoverCols(c);
                              }}
                              onClick={() => {
                                setTableRows(r);
                                setTableCols(c);
                                insertTable(r, c, tableWithHeader);
                              }}
                              className={`w-5 h-5 rounded-sm border transition-all cursor-pointer ${
                                isHighlighted 
                                  ? 'bg-indigo-500 border-indigo-600 shadow-2xs' 
                                  : 'bg-white border-slate-200 hover:border-slate-400'
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Numeric Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Linhas</label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, tableRows - 1);
                          setTableRows(val);
                          setHoverRows(val);
                        }}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold text-xs"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min={1} 
                        max={20}
                        value={tableRows}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setTableRows(val);
                          setHoverRows(val);
                        }}
                        className="w-full text-center text-xs font-bold bg-white py-1.5 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.min(20, tableRows + 1);
                          setTableRows(val);
                          setHoverRows(val);
                        }}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Colunas</label>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(1, tableCols - 1);
                          setTableCols(val);
                          setHoverCols(val);
                        }}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold text-xs"
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        min={1} 
                        max={10}
                        value={tableCols}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setTableCols(val);
                          setHoverCols(val);
                        }}
                        className="w-full text-center text-xs font-bold bg-white py-1.5 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.min(10, tableCols + 1);
                          setTableCols(val);
                          setHoverCols(val);
                        }}
                        className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-200 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Header Checkbox */}
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
                  <input 
                    type="checkbox"
                    checked={tableWithHeader}
                    onChange={(e) => setTableWithHeader(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Linha de cabeçalho destacada</span>
                </label>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={() => insertTable(tableRows, tableCols, tableWithHeader)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  <Plus size={14} />
                  <span>Inserir Tabela ({tableRows} × {tableCols})</span>
                </button>
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
        className="min-h-[420px] p-8 focus:outline-none prose prose-slate max-w-none prose-p:my-2 prose-img:rounded-2xl [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100/90 [&_th]:p-2.5 [&_th]:font-bold [&_th]:text-slate-800 [&_td]:border [&_td]:border-slate-200 [&_td]:p-2.5 [&_td]:text-slate-700 [&_.table-container]:overflow-x-auto [&_.table-container]:my-4 [&_.table-container]:rounded-xl [&_.table-container]:border [&_.table-container]:border-slate-200"
        style={{ fontFamily: activeFont, fontSize: activeSize }}
      />
    </div>
  );
}
