// packages/ui/src/utils/expected.ts
export function pickPlacementCompletedAny(obj: any) {
  const fromFullArray =
    obj?.placement_extended_full?.[1] ??
    obj?.placement_full?.[1] ??
    obj?.go_home_extended_full?.[1] ??
    obj?.go_home_full?.[1] ??
    null;

  return (
    obj?.expectedPlacementCompletedDate ??
    obj?.expectedPlacementCompleted ??
    obj?.expectedPlacementCompleteDate ??
    obj?.expectedPlacementCompletionDate ??
    obj?.expectedPlacementEndDate ??
    obj?.expectedPlacementDate ??
    obj?.placement_completed_expected ??
    obj?.dates?.placementCompletedAt ??
    obj?.plan?.expectedPlacementCompleted ?? 
    fromFullArray
  );
}
