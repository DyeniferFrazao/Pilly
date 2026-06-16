import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Ellipse, Rect, Circle, Path, Text as SvgText, G,
} from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
//  AvatarComponent
//  Props:
//    equipado   — objeto { chapeu, roupa, cabelo, pet, moldura }
//    size       — 'sm' | 'md' | 'lg' (default 'md')
//    showPet    — boolean (default true)
//    showFrame  — boolean (default false; usado no card do ranking)
//    style      — ViewStyle extra
// ─────────────────────────────────────────────────────────────

const SIZES = {
  sm: { w: 56,  h: 64,  scale: 0.47 },
  md: { w: 100, h: 116, scale: 0.83 },
  lg: { w: 120, h: 140, scale: 1.0  },
};

// Mapa de cores por roupa equipada
const ROUPA_CORES = {
  shirt_green:  '#60A2AE',
  jacket_blue:  '#2a6abf',
  coat_white:   '#e8f0f4',
  suit_gold:    '#c8a020',
  cape_special: '#9b30d0',
  default:      '#60A2AE',
};

// Mapa de cores por cabelo equipado
const CABELO_CORES = {
  hair_default: '#5a3a1a',
  hair_curly:   '#8040c0',
  hair_wavy:    '#1a60c0',
  hair_rainbow: '#e03080',
  default:      '#5a3a1a',
};

// Mapa de formas de cabelo: 'liso' | 'cacheado' | 'ondulado'
const CABELO_TIPO = {
  hair_default: 'liso',
  hair_curly:   'cacheado',
  hair_wavy:    'ondulado',
  hair_rainbow: 'liso',
};

// Mapa de emojis de pet
const PET_EMOJIS = {
  pet_seed:   '🌱',
  pet_cat:    '🐱',
  pet_bunny:  '🐰',
  pet_dog:    '🐶',
  pet_dragon: '🐉',
};

// Cores de moldura
const MOLDURA_CORES = {
  frame_default: null,           // sem moldura
  frame_blue:    '#2a6abf',
  frame_purple:  '#6b29a0',
  frame_gold:    '#c8a020',
  frame_diamond: '#20b8d0',
};

