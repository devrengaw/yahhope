/**
 * WHO Child Growth Standards (Padrões de Crescimento Infantil da OMS)
 * Implementação oficial das diretrizes da OMS e UNICEF para avaliação
 * do estado nutricional e diagnóstico de Desnutrição Aguda (DAG, DAM, Risco, Adequado).
 */

export interface WhoThresholds {
  sd3neg: number; // -3 SD
  sd2neg: number; // -2 SD
  sd1neg: number; // -1 SD
  median: number; // 0 SD
  sd1pos: number; // +1 SD
  sd2pos: number; // +2 SD
  sd3pos: number; // +3 SD
}

// WHO Weight-for-Height / Weight-for-Length (45cm a 120cm)
// Valores em kg para Meninos (M) e Meninas (F)
export const WHO_WFH_BOYS: Record<number, WhoThresholds> = {
  45: { sd3neg: 1.9, sd2neg: 2.0, sd1neg: 2.2, median: 2.4, sd1pos: 2.7, sd2pos: 3.0, sd3pos: 3.3 },
  46: { sd3neg: 2.0, sd2neg: 2.2, sd1neg: 2.4, median: 2.6, sd1pos: 2.9, sd2pos: 3.1, sd3pos: 3.5 },
  47: { sd3neg: 2.1, sd2neg: 2.3, sd1neg: 2.5, median: 2.8, sd1pos: 3.1, sd2pos: 3.3, sd3pos: 3.7 },
  48: { sd3neg: 2.2, sd2neg: 2.4, sd1neg: 2.7, median: 3.0, sd1pos: 3.3, sd2pos: 3.6, sd3pos: 3.9 },
  49: { sd3neg: 2.4, sd2neg: 2.6, sd1neg: 2.9, median: 3.2, sd1pos: 3.5, sd2pos: 3.8, sd3pos: 4.2 },
  50: { sd3neg: 2.5, sd2neg: 2.8, sd1neg: 3.1, median: 3.4, sd1pos: 3.8, sd2pos: 4.1, sd3pos: 4.5 },
  51: { sd3neg: 2.7, sd2neg: 3.0, sd1neg: 3.3, median: 3.6, sd1pos: 4.0, sd2pos: 4.4, sd3pos: 4.8 },
  52: { sd3neg: 2.9, sd2neg: 3.2, sd1neg: 3.5, median: 3.8, sd1pos: 4.2, sd2pos: 4.7, sd3pos: 5.1 },
  53: { sd3neg: 3.0, sd2neg: 3.4, sd1neg: 3.7, median: 4.1, sd1pos: 4.5, sd2pos: 5.0, sd3pos: 5.5 },
  54: { sd3neg: 3.2, sd2neg: 3.6, sd1neg: 4.0, median: 4.3, sd1pos: 4.8, sd2pos: 5.3, sd3pos: 5.8 },
  55: { sd3neg: 3.4, sd2neg: 3.8, sd1neg: 4.2, median: 4.6, sd1pos: 5.1, sd2pos: 5.6, sd3pos: 6.1 },
  56: { sd3neg: 3.6, sd2neg: 4.0, sd1neg: 4.4, median: 4.8, sd1pos: 5.3, sd2pos: 5.9, sd3pos: 6.5 },
  57: { sd3neg: 3.8, sd2neg: 4.2, sd1neg: 4.6, median: 5.1, sd1pos: 5.6, sd2pos: 6.2, sd3pos: 6.8 },
  58: { sd3neg: 4.0, sd2neg: 4.4, sd1neg: 4.9, median: 5.4, sd1pos: 5.9, sd2pos: 6.5, sd3pos: 7.1 },
  59: { sd3neg: 4.2, sd2neg: 4.6, sd1neg: 5.1, median: 5.6, sd1pos: 6.2, sd2pos: 6.8, sd3pos: 7.5 },
  60: { sd3neg: 4.4, sd2neg: 4.8, sd1neg: 5.3, median: 5.8, sd1pos: 6.4, sd2pos: 7.1, sd3pos: 7.8 },
  61: { sd3neg: 4.6, sd2neg: 5.0, sd1neg: 5.5, median: 6.1, sd1pos: 6.7, sd2pos: 7.4, sd3pos: 8.1 },
  62: { sd3neg: 4.8, sd2neg: 5.3, sd1neg: 5.8, median: 6.3, sd1pos: 7.0, sd2pos: 7.7, sd3pos: 8.4 },
  63: { sd3neg: 5.0, sd2neg: 5.5, sd1neg: 6.0, median: 6.6, sd1pos: 7.2, sd2pos: 7.9, sd3pos: 8.7 },
  64: { sd3neg: 5.2, sd2neg: 5.7, sd1neg: 6.2, median: 6.8, sd1pos: 7.5, sd2pos: 8.2, sd3pos: 9.0 },
  65: { sd3neg: 5.4, sd2neg: 5.9, sd1neg: 6.5, median: 7.1, sd1pos: 7.7, sd2pos: 8.5, sd3pos: 9.3 },
  66: { sd3neg: 5.6, sd2neg: 6.1, sd1neg: 6.7, median: 7.3, sd1pos: 8.0, sd2pos: 8.8, sd3pos: 9.6 },
  67: { sd3neg: 5.8, sd2neg: 6.3, sd1neg: 6.9, median: 7.5, sd1pos: 8.2, sd2pos: 9.0, sd3pos: 9.9 },
  68: { sd3neg: 6.0, sd2neg: 6.5, sd1neg: 7.1, median: 7.8, sd1pos: 8.5, sd2pos: 9.3, sd3pos: 10.2 },
  69: { sd3neg: 6.1, sd2neg: 6.7, sd1neg: 7.3, median: 8.0, sd1pos: 8.7, sd2pos: 9.5, sd3pos: 10.4 },
  70: { sd3neg: 6.3, sd2neg: 6.9, sd1neg: 7.5, median: 8.2, sd1pos: 8.9, sd2pos: 9.8, sd3pos: 10.7 },
  71: { sd3neg: 6.5, sd2neg: 7.0, sd1neg: 7.7, median: 8.4, sd1pos: 9.2, sd2pos: 10.0, sd3pos: 11.0 },
  72: { sd3neg: 6.6, sd2neg: 7.2, sd1neg: 7.9, median: 8.6, sd1pos: 9.4, sd2pos: 10.3, sd3pos: 11.2 },
  73: { sd3neg: 6.8, sd2neg: 7.4, sd1neg: 8.1, median: 8.8, sd1pos: 9.6, sd2pos: 10.5, sd3pos: 11.5 },
  74: { sd3neg: 7.0, sd2neg: 7.6, sd1neg: 8.3, median: 9.1, sd1pos: 9.9, sd2pos: 10.7, sd3pos: 11.8 },
  75: { sd3neg: 7.2, sd2neg: 7.8, sd1neg: 8.5, median: 9.3, sd1pos: 10.1, sd2pos: 11.0, sd3pos: 12.0 },
  76: { sd3neg: 7.3, sd2neg: 8.0, sd1neg: 8.7, median: 9.5, sd1pos: 10.3, sd2pos: 11.2, sd3pos: 12.3 },
  77: { sd3neg: 7.5, sd2neg: 8.1, sd1neg: 8.9, median: 9.7, sd1pos: 10.5, sd2pos: 11.5, sd3pos: 12.5 },
  78: { sd3neg: 7.7, sd2neg: 8.3, sd1neg: 9.1, median: 9.9, sd1pos: 10.8, sd2pos: 11.7, sd3pos: 12.8 },
  79: { sd3neg: 7.8, sd2neg: 8.5, sd1neg: 9.3, median: 10.1, sd1pos: 11.0, sd2pos: 11.9, sd3pos: 13.0 },
  80: { sd3neg: 8.0, sd2neg: 8.7, sd1neg: 9.5, median: 10.4, sd1pos: 11.2, sd2pos: 12.2, sd3pos: 13.3 },
  81: { sd3neg: 8.2, sd2neg: 8.9, sd1neg: 9.7, median: 10.6, sd1pos: 11.5, sd2pos: 12.4, sd3pos: 13.5 },
  82: { sd3neg: 8.4, sd2neg: 9.1, sd1neg: 9.9, median: 10.8, sd1pos: 11.7, sd2pos: 12.7, sd3pos: 13.8 },
  83: { sd3neg: 8.6, sd2neg: 9.3, sd1neg: 10.1, median: 11.0, sd1pos: 11.9, sd2pos: 12.9, sd3pos: 14.1 },
  84: { sd3neg: 8.8, sd2neg: 9.5, sd1neg: 10.3, median: 11.2, sd1pos: 12.2, sd2pos: 13.2, sd3pos: 14.3 },
  85: { sd3neg: 9.0, sd2neg: 9.7, sd1neg: 10.5, median: 11.5, sd1pos: 12.4, sd2pos: 13.4, sd3pos: 14.6 },
  86: { sd3neg: 9.2, sd2neg: 9.9, sd1neg: 10.8, median: 11.7, sd1pos: 12.7, sd2pos: 13.7, sd3pos: 14.9 },
  87: { sd3neg: 9.4, sd2neg: 10.1, sd1neg: 11.0, median: 12.0, sd1pos: 12.9, sd2pos: 14.0, sd3pos: 15.2 },
  88: { sd3neg: 9.6, sd2neg: 10.3, sd1neg: 11.2, median: 12.2, sd1pos: 13.2, sd2pos: 14.3, sd3pos: 15.5 },
  89: { sd3neg: 9.8, sd2neg: 10.5, sd1neg: 11.4, median: 12.4, sd1pos: 13.5, sd2pos: 14.6, sd3pos: 15.8 },
  90: { sd3neg: 10.0, sd2neg: 10.8, sd1neg: 11.7, median: 12.7, sd1pos: 13.7, sd2pos: 14.9, sd3pos: 16.2 },
  91: { sd3neg: 10.2, sd2neg: 11.0, sd1neg: 11.9, median: 12.9, sd1pos: 14.0, sd2pos: 15.2, sd3pos: 16.5 },
  92: { sd3neg: 10.4, sd2neg: 11.2, sd1neg: 12.1, median: 13.2, sd1pos: 14.3, sd2pos: 15.5, sd3pos: 16.9 },
  93: { sd3neg: 10.6, sd2neg: 11.4, sd1neg: 12.4, median: 13.4, sd1pos: 14.6, sd2pos: 15.8, sd3pos: 17.2 },
  94: { sd3neg: 10.8, sd2neg: 11.6, sd1neg: 12.6, median: 13.7, sd1pos: 14.9, sd2pos: 16.2, sd3pos: 17.6 },
  95: { sd3neg: 11.0, sd2neg: 11.9, sd1neg: 12.8, median: 13.9, sd1pos: 15.2, sd2pos: 16.5, sd3pos: 18.0 },
  96: { sd3neg: 11.2, sd2neg: 12.1, sd1neg: 13.1, median: 14.2, sd1pos: 15.5, sd2pos: 16.9, sd3pos: 18.4 },
  97: { sd3neg: 11.4, sd2neg: 12.3, sd1neg: 13.3, median: 14.5, sd1pos: 15.8, sd2pos: 17.2, sd3pos: 18.8 },
  98: { sd3neg: 11.6, sd2neg: 12.5, sd1neg: 13.6, median: 14.8, sd1pos: 16.1, sd2pos: 17.6, sd3pos: 19.2 },
  99: { sd3neg: 11.8, sd2neg: 12.8, sd1neg: 13.8, median: 15.0, sd1pos: 16.4, sd2pos: 17.9, sd3pos: 19.6 },
  100: { sd3neg: 12.0, sd2neg: 13.0, sd1neg: 14.1, median: 15.3, sd1pos: 16.7, sd2pos: 18.3, sd3pos: 20.1 },
  101: { sd3neg: 12.3, sd2neg: 13.2, sd1neg: 14.3, median: 15.6, sd1pos: 17.1, sd2pos: 18.7, sd3pos: 20.5 },
  102: { sd3neg: 12.5, sd2neg: 13.5, sd1neg: 14.6, median: 15.9, sd1pos: 17.4, sd2pos: 19.1, sd3pos: 20.9 },
  103: { sd3neg: 12.7, sd2neg: 13.7, sd1neg: 14.9, median: 16.2, sd1pos: 17.7, sd2pos: 19.4, sd3pos: 21.4 },
  104: { sd3neg: 12.9, sd2neg: 14.0, sd1neg: 15.2, median: 16.5, sd1pos: 18.1, sd2pos: 19.8, sd3pos: 21.8 },
  105: { sd3neg: 13.2, sd2neg: 14.2, sd1neg: 15.4, median: 16.8, sd1pos: 18.4, sd2pos: 20.2, sd3pos: 22.3 },
  106: { sd3neg: 13.4, sd2neg: 14.5, sd1neg: 15.7, median: 17.1, sd1pos: 18.8, sd2pos: 20.6, sd3pos: 22.8 },
  107: { sd3neg: 13.7, sd2neg: 14.7, sd1neg: 16.0, median: 17.5, sd1pos: 19.1, sd2pos: 21.0, sd3pos: 23.2 },
  108: { sd3neg: 13.9, sd2neg: 15.0, sd1neg: 16.3, median: 17.8, sd1pos: 19.5, sd2pos: 21.5, sd3pos: 23.7 },
  109: { sd3neg: 14.1, sd2neg: 15.3, sd1neg: 16.6, median: 18.1, sd1pos: 19.9, sd2pos: 21.9, sd3pos: 24.2 },
  110: { sd3neg: 14.4, sd2neg: 15.5, sd1neg: 16.9, median: 18.5, sd1pos: 20.3, sd2pos: 22.3, sd3pos: 24.7 },
  111: { sd3neg: 14.6, sd2neg: 15.8, sd1neg: 17.2, median: 18.8, sd1pos: 20.6, sd2pos: 22.8, sd3pos: 25.2 },
  112: { sd3neg: 14.9, sd2neg: 16.1, sd1neg: 17.5, median: 19.2, sd1pos: 21.0, sd2pos: 23.2, sd3pos: 25.7 },
  113: { sd3neg: 15.2, sd2neg: 16.4, sd1neg: 17.8, median: 19.5, sd1pos: 21.4, sd2pos: 23.7, sd3pos: 26.2 },
  114: { sd3neg: 15.4, sd2neg: 16.6, sd1neg: 18.2, median: 19.9, sd1pos: 21.8, sd2pos: 24.1, sd3pos: 26.8 },
  115: { sd3neg: 15.7, sd2neg: 16.9, sd1neg: 18.5, median: 20.2, sd1pos: 22.2, sd2pos: 24.6, sd3pos: 27.3 },
  116: { sd3neg: 16.0, sd2neg: 17.2, sd1neg: 18.8, median: 20.6, sd1pos: 22.6, sd2pos: 25.1, sd3pos: 27.8 },
  117: { sd3neg: 16.2, sd2neg: 17.5, sd1neg: 19.2, median: 21.0, sd1pos: 23.1, sd2pos: 25.5, sd3pos: 28.4 },
  118: { sd3neg: 16.5, sd2neg: 17.8, sd1neg: 19.5, median: 21.4, sd1pos: 23.5, sd2pos: 26.0, sd3pos: 28.9 },
  119: { sd3neg: 16.8, sd2neg: 18.1, sd1neg: 19.9, median: 21.7, sd1pos: 23.9, sd2pos: 26.5, sd3pos: 29.5 },
  120: { sd3neg: 17.1, sd2neg: 18.4, sd1neg: 20.2, median: 22.1, sd1pos: 24.3, sd2pos: 27.0, sd3pos: 30.1 }
};

