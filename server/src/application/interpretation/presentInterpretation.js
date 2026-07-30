export function presentInterpretation(interpretation) {
  return {
    ...interpretation,
    annotations: interpretation.annotations.map(({ start, end, kind, referenceId }) => ({ start, end, kind, referenceId })),
    references: structuredClone(interpretation.references),
  };
}
