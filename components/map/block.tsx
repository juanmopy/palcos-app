import type { VenueBox } from "@/components/map/types";
import { BoxCell } from "@/components/map/box-cell";

type BlockProps = {
  label: string;
  boxes: VenueBox[];
  focusedNumber: number | null;
  dimmedNumbers: Set<number>;
  onBoxClick: (box: VenueBox) => void;
  onBoxKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    box: VenueBox,
  ) => void;
};

export function Block({
  label,
  boxes,
  focusedNumber,
  dimmedNumbers,
  onBoxClick,
  onBoxKeyDown,
}: BlockProps) {
  const boxesByPosition = new Map(
    boxes.map((box) => [`${box.fila}-${box.columna}`, box]),
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
      <h3 className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}
      </h3>
      <div className="grid grid-cols-10 gap-1">
        {[1, 2].flatMap((fila) =>
          Array.from({ length: 10 }, (_, index) => {
            const columna = index + 1;
            const box = boxesByPosition.get(`${fila}-${columna}`);

            if (!box) {
              return (
                <span
                  key={`${fila}-${columna}`}
                  aria-hidden="true"
                  className="min-h-8 min-w-8 sm:min-h-11 sm:min-w-11"
                />
              );
            }

            return (
              <span
                key={box.numero}
                className={
                  dimmedNumbers.has(box.numero ?? -1) ? "opacity-25" : undefined
                }
              >
                <BoxCell
                  box={box}
                  tabIndex={focusedNumber === box.numero ? 0 : -1}
                  onClick={onBoxClick}
                  onKeyDown={onBoxKeyDown}
                />
              </span>
            );
          }),
        )}
      </div>
    </section>
  );
}