export const WHO_WFH_GIRLS: Record<number, WhoThresholds> = {
  45: { sd3neg: 1.8, sd2neg: 2.0, sd1neg: 2.1, median: 2.3, sd1pos: 2.6, sd2pos: 2.8, sd3pos: 3.1 },
  46: { sd3neg: 1.9, sd2neg: 2.1, sd1neg: 2.3, median: 2.5, sd1pos: 2.7, sd2pos: 3.0, sd3pos: 3.3 },
  47: { sd3neg: 2.0, sd2neg: 2.2, sd1neg: 2.4, median: 2.7, sd1pos: 2.9, sd2pos: 3.2, sd3pos: 3.5 },
  48: { sd3neg: 2.1, sd2neg: 2.4, sd1neg: 2.6, median: 2.8, sd1pos: 3.1, sd2pos: 3.4, sd3pos: 3.8 },
  49: { sd3neg: 2.3, sd2neg: 2.5, sd1neg: 2.8, median: 3.0, sd1pos: 3.3, sd2pos: 3.7, sd3pos: 4.0 },
  50: { sd3neg: 2.4, sd2neg: 2.7, sd1neg: 3.0, median: 3.2, sd1pos: 3.6, sd2pos: 3.9, sd3pos: 4.3 },
  51: { sd3neg: 2.6, sd2neg: 2.8, sd1neg: 3.1, median: 3.4, sd1pos: 3.8, sd2pos: 4.2, sd3pos: 4.6 },
  52: { sd3neg: 2.7, sd2neg: 3.0, sd1neg: 3.3, median: 3.7, sd1pos: 4.0, sd2pos: 4.5, sd3pos: 4.9 },
  53: { sd3neg: 2.9, sd2neg: 3.2, sd1neg: 3.5, median: 3.9, sd1pos: 4.3, sd2pos: 4.7, sd3pos: 5.2 },
  54: { sd3neg: 3.0, sd2neg: 3.4, sd1neg: 3.7, median: 4.1, sd1pos: 4.5, sd2pos: 5.0, sd3pos: 5.5 },
  55: { sd3neg: 3.2, sd2neg: 3.6, sd1neg: 4.0, median: 4.4, sd1pos: 4.8, sd2pos: 5.3, sd3pos: 5.9 },
  56: { sd3neg: 3.4, sd2neg: 3.8, sd1neg: 4.2, median: 4.6, sd1pos: 5.1, sd2pos: 5.6, sd3pos: 6.2 },
  57: { sd3neg: 3.6, sd2neg: 4.0, sd1neg: 4.4, median: 4.8, sd1pos: 5.3, sd2pos: 5.9, sd3pos: 6.5 },
  58: { sd3neg: 3.8, sd2neg: 4.2, sd1neg: 4.6, median: 5.1, sd1pos: 5.6, sd2pos: 6.2, sd3pos: 6.8 },
  59: { sd3neg: 4.0, sd2neg: 4.4, sd1neg: 4.8, median: 5.3, sd1pos: 5.9, sd2pos: 6.5, sd3pos: 7.1 },
  60: { sd3neg: 4.1, sd2neg: 4.5, sd1neg: 5.0, median: 5.5, sd1pos: 6.1, sd2pos: 6.7, sd3pos: 7.4 },
  61: { sd3neg: 4.3, sd2neg: 4.7, sd1neg: 5.2, median: 5.7, sd1pos: 6.3, sd2pos: 7.0, sd3pos: 7.7 },
  62: { sd3neg: 4.5, sd2neg: 4.9, sd1neg: 5.4, median: 6.0, sd1pos: 6.6, sd2pos: 7.2, sd3pos: 8.0 },
  63: { sd3neg: 4.7, sd2neg: 5.1, sd1neg: 5.6, median: 6.2, sd1pos: 6.8, sd2pos: 7.5, sd3pos: 8.3 },
  64: { sd3neg: 4.8, sd2neg: 5.3, sd1neg: 5.8, median: 6.4, sd1pos: 7.0, sd2pos: 7.7, sd3pos: 8.5 },
  65: { sd3neg: 5.0, sd2neg: 5.5, sd1neg: 6.0, median: 6.6, sd1pos: 7.3, sd2pos: 8.0, sd3pos: 8.8 },
  66: { sd3neg: 5.2, sd2neg: 5.7, sd1neg: 6.2, median: 6.8, sd1pos: 7.5, sd2pos: 8.2, sd3pos: 9.1 },
  67: { sd3neg: 5.4, sd2neg: 5.8, sd1neg: 6.4, median: 7.0, sd1pos: 7.7, sd2pos: 8.5, sd3pos: 9.3 },
  68: { sd3neg: 5.5, sd2neg: 6.0, sd1neg: 6.6, median: 7.2, sd1pos: 7.9, sd2pos: 8.7, sd3pos: 9.6 },
  69: { sd3neg: 5.7, sd2neg: 6.2, sd1neg: 6.8, median: 7.4, sd1pos: 8.1, sd2pos: 8.9, sd3pos: 9.8 },
  70: { sd3neg: 5.9, sd2neg: 6.4, sd1neg: 7.0, median: 7.7, sd1pos: 8.4, sd2pos: 9.2, sd3pos: 10.1 },
  71: { sd3neg: 6.0, sd2neg: 6.6, sd1neg: 7.2, median: 7.9, sd1pos: 8.6, sd2pos: 9.4, sd3pos: 10.3 },
  72: { sd3neg: 6.2, sd2neg: 6.8, sd1neg: 7.4, median: 8.1, sd1pos: 8.8, sd2pos: 9.6, sd3pos: 10.6 },
  73: { sd3neg: 6.4, sd2neg: 6.9, sd1neg: 7.6, median: 8.3, sd1pos: 9.0, sd2pos: 9.9, sd3pos: 10.8 },
  74: { sd3neg: 6.5, sd2neg: 7.1, sd1neg: 7.8, median: 8.5, sd1pos: 9.3, sd2pos: 10.1, sd3pos: 11.1 },
  75: { sd3neg: 6.7, sd2neg: 7.3, sd1neg: 8.0, median: 8.7, sd1pos: 9.5, sd2pos: 10.4, sd3pos: 11.3 },
  76: { sd3neg: 6.9, sd2neg: 7.5, sd1neg: 8.2, median: 8.9, sd1pos: 9.7, sd2pos: 10.6, sd3pos: 11.6 },
  77: { sd3neg: 7.0, sd2neg: 7.6, sd1neg: 8.4, median: 9.1, sd1pos: 10.0, sd2pos: 10.9, sd3pos: 11.8 },
  78: { sd3neg: 7.2, sd2neg: 7.8, sd1neg: 8.6, median: 9.4, sd1pos: 10.2, sd2pos: 11.1, sd3pos: 12.1 },
  79: { sd3neg: 7.4, sd2neg: 8.0, sd1neg: 8.8, median: 9.6, sd1pos: 10.4, sd2pos: 11.4, sd3pos: 12.4 },
  80: { sd3neg: 7.5, sd2neg: 8.2, sd1neg: 9.0, median: 9.8, sd1pos: 10.7, sd2pos: 11.6, sd3pos: 12.6 },
  81: { sd3neg: 7.7, sd2neg: 8.4, sd1neg: 9.2, median: 10.0, sd1pos: 10.9, sd2pos: 11.9, sd3pos: 12.9 },
  82: { sd3neg: 7.9, sd2neg: 8.6, sd1neg: 9.4, median: 10.3, sd1pos: 11.2, sd2pos: 12.1, sd3pos: 13.2 },
  83: { sd3neg: 8.1, sd2neg: 8.8, sd1neg: 9.6, median: 10.5, sd1pos: 11.4, sd2pos: 12.4, sd3pos: 13.5 },
  84: { sd3neg: 8.3, sd2neg: 9.0, sd1neg: 9.8, median: 10.7, sd1pos: 11.7, sd2pos: 12.7, sd3pos: 13.7 },
  85: { sd3neg: 8.5, sd2neg: 9.2, sd1neg: 10.1, median: 11.0, sd1pos: 11.9, sd2pos: 13.0, sd3pos: 14.0 },
  86: { sd3neg: 8.7, sd2neg: 9.4, sd1neg: 10.3, median: 11.2, sd1pos: 12.2, sd2pos: 13.2, sd3pos: 14.3 },
  87: { sd3neg: 8.9, sd2neg: 9.6, sd1neg: 10.5, median: 11.5, sd1pos: 12.5, sd2pos: 13.5, sd3pos: 14.7 },
  88: { sd3neg: 9.1, sd2neg: 9.8, sd1neg: 10.7, median: 11.7, sd1pos: 12.7, sd2pos: 13.8, sd3pos: 15.0 },
  89: { sd3neg: 9.3, sd2neg: 10.0, sd1neg: 11.0, median: 12.0, sd1pos: 13.0, sd2pos: 14.1, sd3pos: 15.3 },
  90: { sd3neg: 9.5, sd2neg: 10.3, sd1neg: 11.2, median: 12.2, sd1pos: 13.3, sd2pos: 14.4, sd3pos: 15.6 },
  91: { sd3neg: 9.7, sd2neg: 10.5, sd1neg: 11.4, median: 12.5, sd1pos: 13.6, sd2pos: 14.7, sd3pos: 16.0 },
  92: { sd3neg: 9.9, sd2neg: 10.7, sd1neg: 11.7, median: 12.7, sd1pos: 13.8, sd2pos: 15.0, sd3pos: 16.3 },
  93: { sd3neg: 10.1, sd2neg: 10.9, sd1neg: 11.9, median: 13.0, sd1pos: 14.1, sd2pos: 15.3, sd3pos: 16.6 },
  94: { sd3neg: 10.3, sd2neg: 11.1, sd1neg: 12.1, median: 13.2, sd1pos: 14.4, sd2pos: 15.6, sd3pos: 17.0 },
  95: { sd3neg: 10.5, sd2neg: 11.3, sd1neg: 12.4, median: 13.5, sd1pos: 14.7, sd2pos: 15.9, sd3pos: 17.3 },
  96: { sd3neg: 10.7, sd2neg: 11.6, sd1neg: 12.6, median: 13.8, sd1pos: 15.0, sd2pos: 16.3, sd3pos: 17.7 },
  97: { sd3neg: 10.9, sd2neg: 11.8, sd1neg: 12.9, median: 14.0, sd1pos: 15.3, sd2pos: 16.6, sd3pos: 18.0 },
  98: { sd3neg: 11.1, sd2neg: 12.0, sd1neg: 13.1, median: 14.3, sd1pos: 15.6, sd2pos: 17.0, sd3pos: 18.4 },
  99: { sd3neg: 11.3, sd2neg: 12.2, sd1neg: 13.4, median: 14.6, sd1pos: 15.9, sd2pos: 17.3, sd3pos: 18.8 },
  100: { sd3neg: 11.5, sd2neg: 12.5, sd1neg: 13.6, median: 14.8, sd1pos: 16.2, sd2pos: 17.6, sd3pos: 19.2 },
  101: { sd3neg: 11.7, sd2neg: 12.7, sd1neg: 13.9, median: 15.1, sd1pos: 16.5, sd2pos: 18.0, sd3pos: 19.6 },
  102: { sd3neg: 11.9, sd2neg: 12.9, sd1neg: 14.1, median: 15.4, sd1pos: 16.8, sd2pos: 18.3, sd3pos: 20.0 },
  103: { sd3neg: 12.1, sd2neg: 13.2, sd1neg: 14.4, median: 15.7, sd1pos: 17.1, sd2pos: 18.7, sd3pos: 20.4 },
  104: { sd3neg: 12.4, sd2neg: 13.4, sd1neg: 14.6, median: 16.0, sd1pos: 17.4, sd2pos: 19.0, sd3pos: 20.8 },
  105: { sd3neg: 12.6, sd2neg: 13.6, sd1neg: 14.9, median: 16.3, sd1pos: 17.7, sd2pos: 19.4, sd3pos: 21.2 },
  106: { sd3neg: 12.8, sd2neg: 13.9, sd1neg: 15.2, median: 16.6, sd1pos: 18.1, sd2pos: 19.8, sd3pos: 21.6 },
  107: { sd3neg: 13.0, sd2neg: 14.1, sd1neg: 15.4, median: 16.9, sd1pos: 18.4, sd2pos: 20.2, sd3pos: 22.0 },
  108: { sd3neg: 13.3, sd2neg: 14.4, sd1neg: 15.7, median: 17.2, sd1pos: 18.7, sd2pos: 20.5, sd3pos: 22.5 },
  109: { sd3neg: 13.5, sd2neg: 14.6, sd1neg: 16.0, median: 17.5, sd1pos: 19.1, sd2pos: 20.9, sd3pos: 22.9 },
  110: { sd3neg: 13.7, sd2neg: 14.9, sd1neg: 16.3, median: 17.8, sd1pos: 19.4, sd2pos: 21.3, sd3pos: 23.3 },
  111: { sd3neg: 14.0, sd2neg: 15.1, sd1neg: 16.5, median: 18.1, sd1pos: 19.8, sd2pos: 21.7, sd3pos: 23.8 },
  112: { sd3neg: 14.2, sd2neg: 15.4, sd1neg: 16.8, median: 18.4, sd1pos: 20.1, sd2pos: 22.1, sd3pos: 24.2 },
  113: { sd3neg: 14.5, sd2neg: 15.6, sd1neg: 17.1, median: 18.8, sd1pos: 20.5, sd2pos: 22.5, sd3pos: 24.7 },
  114: { sd3neg: 14.7, sd2neg: 15.9, sd1neg: 17.4, median: 19.1, sd1pos: 20.8, sd2pos: 22.9, sd3pos: 25.1 },
  115: { sd3neg: 15.0, sd2neg: 16.2, sd1neg: 17.7, median: 19.4, sd1pos: 21.2, sd2pos: 23.3, sd3pos: 25.6 },
  116: { sd3neg: 15.2, sd2neg: 16.4, sd1neg: 18.0, median: 19.7, sd1pos: 21.6, sd2pos: 23.8, sd3pos: 26.0 },
  117: { sd3neg: 15.5, sd2neg: 16.7, sd1neg: 18.3, median: 20.1, sd1pos: 22.0, sd2pos: 24.2, sd3pos: 26.5 },
  118: { sd3neg: 15.7, sd2neg: 17.0, sd1neg: 18.6, median: 20.4, sd1pos: 22.4, sd2pos: 24.6, sd3pos: 27.0 },
  119: { sd3neg: 16.0, sd2neg: 17.3, sd1neg: 18.9, median: 20.7, sd1pos: 22.7, sd2pos: 25.0, sd3pos: 27.5 },
  120: { sd3neg: 16.3, sd2neg: 17.5, sd1neg: 19.2, median: 21.1, sd1pos: 23.1, sd2pos: 25.5, sd3pos: 28.0 }
};

