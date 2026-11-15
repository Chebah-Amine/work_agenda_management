import { ReactNode } from "react";
import { useWindowDimensions } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

/** Distance (points) ou vitesse (points/s) à dépasser pour changer de mois. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;

type Props = {
  /** +1 : mois suivant, -1 : mois précédent. */
  onShift: (offset: number) => void;
  children: ReactNode;
};

/**
 * Glisser vers la gauche → mois suivant, vers la droite → mois précédent.
 * Le geste ne démarre qu'au-delà de 20 points à l'horizontale : un simple toucher
 * sur un jour reste un toucher, et un glissement vertical fait défiler l'écran.
 */
export function MonthSwipe({ onShift, children }: Props) {
  const { width } = useWindowDimensions();
  const offset = useSharedValue(0);

  const pan = usePanGesture({
    activeOffsetX: [-20, 20],
    failOffsetY: [-15, 15],
    // Callbacks sur le thread JS : ils changent le mois affiché (état React).
    runOnJS: true,
    onUpdate: (e) => {
      offset.value = e.translationX * 0.6;
    },
    onDeactivate: (e) => {
      const next = e.translationX < -SWIPE_DISTANCE || e.velocityX < -SWIPE_VELOCITY;
      const previous = e.translationX > SWIPE_DISTANCE || e.velocityX > SWIPE_VELOCITY;
      if (e.canceled || (!next && !previous)) {
        offset.value = withSpring(0);
        return;
      }
      const direction = next ? 1 : -1;
      onShift(direction);
      // Le nouveau mois arrive du côté vers lequel on a glissé.
      offset.value = direction * width * 0.35;
      offset.value = withTiming(0, { duration: 220 });
    },
  });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
    opacity: 1 - Math.min(Math.abs(offset.value) / (width * 0.6), 0.6),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>{children}</Animated.View>
    </GestureDetector>
  );
}
