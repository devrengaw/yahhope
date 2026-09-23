import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  GraduationCap, 
  Heart, 
  Utensils, 
  Target, 
  Sparkles, 
  Award, 
  TrendingUp, 
  Baby, 
  Stethoscope, 
  BookOpen,
  Activity,
  Smile
} from 'lucide-react';

export const IMPACT_ICONS_LIST = [
  { id: 'users', label: 'Pessoas / Crianças', icon: Users },
  { id: 'shield-check', label: 'Segurança / Transparência', icon: ShieldCheck },
  { id: 'graduation-cap', label: 'Educação / Diploma', icon: GraduationCap },
  { id: 'heart', label: 'Amor / Apoio', icon: Heart },
  { id: 'utensils', label: 'Nutrição / Alimento', icon: Utensils },
  { id: 'baby', label: 'Infantil / Bebê', icon: Baby },
  { id: 'stethoscope', label: 'Saúde / Clínica', icon: Stethoscope },
  { id: 'book-open', label: 'Livro / Aprendizado', icon: BookOpen },
  { id: 'target', label: 'Alvo / Meta', icon: Target },
  { id: 'award', label: 'Conquista / Prêmio', icon: Award },
  { id: 'trending-up', label: 'Crescimento / Progresso', icon: TrendingUp },
  { id: 'sparkles', label: 'Esperança / Brilho', icon: Sparkles },
  { id: 'activity', label: 'Atividade / Vida', icon: Activity },
  { id: 'smile', label: 'Alegria / Sorriso', icon: Smile },
];

export function ImpactIcon({ name, size = 32, className = '' }: { name: string; size?: number; className?: string }) {
  const found = IMPACT_ICONS_LIST.find(i => i.id === name.toLowerCase());
  const IconComponent = found ? found.icon : Users;
  return <IconComponent size={size} className={className} />;
}
