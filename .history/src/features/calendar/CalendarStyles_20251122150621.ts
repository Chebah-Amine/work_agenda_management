import { StyleSheet } from "react-native";

export const calendarStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  navButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  navText: {
    fontSize: 16,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    color: "#6B7280",
  },
  grid: {
    flexDirection: "column",
    gap: 6,
  },
  weekRow: {
    flexDirection: "row",
    gap: 6,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  dayCellText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dayCellMuted: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  dayCellWorking: {
    backgroundColor: "#FEF3C7", // jaune pâle : jour travaillé prévu non saisi
  },
  dayCellWorked: {
    backgroundColor: "#BBF7D0", // vert clair : saisi
  },
  dayCellHoliday: {
    backgroundColor: "#FECACA", // rouge clair : férié
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  reasonButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  reasonButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  reasonButtonSelected: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  reasonText: {
    fontSize: 13,
  },
  reasonTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelText: {
    color: "#111827",
  },
  intervalBlock: {
    marginBottom: 12,
  },
  intervalActions: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#F87171",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  intervalActionsText: {
    color: "white",
    fontWeight: "500",
  },
  addIntervalButton: {
    marginTop: 10,
    backgroundColor: "#10B981",
    padding: 12,
    borderRadius: 8,
  },
  addIntervalText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
    statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 16,
    gap: 10,
  },
  statsBox: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#6B7280",
  },

});