/**
 * Interpola linearmente os limiares da OMS para uma altura contínua (ex: 74.3 cm).
 */
export function getWhoWfhThresholds(height: number, gender: 'M' | 'F'): WhoThresholds {
  const table = gender === 'F' ? WHO_WFH_GIRLS : WHO_WFH_BOYS;
  const clampedHeight = Math.max(45, Math.min(120, height));
  const floorH = Math.floor(clampedHeight);
  const ceilH = Math.min(120, floorH + 1);
  const fraction = clampedHeight - floorH;

  const low = table[floorH] || table[45];
  const high = table[ceilH] || table[120];

  return {
    sd3neg: low.sd3neg + fraction * (high.sd3neg - low.sd3neg),
    sd2neg: low.sd2neg + fraction * (high.sd2neg - low.sd2neg),
    sd1neg: low.sd1neg + fraction * (high.sd1neg - low.sd1neg),
    median: low.median + fraction * (high.median - low.median),
    sd1pos: low.sd1pos + fraction * (high.sd1pos - low.sd1pos),
    sd2pos: low.sd2pos + fraction * (high.sd2pos - low.sd2pos),
    sd3pos: low.sd3pos + fraction * (high.sd3pos - low.sd3pos),
  };
}

/**
 * Calcula o Escore Z exato de Peso para Estatura (WFH Z-Score)
 * utilizando interpolação linear piecewise entre os desvios padrão oficiais da OMS.
 */
