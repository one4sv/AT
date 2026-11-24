export function numberInputValue(input: Pick<HTMLInputElement,"value" | "valueAsNumber">): number | "" {
    return input.value === "" || !Number.isFinite(input.valueAsNumber) ? "" : input.valueAsNumber;
}
