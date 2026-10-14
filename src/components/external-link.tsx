import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Alert, Platform } from 'react-native';
import { isSafeUrl } from '../utils/security';
import logger from '../utils/logger';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * Componente de link externo protegido contra Phishing e Open Redirect (RC05)
 */
export function ExternalLink({ href, ...rest }: Props) {
  const handleOpen = async (event: any) => {
    const urlStr = String(href);

    // Validação antiphishing (RC05)
    if (!isSafeUrl(urlStr)) {
      event.preventDefault();
      logger.warn(`Tentativa de acesso a URL externa não verificada: ${urlStr}`);

      const proceed = () => {
        if (Platform.OS === 'web') {
          window.open(urlStr, '_blank', 'noopener,noreferrer');
        } else {
          openBrowserAsync(urlStr, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      };

      if (Platform.OS === 'web') {
        const confirmResult = window.confirm(
          `AVISO DE SEGURANÇA:\n\nVocê está prestes a sair do ambiente seguro do EstudeMy para:\n${urlStr}\n\nDeseja continuar com cautela?`
        );
        if (confirmResult) proceed();
      } else {
        Alert.alert(
          'Aviso de Segurança (Anti-Phishing)',
          `Você está sendo redirecionado para um site externo:\n\n${urlStr}\n\nCertifique-se de nunca inserir suas senhas em sites de terceiros.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Acessar com Segurança', onPress: proceed },
          ]
        );
      }
      return;
    }

    if (process.env.EXPO_OS !== 'web') {
      event.preventDefault();
      await openBrowserAsync(urlStr, {
        presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
      });
    }
  };

  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
      href={href}
      onPress={handleOpen}
    />
  );
}