export function calculateWeightForHeightZScore(weight: number, height: number, gender: 'M' | 'F'): number | null {
  if (!weight || !height || height < 45 || height > 120 || weight <= 0) {
    return null;
  }

  const t = getWhoWfhThresholds(height, gender);

  let z: number;
  if (weight <= t.sd3neg) {
    // Abaixo de -3 SD
    const sdStep = Math.max(0.1, t.sd2neg - t.sd3neg);
    z = -3 - (t.sd3neg - weight) / sdStep;
  } else if (weight <= t.sd2neg) {
    // Entre -3 SD e -2 SD
    const span = Math.max(0.1, t.sd2neg - t.sd3neg);
    z = -3 + ((weight - t.sd3neg) / span);
  } else if (weight <= t.sd1neg) {
    // Entre -2 SD e -1 SD
    const span = Math.max(0.1, t.sd1neg - t.sd2neg);
    z = -2 + ((weight - t.sd2neg) / span);
  } else if (weight <= t.median) {
    // Entre -1 SD e Mediana (0)
    const span = Math.max(0.1, t.median - t.sd1neg);
    z = -1 + ((weight - t.sd1neg) / span);
  } else if (weight <= t.sd1pos) {
    // Entre Mediana e +1 SD
    const span = Math.max(0.1, t.sd1pos - t.median);
    z = (weight - t.median) / span;
  } else if (weight <= t.sd2pos) {
    // Entre +1 SD e +2 SD
    const span = Math.max(0.1, t.sd2pos - t.sd1pos);
    z = 1 + ((weight - t.sd1pos) / span);
  } else {
    // Acima de +2 SD
    const sdStep = Math.max(0.1, t.sd3pos - t.sd2pos);
    z = 2 + ((weight - t.sd2pos) / sdStep);
  }

  return parseFloat(z.toFixed(2));
}