const AvatarComponent = ({
  equipado = {},
  size = 'md',
  showPet = true,
  showFrame = false,
  style,
}) => {
  const dim = SIZES[size] ?? SIZES.md;
  const sc  = dim.scale;

  const roupaCor  = ROUPA_CORES[equipado?.roupa]  ?? ROUPA_CORES.default;
  const cabCor    = CABELO_CORES[equipado?.cabelo] ?? CABELO_CORES.default;
  const cabTipo   = CABELO_TIPO[equipado?.cabelo]  ?? 'liso';
  const petEmoji  = PET_EMOJIS[equipado?.pet]      ?? null;
  const moldCor   = showFrame ? (MOLDURA_CORES[equipado?.moldura] ?? null) : null;

  // Base viewBox: 120 × 140
  const vw = 120, vh = 140;

  return (
    <View style={[styles.wrapper, { width: dim.w, height: dim.h }, style]}>
      <Svg width={dim.w} height={dim.h} viewBox={`0 0 ${vw} ${vh}`}>

        {/* ── Moldura (anel SVG — atrás de todo o avatar) ─────── */}
        {moldCor && (
          <Ellipse
            cx="60" cy="76"
            rx="52" ry="63"
            fill="none"
            stroke={moldCor}
            strokeWidth="5"
          />
        )}

        {/* ── Pernas ─────────────────────────────────────────── */}
        <Rect x="46" y="110" width="12" height="22" rx="6" fill="#9dd8e4" />
        <Rect x="62" y="110" width="12" height="22" rx="6" fill="#9dd8e4" />

        {/* ── Sapatos ────────────────────────────────────────── */}
        <Ellipse cx="52" cy="132" rx="9" ry="5" fill="#1D6B78" />
        <Ellipse cx="68" cy="132" rx="9" ry="5" fill="#1D6B78" />

        {/* ── Torso / roupa ──────────────────────────────────── */}
        <Rect x="36" y="75" width="48" height="40" rx="10" fill={roupaCor} />

        {/* ── Braços ─────────────────────────────────────────── */}
        <Rect x="22" y="77" width="16" height="28" rx="8" fill={roupaCor} />
        <Rect x="82" y="77" width="16" height="28" rx="8" fill={roupaCor} />

        {/* ── Mãos ───────────────────────────────────────────── */}
        <Circle cx="30" cy="108" r="7" fill="#f4d0a8" />
        <Circle cx="90" cy="108" r="7" fill="#f4d0a8" />

        {/* ── Pescoço ────────────────────────────────────────── */}
        <Rect x="52" y="65" width="16" height="14" rx="4" fill="#f4d0a8" />

        {/* ── Cabeça ─────────────────────────────────────────── */}
        <Ellipse cx="60" cy="52" rx="26" ry="28" fill="#f4d0a8" />

        {/* ── Ruborização ────────────────────────────────────── */}
        <Ellipse cx="44" cy="60" rx="6" ry="4" fill="#f0a0a0" opacity="0.5" />
        <Ellipse cx="76" cy="60" rx="6" ry="4" fill="#f0a0a0" opacity="0.5" />

        {/* ── Olhos ──────────────────────────────────────────── */}
        <Circle cx="50" cy="50" r="5" fill="white" />
        <Circle cx="70" cy="50" r="5" fill="white" />
        <Circle cx="51" cy="51" r="3" fill="#333" />
        <Circle cx="71" cy="51" r="3" fill="#333" />
        <Circle cx="52" cy="50" r="1" fill="white" />
        <Circle cx="72" cy="50" r="1" fill="white" />

        {/* ── Sorriso ─────────────────────────────────────────── */}
        <Path d="M50 62 Q60 70 70 62" stroke="#c07040" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* ── Cabelo ──────────────────────────────────────────── */}
        {cabTipo === 'liso' && (
          <G>
            <Ellipse cx="60" cy="30" rx="26" ry="14" fill={cabCor} />
            <Rect x="34" y="28" width="12" height="16" rx="4" fill={cabCor} />
            <Rect x="74" y="28" width="12" height="16" rx="4" fill={cabCor} />
          </G>
        )}
        {cabTipo === 'cacheado' && (
          <G>
            <Ellipse cx="60" cy="28" rx="28" ry="16" fill={cabCor} />
            <Circle cx="36" cy="32" r="10" fill={cabCor} />
            <Circle cx="84" cy="32" r="10" fill={cabCor} />
            <Circle cx="46" cy="22" r="9" fill={cabCor} />
            <Circle cx="74" cy="22" r="9" fill={cabCor} />
            <Circle cx="60" cy="18" r="10" fill={cabCor} />
          </G>
        )}
        {cabTipo === 'ondulado' && (
          <G>
            <Ellipse cx="60" cy="29" rx="26" ry="14" fill={cabCor} />
            <Rect x="34" y="27" width="12" height="18" rx="6" fill={cabCor} />
            <Rect x="74" y="27" width="12" height="18" rx="6" fill={cabCor} />
            <Ellipse cx="42" cy="24" rx="8" ry="6" fill={cabCor} />
            <Ellipse cx="60" cy="19" rx="8" ry="6" fill={cabCor} />
            <Ellipse cx="78" cy="24" rx="8" ry="6" fill={cabCor} />
          </G>
        )}

        {/* ── Acessório cabeça (chapéu) ────────────────────────── */}
        {equipado?.chapeu === 'hat_straw' && (
          <G>
            <Ellipse cx="60" cy="18" rx="30" ry="5" fill="#c8a040" />
            <Ellipse cx="60" cy="16" rx="18" ry="9" fill="#d8b050" />
          </G>
        )}
        {equipado?.chapeu === 'hat_glasses' && (
          <G>
            <Circle cx="48" cy="50" r="7" fill="none" stroke="#333" strokeWidth="2.5" />
            <Circle cx="66" cy="50" r="7" fill="none" stroke="#333" strokeWidth="2.5" />
            <Path d="M55 50 L59 50" stroke="#333" strokeWidth="2" />
            <Path d="M41 50 L35 52" stroke="#333" strokeWidth="2" />
          </G>
        )}
        {equipado?.chapeu === 'hat_cowboy' && (
          <G>
            <Ellipse cx="60" cy="20" rx="34" ry="6" fill="#c87820" />
            <Ellipse cx="60" cy="17" rx="20" ry="12" fill="#d88830" />
            <Rect x="42" y="14" width="36" height="6" rx="3" fill="#b06818" />
          </G>
        )}
        {equipado?.chapeu === 'hat_crown' && (
          <G>
            <Rect x="44" y="10" width="32" height="12" rx="2" fill="#f0c820" />
            <Path d="M44 14 L52 8 L60 14 L68 8 L76 14" stroke="#f0c820" strokeWidth="3" fill="none" />
            <Circle cx="52" cy="8" r="3" fill="#e84040" />
            <Circle cx="68" cy="8" r="3" fill="#4080e0" />
            <Circle cx="60" cy="6" r="3" fill="#40c060" />
          </G>
        )}
        {equipado?.chapeu === 'hat_halo' && (
          <Ellipse cx="60" cy="12" rx="22" ry="5" fill="none" stroke="#f8d820" strokeWidth="3" opacity="0.95" />
        )}

        {/* ── Pet (canto inferior direito) ─────────────────────── */}
        {showPet && petEmoji && (
          <SvgText x="98" y="132" fontSize="18" textAnchor="middle">{petEmoji}</SvgText>
        )}

      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AvatarComponent;
