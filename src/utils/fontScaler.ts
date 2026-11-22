/* eslint-disable @typescript-eslint/no-require-imports */
import React from 'react';
import * as ReactNative from 'react-native';
import { StyleSheet, Platform } from 'react-native';

let currentFontMultiplier = 1.0;

export function setGlobalFontMultiplier(multiplier: number) {
  currentFontMultiplier = multiplier;
}

export function getGlobalFontMultiplier(): number {
  return currentFontMultiplier;
}

/**
 * Inicializa a interceptação de Text e TextInput no Mobile (iOS e Android).
 * Garante que opções de acessibilidade (Normal, Grande, Extra Grande)
 * escalem dinamicamente e de forma limpa em todos os componentes nativos.
 */
export function initializeMobileFontScaling() {
  if (Platform.OS === 'web') return;

  try {
    // 1. Patch em Libraries/Text/Text
    const TextModule = require('react-native/Libraries/Text/Text');
    if (TextModule && TextModule.default && !(TextModule.default as any).__isEstudemyPatched) {
      const OriginalText = TextModule.default;
      const PatchedText = React.forwardRef<any, any>(function PatchedTextComponent(props, ref) {
        if (currentFontMultiplier === 1.0 || !props) {
          return React.createElement(OriginalText, { ...props, ref });
        }
        const flatStyle = StyleSheet.flatten(props.style) || {};
        const baseSize = flatStyle.fontSize || 14;
        const newSize = Math.round(baseSize * currentFontMultiplier);
        const newLineHeight = flatStyle.lineHeight
          ? Math.round(flatStyle.lineHeight * currentFontMultiplier)
          : undefined;

        const mergedStyle = [
          props.style,
          {
            fontSize: newSize,
            ...(newLineHeight ? { lineHeight: newLineHeight } : {}),
          },
        ];

        return React.createElement(OriginalText, {
          ...props,
          style: mergedStyle,
          ref,
        });
      });
      (PatchedText as any).__isEstudemyPatched = true;
      PatchedText.displayName = 'Text';
      TextModule.default = PatchedText;
    }
  } catch {
    // Fallback silencioso
  }

  try {
    // 2. Patch em Libraries/Components/TextInput/TextInput
    const TextInputModule = require('react-native/Libraries/Components/TextInput/TextInput');
    if (TextInputModule && TextInputModule.default && !(TextInputModule.default as any).__isEstudemyPatched) {
      const OriginalTextInput = TextInputModule.default;
      const PatchedTextInput = React.forwardRef<any, any>(function PatchedTextInputComponent(props, ref) {
        if (currentFontMultiplier === 1.0 || !props) {
          return React.createElement(OriginalTextInput, { ...props, ref });
        }
        const flatStyle = StyleSheet.flatten(props.style) || {};
        const baseSize = flatStyle.fontSize || 14;
        const newSize = Math.round(baseSize * currentFontMultiplier);
        const newLineHeight = flatStyle.lineHeight
          ? Math.round(flatStyle.lineHeight * currentFontMultiplier)
          : undefined;

        const mergedStyle = [
          props.style,
          {
            fontSize: newSize,
            ...(newLineHeight ? { lineHeight: newLineHeight } : {}),
          },
        ];

        return React.createElement(OriginalTextInput, {
          ...props,
          style: mergedStyle,
          ref,
        });
      });
      (PatchedTextInput as any).__isEstudemyPatched = true;
      PatchedTextInput.displayName = 'TextInput';
      TextInputModule.default = PatchedTextInput;
    }
  } catch {
    // Fallback silencioso
  }

  try {
    // 3. Fallback para forwardRef .render se presente
    const RNText = (ReactNative as any).Text;
    if (RNText && typeof RNText.render === 'function' && !RNText.render.__isEstudemyPatched) {
      const origRender = RNText.render;
      const patchedRender = function (props: any, ref: any) {
        if (currentFontMultiplier === 1.0 || !props) {
          return origRender(props, ref);
        }
        const flatStyle = StyleSheet.flatten(props.style) || {};
        const baseSize = flatStyle.fontSize || 14;
        const newSize = Math.round(baseSize * currentFontMultiplier);
        const newLineHeight = flatStyle.lineHeight
          ? Math.round(flatStyle.lineHeight * currentFontMultiplier)
          : undefined;

        return origRender(
          {
            ...props,
            style: [
              props.style,
              {
                fontSize: newSize,
                ...(newLineHeight ? { lineHeight: newLineHeight } : {}),
              },
            ],
          },
          ref
        );
      };
      patchedRender.__isEstudemyPatched = true;
      RNText.render = patchedRender;
    }
  } catch {
    // Fallback silencioso
  }
}

// Inicializa na importação
initializeMobileFontScaling();