/**
 * Estatura para Idade (Height-for-Age) da OMS (0 a 60 meses)
 * Retorna Escore Z aproximado de Estatura para Idade.
 */
export function calculateHeightForAgeZScore(height: number, ageInMonths: number, gender: 'M' | 'F'): number | null {
  if (!height || ageInMonths === undefined || ageInMonths === null || ageInMonths < 0 || ageInMonths > 60) {
    return null;
  }

  const base = gender === 'M' ? 50.0 : 49.1;
  // Mediana da OMS aproximada por curva de crescimento padrão
  let median = base;
  if (ageInMonths <= 3) median = base + ageInMonths * 3.4;
  else if (ageInMonths <= 12) median = 60.5 + (ageInMonths - 3) * 1.5;
  else if (ageInMonths <= 24) median = 74.5 + (ageInMonths - 12) * 1.0;
  else if (ageInMonths <= 36) median = 86.5 + (ageInMonths - 24) * 0.8;
  else if (ageInMonths <= 48) median = 96.0 + (ageInMonths - 36) * 0.7;
  else median = 104.5 + (ageInMonths - 48) * 0.55;

  const sd = 2.4 + ageInMonths * 0.035;
  const z = (height - median) / sd;
  return parseFloat(z.toFixed(2));
}

/**
 * Peso para Idade (Weight-for-Age) da OMS (0 a 60 meses)
 * Retorna Escore Z aproximado de Peso para Idade.
 */
