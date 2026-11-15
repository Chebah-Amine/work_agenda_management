import { ComponentRef, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, View } from "react-native";

/**
 * Hauteur de l'écran que le clavier recouvre, mesurée sur la vue `ref`.
 *
 * Avec l'affichage bord à bord d'Android, le clavier peut passer par-dessus le bas de
 * l'écran (barre « Enregistrer »…) au lieu de le pousser. On mesure le recouvrement réel
 * plutôt que de supposer le comportement du téléphone : 0 si l'écran s'est déjà ajusté.
 * À appliquer en `paddingBottom` sur cette même vue (le padding ne change pas sa mesure).
 */
export function useKeyboardOverlap() {
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      ref.current?.measureInWindow((_x: number, y: number, _width: number, height: number) => {
        setOverlap(Math.max(0, Math.round(y + height - e.endCoordinates.screenY)));
      });
    });
    const hide = Keyboard.addListener(hideEvent, () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return { ref, overlap };
}
