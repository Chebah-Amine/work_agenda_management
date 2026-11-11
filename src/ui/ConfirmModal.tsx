import Ionicons from "@expo/vector-icons/Ionicons";
import { ReactNode, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, font, radius } from "./theme";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Action irréversible : bouton rouge, et case à cocher obligatoire avant de confirmer. */
  destructive?: boolean;
  /** Contenu libre placé sous le message (choix supplémentaires…). */
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Fenêtre de confirmation (Alert.alert n'existe pas sur le web et n'a pas de garde-fou). */
export function ConfirmModal({ visible, onCancel, ...props }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.overlay}>
        {/* Monté à chaque ouverture : la case repart décochée. */}
        {visible && <ConfirmContent onCancel={onCancel} {...props} />}
      </View>
    </Modal>
  );
}

function ConfirmContent({
  title,
  message,
  confirmLabel,
  destructive,
  children,
  onConfirm,
  onCancel,
}: Omit<Props, "visible">) {
  const [understood, setUnderstood] = useState(false);

  return (
    <View style={s.box}>
      <Text style={s.title}>{title}</Text>
      <Text style={s.message}>{message}</Text>
      {children}

      {destructive && (
        <Pressable
          style={s.check}
          onPress={() => setUnderstood(!understood)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood }}
        >
          <Ionicons
            name={understood ? "checkbox" : "square-outline"}
            size={30}
            color={understood ? colors.danger : colors.textMuted}
          />
          <Text style={s.checkText}>J’ai compris que c’est définitif.</Text>
        </Pressable>
      )}

      <View style={s.actions}>
        <Button label="Annuler" variant="secondary" onPress={onCancel} style={s.flex} />
        <Button
          label={confirmLabel}
          variant={destructive ? "danger" : "primary"}
          onPress={onConfirm}
          disabled={destructive && !understood}
          style={s.flex}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(23, 32, 51, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  box: {
    width: "100%",
    maxWidth: 460,
    padding: 20,
    gap: 14,
    borderRadius: radius.large,
    backgroundColor: colors.surface,
  },
  title: { fontSize: font.large, fontWeight: "800", color: colors.text },
  message: { fontSize: font.body, color: colors.text, lineHeight: 24 },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.dangerLight,
  },
  checkText: { flex: 1, fontSize: font.body, fontWeight: "600", color: colors.danger },
  actions: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
});