export function calculateWeightForAgeZScore(weight: number, ageInMonths: number, gender: 'M' | 'F'): number | null {
  if (!weight || ageInMonths === undefined || ageInMonths === null || ageInMonths < 0 || ageInMonths > 60) {
    return null;
  }

  const base = gender === 'M' ? 3.3 : 3.2;
  let median = base;
  if (ageInMonths <= 3) median = base + ageInMonths * 0.9;
  else if (ageInMonths <= 12) median = 6.0 + (ageInMonths - 3) * 0.33;
  else if (ageInMonths <= 24) median = 9.0 + (ageInMonths - 12) * 0.23;
  else if (ageInMonths <= 36) median = 11.8 + (ageInMonths - 24) * 0.16;
  else if (ageInMonths <= 48) median = 13.8 + (ageInMonths - 36) * 0.15;
  else median = 15.6 + (ageInMonths - 48) * 0.15;

  const sd = 0.5 + ageInMonths * 0.03;
  const z = (weight - median) / sd;
  return parseFloat(z.toFixed(2));
}

export interface NutritionalAssessmentResult {
  zScore: number | null; // WFH Z-Score
  status: 'Adequado' | 'Risco' | 'DAM' | 'DAG' | 'N/A';
  stuntingStatus: 'Adequada' | 'Baixa estatura' | 'Muito baixa estatura' | 'N/A';
  underweightStatus: 'Adequado' | 'Baixo peso' | 'Muito baixo peso' | 'N/A';
  hfaZScore: number | null;
  wfaZScore: number | null;
  criteriaExplanation: string[];
}

