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
  rangeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  rangeToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  rangeToggleActive: {
    backgroundColor: "#E0ECFF",
    borderColor: "#2563EB",
  },
  rangeToggleText: {
    fontWeight: "600",
    color: "#111827",
  },
  rangeToggleTextActive: {
    color: "#1D4ED8",
  },
  rangeInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  rangeInfoText: {
    color: "#4B5563",
    fontSize: 13,
  },
  rangeClear: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    position: a
  },
  rangeClearText: {
    color: "#6B7280",
    fontWeight: "600",
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
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center"
  },
  navText: {
    fontSize: 16,
    borderWidth: 2,
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
  dayCellRange: {
    borderColor: "#93C5FD",
    backgroundColor: "#E0F2FE",
  },
  dayCellRangeEdge: {
    borderColor: "#1D4ED8",
    backgroundColor: "#DBEAFE",
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
  modalScrollContent: {
    paddingBottom: 10,
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
    flexWrap: "wrap",
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
  applyRangeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#111827",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  cancelText: {
    color: "#111827",
  },
  intervalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  intervalCarousel: {
    marginTop: 6,
    marginBottom: 10,
  },
  intervalCarouselContent: {
    paddingRight: 12,
    gap: 12,
  },
  intervalCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  intervalTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  intervalEmpty: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  intervalEmptyText: {
    color: "#6B7280",
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
    backgroundColor: "#10B981",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addIntervalText: {
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
  carouselControls: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  carouselButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#2563EB",
    borderRadius: 8,
  },
  carouselButtonDisabled: {
    backgroundColor: "#BFDBFE",
  },
  carouselButtonText: {
    color: "white",
    fontWeight: "700",
  },
  carouselIndicator: {
    fontWeight: "600",
    color: "#111827",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
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
  rangeApplyInfo: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
  },
  rangeApplyText: {
    color: "#4338CA",
    fontWeight: "600",
  },
});
