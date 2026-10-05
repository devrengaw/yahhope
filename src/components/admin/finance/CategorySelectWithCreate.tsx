import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Check, 
  ChevronDown, 
  Tag, 
  X, 
  Loader2 
} from 'lucide-react';
import { TransactionCategory } from '../../../pages/admin/Finance';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';

export interface CategorySelectWithCreateProps {
  value: string;
  onChange: (categoryId: string) => void;
  categories: TransactionCategory[];
  type?: 'expense' | 'income';
  onCategoryCreated?: (newCategory: TransactionCategory) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const COLOR_OPTIONS = [
  { value: 'bg-rose-500', label: 'Rose' },
  { value: 'bg-indigo-500', label: 'Índigo' },
  { value: 'bg-amber-500', label: 'Âmbar' },
  { value: 'bg-emerald-500', label: 'Esmeralda' },
  { value: 'bg-blue-500', label: 'Azul' },
  { value: 'bg-purple-500', label: 'Roxo' },
  { value: 'bg-teal-500', label: 'Teal' },
  { value: 'bg-orange-500', label: 'Laranja' },
  { value: 'bg-slate-600', label: 'Grafite' },
];

export function CategorySelectWithCreate({
  value,
  onChange,
  categories,
  type = 'expense',
  onCategoryCreated,
  required = false,
  disabled = false,
  placeholder = 'Selecione a categoria...',
  className
}: CategorySelectWithCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value);
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Filtra categorias pelo tipo ('expense' ou 'income')
  const availableCategories = categories.filter(c => c.type === type);

  // Categoria selecionada atualmente
  const selectedCategory = categories.find(c => c.id === value);

  // Fecha popover ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco no input de busca ao abrir
  useEffect(() => {
    if (isOpen && !isCreating) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isCreating]);

  // Foco no input de criação ao iniciar criação
  useEffect(() => {
    if (isCreating) {
      setTimeout(() => {
        createInputRef.current?.focus();
      }, 50);
    }
  }, [isCreating]);

  // Filtragem pela busca
  const filteredCategories = availableCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const hasExactMatch = availableCategories.some(
    cat => cat.name.trim().toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const handleStartCreate = (initialName: string = '') => {
    setNewCatName(initialName);
    setIsCreating(true);
  };

  const handleSaveNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    setIsSaving(true);
    const newId = 'cat_' + Math.random().toString(36).substring(2, 9);
    const newCat: TransactionCategory = {
      id: newId,
      name: trimmed,
      type: type,
      color: selectedColor,
      icon: 'Tag'
    };

    try {
      const { error } = await supabase.from('finance_categories').insert([{
        id: newCat.id,
        name: newCat.name,
        type: newCat.type,
        color: newCat.color,
        icon: newCat.icon
      }]);
      if (error) {
        console.warn('Aviso ao gravar no Supabase, adicionando localmente:', error);
      }
    } catch (err) {
      console.warn('Erro ao conectar ao Supabase, adicionando localmente:', err);
    }

    // Notifica pai para atualizar listas e filtros
    onCategoryCreated?.(newCat);

    // Seleciona a categoria imediatamente
    onChange(newId);

    setIsSaving(false);
    setIsCreating(false);
    setIsOpen(false);
    setSearchQuery('');
    setNewCatName('');
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Hidden input para respeitar validação nativa de formulário HTML */}
      <input 
        type="text" 
        value={value} 
        onChange={() => {}} 
        required={required} 
        tabIndex={-1} 
        className="sr-only pointer-events-none" 
        aria-hidden="true"
      />

      {/* Botão de Disparo (Trigger) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setIsCreating(false);
            setSearchQuery('');
          }
        }}
        className={cn(
          "w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold transition-all bg-white flex items-center justify-between text-left",
          "focus:outline-none focus:border-slate-300",
          isOpen && "ring-4 ring-slate-500/5 border-slate-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedCategory ? (
            <>
              <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", selectedCategory.color || 'bg-slate-400')} />
              <span className="text-slate-800 truncate">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          size={16} 
          className={cn("text-slate-400 transition-transform shrink-0 ml-2", isOpen && "rotate-180")} 
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2">
          
          {/* Modo de Criação Direta */}
          {isCreating ? (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Tag size={13} className="text-indigo-600" />
                  Nova Categoria de Custos
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <input
                  ref={createInputRef}
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Nome da categoria (ex: Combustível, Softwares...)"
                  className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveNewCategory();
                    } else if (e.key === 'Escape') {
                      setIsCreating(false);
                    }
                  }}
                />
              </div>

              {/* Seletor de Cores */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cor da Categoria
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-all flex items-center justify-center cursor-pointer",
                        c.value,
                        selectedColor === c.value ? "scale-125 ring-2 ring-offset-2 ring-slate-900 shadow-sm" : "opacity-80 hover:opacity-100"
                      )}
                      title={c.label}
                    >
                      {selectedColor === c.value && <Check size={10} className="text-white drop-shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={!newCatName.trim() || isSaving}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Salvar Categoria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Barra de Busca rápida */}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ou criar categoria..."
                  className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!hasExactMatch && searchQuery.trim()) {
                        handleStartCreate(searchQuery.trim());
                      }
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Opção em Destaque: Quando não tiver a categoria digitada */}
              {searchQuery.trim() && !hasExactMatch && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => handleStartCreate(searchQuery.trim())}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-between transition-colors border border-indigo-200/80 group cursor-pointer"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Plus size={14} className="shrink-0 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <span className="truncate">
                        Criar categoria <strong>"{searchQuery.trim()}"</strong>
                      </span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-md shrink-0 ml-2">
                      Adicionar
                    </span>
                  </button>
                </div>
              )}

              {/* Lista de Categorias Existentes */}
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = cat.id === value;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onChange(cat.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between group cursor-pointer",
                        isSelected 
                          ? "bg-slate-900 text-white" 
                          : "text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full shrink-0", 
                          cat.color || 'bg-slate-300'
                        )} />
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {isSelected && <Check size={14} className="text-white shrink-0 ml-2" />}
                    </button>
                  );
                })}

                {filteredCategories.length === 0 && !searchQuery.trim() && (
                  <p className="p-3 text-center text-xs text-slate-400 font-medium">
                    Nenhuma categoria cadastrada.
                  </p>
                )}

                {filteredCategories.length === 0 && searchQuery.trim() && (
                  <p className="p-2 text-center text-[11px] text-slate-400 font-medium">
                    Nenhuma categoria encontrada com esse nome.
                  </p>
                )}
              </div>

              {/* Botão Fixo no Rodapé da Lista: Adicionar Nova Categoria */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStartCreate(searchQuery.trim())}
                  className="w-full text-left px-3 py-2 rounded-xl text-indigo-600 hover:bg-indigo-50 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={14} className="shrink-0" />
                  <span>+ Adicionar nova categoria...</span>
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