/**
 * Avaliação Completa do Estado Nutricional segundo critérios estritos da OMS / UNICEF.
 *
 * CRITÉRIOS DE DESNUTRIÇÃO AGUDA:
 * - DAG (Desnutrição Aguda Grave):
 *    1. Presença de Edema Bilateral Nutricional (Kwashiorkor); OU
 *    2. Escore Z Peso/Estatura (WFH) < -3 DP; OU
 *    3. PB / MUAC < 11.5 cm (115 mm) em crianças de 6 a 59 meses.
 *
 * - DAM (Desnutrição Aguda Moderada):
 *    1. Escore Z Peso/Estatura (WFH) entre -3 DP e < -2 DP; OU
 *    2. PB / MUAC entre 11.5 cm e < 12.5 cm (115 a 124 mm).
 *
 * - Risco Nutricional:
 *    1. Escore Z Peso/Estatura (WFH) entre -2 DP e < -1 DP; OU
 *    2. PB / MUAC entre 12.5 cm e < 13.5 cm.
 *
 * - Adequado:
 *    Escore Z Peso/Estatura (WFH) >= -1 DP e sem critérios de risco/desnutrição aguda.
 *
 * NOTA MÉDICA VITAL:
 * Stunting (Baixa estatura por idade) é desnutrição CRÔNICA.
 * Underweight (Baixo peso por idade) é deficit ponderal global.
 * NUNCA devem transformar a classificação aguda em DAG!
 */
