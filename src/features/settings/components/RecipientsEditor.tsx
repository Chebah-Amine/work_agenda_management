import { isValidEmail, MAX_RECIPIENTS } from "@/domain/models/workSettings";
import { Button } from "@/ui/Button";
import { colors, font, radius } from "@/ui/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  /** « À » ou « Cc » : sert aux libellés d'accessibilité. */
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
};

/** Liste d'adresses e-mail : chacune se retire d'un appui, une nouvelle s'ajoute dessous. */
export function RecipientsEditor({ label, emails, onChange }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const full = emails.length >= MAX_RECIPIENTS;

  function add() {
    const email = text.trim().toLowerCase();
    if (!email) return;
    if (!isValidEmail(email)) {
      setError("Cette adresse ne semble pas valide (exemple : rh@entreprise.fr).");
      return;
    }
    if (emails.includes(email)) {
      setError("Cette adresse est déjà dans la liste.");
      return;
    }
    onChange([...emails, email]);
    setText("");
    setError(null);
  }

  return (
    <View style={s.container}>
      {emails.length === 0 ? (
        <Text style={s.empty}>Aucune adresse.</Text>
      ) : (
        <View style={s.chips}>
          {emails.map((email) => (
            <View key={email} style={s.chip}>
              <Text style={s.chipText} numberOfLines={1}>
                {email}
              </Text>
              <Pressable
                onPress={() => onChange(emails.filter((e) => e !== email))}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Retirer ${email} de la liste ${label}`}
              >
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {full ? (
        <Text style={s.empty}>Maximum {MAX_RECIPIENTS} adresses.</Text>
      ) : (
        <View style={s.addRow}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={(value) => {
              setText(value);
              setError(null);
            }}
            onSubmitEditing={add}
            placeholder="adresse@exemple.fr"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            returnKeyType="done"
            accessibilityLabel={`Nouvelle adresse ${label}`}
          />
          <Button label="Ajouter" icon="add" variant="secondary" onPress={add} disabled={!text.trim()} />
        </View>
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      {text.trim() && !error ? (
        <Text style={s.pending}>Touchez « Ajouter » pour garder cette adresse.</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { gap: 8 },
  empty: { fontSize: font.small, color: colors.textMuted },
  chips: { gap: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    borderRadius: radius.medium,
    backgroundColor: colors.primaryLight,
  },
  chipText: { flex: 1, fontSize: font.body, fontWeight: "600", color: colors.text },
  addRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: radius.medium,
    paddingHorizontal: 14,
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  error: { fontSize: font.small, fontWeight: "600", color: colors.danger },
  pending: { fontSize: font.small, color: colors.textMuted },
});