export function evaluateNutritionalStatus(params: {
  weight?: number | null;
  height?: number | null;
  gender: 'M' | 'F';
  ageInMonths?: number | null;
  muac?: number | null; // pode vir em cm (ex: 11.2) ou mm (ex: 112)
  hasBilateralEdema?: boolean | string | null;
}): NutritionalAssessmentResult {
  const { weight, height, gender, ageInMonths, muac, hasBilateralEdema } = params;

  const criteriaExplanation: string[] = [];

  // Normalização do MUAC para cm
  let muacCm: number | null = null;
  if (muac !== undefined && muac !== null && !isNaN(muac) && muac > 0) {
    muacCm = muac > 40 ? muac / 10 : muac; // Se for digitado em mm (ex: 115), converte para 11.5 cm
  }

  // Normalização do Edema bilateral
  const hasEdema = Boolean(
    hasBilateralEdema === true ||
    (typeof hasBilateralEdema === 'string' &&
      (hasBilateralEdema.toLowerCase().includes('sim') ||
       hasBilateralEdema.toLowerCase().includes('presente') ||
       hasBilateralEdema.includes('+')))
  );

  // 1. Cálculo do Escore Z Peso para Estatura (WFH)
  const wfhZ = (weight && height) ? calculateWeightForHeightZScore(weight, height, gender) : null;

  // 2. Cálculo dos índices complementares (Crônicos / Globais)
  const hfaZ = (height && ageInMonths !== undefined && ageInMonths !== null)
    ? calculateHeightForAgeZScore(height, ageInMonths, gender)
    : null;

  const wfaZ = (weight && ageInMonths !== undefined && ageInMonths !== null)
    ? calculateWeightForAgeZScore(weight, ageInMonths, gender)
    : null;

  let stuntingStatus: NutritionalAssessmentResult['stuntingStatus'] = 'N/A';
  if (hfaZ !== null) {
    if (hfaZ < -3) stuntingStatus = 'Muito baixa estatura';
    else if (hfaZ < -2) stuntingStatus = 'Baixa estatura';
    else stuntingStatus = 'Adequada';
  }

  let underweightStatus: NutritionalAssessmentResult['underweightStatus'] = 'N/A';
  if (wfaZ !== null) {
    if (wfaZ < -3) underweightStatus = 'Muito baixo peso';
    else if (wfaZ < -2) underweightStatus = 'Baixo peso';
    else underweightStatus = 'Adequado';
  }

  // Se não temos dados suficientes para avaliar desnutrição aguda
  if (!hasEdema && wfhZ === null && muacCm === null) {
    return {
      zScore: null,
      status: 'N/A',
      stuntingStatus,
      underweightStatus,
      hfaZScore: hfaZ,
      wfaZScore: wfaZ,
      criteriaExplanation: ['Dados insuficientes para avaliação nutricional']
    };
  }

  // 3. Determinação do Status de Desnutrição Aguda (OMS)
  let status: 'Adequado' | 'Risco' | 'DAM' | 'DAG' = 'Adequado';

  // --- REGRA 1: DAG (Desnutrição Aguda Grave) ---
  if (hasEdema) {
    status = 'DAG';
    criteriaExplanation.push('Edema bilateral presente (Sinal de Kwashiorkor)');
  }

  if (wfhZ !== null && wfhZ < -3) {
    status = 'DAG';
    criteriaExplanation.push(`Peso/Estatura Z-Score (${wfhZ}) < -3 DP`);
  }

  // MUAC < 11.5 cm em crianças de 6 a 59 meses
  if (muacCm !== null && muacCm < 11.5) {
    status = 'DAG';
    criteriaExplanation.push(`Perímetro Braquial (${muacCm.toFixed(1)} cm) < 11.5 cm`);
  }

  // --- REGRA 2: DAM (Desnutrição Aguda Moderada) se não for DAG ---
  if (status !== 'DAG') {
    let isDam = false;

    if (wfhZ !== null && wfhZ >= -3 && wfhZ < -2) {
      isDam = true;
      criteriaExplanation.push(`Peso/Estatura Z-Score (${wfhZ}) entre -3 e -2 DP`);
    }

    if (muacCm !== null && muacCm >= 11.5 && muacCm < 12.5) {
      isDam = true;
      criteriaExplanation.push(`Perímetro Braquial (${muacCm.toFixed(1)} cm) entre 11.5 e 12.4 cm`);
    }

    if (isDam) {
      status = 'DAM';
    }
  }

  // --- REGRA 3: Risco Nutricional se não for DAG nem DAM ---
  if (status !== 'DAG' && status !== 'DAM') {
    let isRisk = false;

    if (wfhZ !== null && wfhZ >= -2 && wfhZ < -1) {
      isRisk = true;
      criteriaExplanation.push(`Peso/Estatura Z-Score (${wfhZ}) entre -2 e -1 DP`);
    }

    if (muacCm !== null && muacCm >= 12.5 && muacCm < 13.5) {
      isRisk = true;
      criteriaExplanation.push(`Perímetro Braquial (${muacCm.toFixed(1)} cm) em zona de alerta`);
    }

    if (isRisk) {
      status = 'Risco';
    }
  }

  if (status === 'Adequado' && criteriaExplanation.length === 0) {
    criteriaExplanation.push('Parâmetros antropométricos adequados segundo a OMS');
  }

  return {
    zScore: wfhZ,
    status,
    stuntingStatus,
    underweightStatus,
    hfaZScore: hfaZ,
    wfaZScore: wfaZ,
    criteriaExplanation
  };
}
