"use client";

import { List, Map as MapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Block } from "@/components/map/block";
import { BoxDetail } from "@/components/box/box-detail";
import type { BoxDetailData } from "@/components/box/types";
import { Legend } from "@/components/map/legend";
import { MapFilters } from "@/components/map/map-filters";
import type {
  BoxCategory,
  BoxSide,
  BoxStatus,
  VenueBox,
} from "@/components/map/types";

type VenueMapProps = {
  boxes: VenueBox[];
  detail: BoxDetailData | null;
};

type ViewMode = "map" | "list";

function normalize(value: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function boxMatchesSearch(box: VenueBox, search: string) {
  const needle = normalize(search);
  if (!needle) {
    return true;
  }

  return [
    box.numero,
    box.comprador_nombre_completo,
    box.comprador_documento,
  ].some((value) => normalize(value).includes(needle));
}

function getNeighbor(
  boxes: VenueBox[],
  box: VenueBox,
  direction: "up" | "down" | "left" | "right",
) {
  const sameBlock = (candidate: VenueBox) =>
    candidate.lado === box.lado && candidate.nivel === box.nivel;
  const target = boxes.find((candidate) => {
    if (!sameBlock(candidate)) {
      return false;
    }

    if (direction === "left") {
      return (
        candidate.fila === box.fila &&
        candidate.columna === (box.columna ?? 0) - 1
      );
    }
    if (direction === "right") {
      return (
        candidate.fila === box.fila &&
        candidate.columna === (box.columna ?? 0) + 1
      );
    }
    if (direction === "up") {
      return (
        candidate.columna === box.columna &&
        candidate.fila === (box.fila ?? 0) - 1
      );
    }
    return (
      candidate.columna === box.columna &&
      candidate.fila === (box.fila ?? 0) + 1
    );
  });

  return target ?? null;
}

export function VenueMap({ boxes, detail }: VenueMapProps) {
  const router = useRouter();
  const [status, setStatus] = useState<BoxStatus | "todos">("todos");
  const [category, setCategory] = useState<BoxCategory | "todos">("todos");
  const [search, setSearch] = useState("");
  const [mobileSide, setMobileSide] = useState<BoxSide>("izquierdo");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [focusedNumber, setFocusedNumber] = useState<number | null>(
    boxes[0]?.numero ?? null,
  );

  const filteredBoxes = useMemo(
    () =>
      boxes.filter((box) => {
        const statusMatches = status === "todos" || box.estado === status;
        const categoryMatches =
          category === "todos" || box.categoria_id === category;
        return statusMatches && categoryMatches;
      }),
    [boxes, category, status],
  );

  const matchingNumbers = useMemo(
    () =>
      new Set(
        filteredBoxes
          .filter((box) => boxMatchesSearch(box, search))
          .map((box) => box.numero ?? -1),
      ),
    [filteredBoxes, search],
  );

  const dimmedNumbers = useMemo(
    () =>
      new Set(
        filteredBoxes
          .filter((box) => !matchingNumbers.has(box.numero ?? -1))
          .map((box) => box.numero ?? -1),
      ),
    [filteredBoxes, matchingNumbers],
  );

  const visibleBoxes = useMemo(
    () => filteredBoxes.filter((box) => matchingNumbers.has(box.numero ?? -1)),
    [filteredBoxes, matchingNumbers],
  );
  const rovingNumber = visibleBoxes.some((box) => box.numero === focusedNumber)
    ? focusedNumber
    : (visibleBoxes[0]?.numero ?? null);

  const counts = useMemo(
    () => ({
      disponible: boxes.filter((box) => box.estado === "disponible").length,
      separado: boxes.filter((box) => box.estado === "separado").length,
      pagado: boxes.filter((box) => box.estado === "pagado").length,
    }),
    [boxes],
  );

  function openBox(box: VenueBox) {
    if (box.numero === null) {
      return;
    }
    router.push(`/?palco=${box.numero}`, { scroll: false });
  }

  function handleBoxKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    box: VenueBox,
  ) {
    if (
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();
    const direction = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    } as const;
    const neighbor = getNeighbor(
      filteredBoxes,
      box,
      direction[event.key as keyof typeof direction],
    );
    if (neighbor?.numero !== null && neighbor?.numero !== undefined) {
      setFocusedNumber(neighbor.numero);
      document.getElementById(`palco-${neighbor.numero}`)?.focus();
    }
  }

  function getBlock(side: BoxSide, level: number) {
    return filteredBoxes.filter(
      (box) => box.lado === side && box.nivel === level,
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              Mapa del evento
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              Palcos
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="font-bold text-slate-950">{counts.disponible}</p>
              <p className="text-xs text-slate-600">Disponibles</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="font-bold text-slate-950">{counts.separado}</p>
              <p className="text-xs text-slate-600">Separados</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="font-bold text-slate-950">{counts.pagado}</p>
              <p className="text-xs text-slate-600">Pagados</p>
            </div>
          </div>
        </div>

        <MapFilters
          status={status}
          category={category}
          search={search}
          onStatusChange={setStatus}
          onCategoryChange={setCategory}
          onSearchChange={setSearch}
        />

        <Legend />

        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div className="grid grid-cols-2 rounded-lg border border-slate-300 bg-white p-1">
            {(["izquierdo", "derecho"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setMobileSide(side)}
                className={`min-h-11 rounded-md px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none ${
                  mobileSide === side
                    ? "bg-blue-700 text-white"
                    : "text-slate-700"
                }`}
                aria-pressed={mobileSide === side}
              >
                {side === "izquierdo" ? "Izquierda" : "Derecha"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setViewMode((mode) => (mode === "map" ? "list" : "map"))
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
          >
            {viewMode === "map" ? (
              <List aria-hidden="true" size={18} />
            ) : (
              <MapIcon aria-hidden="true" size={18} />
            )}
            {viewMode === "map" ? "Ver como lista" : "Ver como mapa"}
          </button>
        </div>

        {viewMode === "list" ? (
          <div className="space-y-2 lg:hidden">
            {visibleBoxes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">
                No hay palcos que coincidan con los filtros.
              </p>
            ) : (
              visibleBoxes
                .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
                .map((box) => (
                  <button
                    key={box.numero}
                    type="button"
                    onClick={() => openBox(box)}
                    className="flex min-h-12 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 text-left text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                  >
                    <span className="font-bold text-slate-950">
                      Palco {box.numero}
                    </span>
                    <span className="text-slate-600">
                      {box.estado ?? "disponible"} · {box.porcentaje ?? 0}%
                    </span>
                  </button>
                ))
            )}
          </div>
        ) : (
          <div
            className="overflow-auto rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-sm sm:p-5"
            style={{ touchAction: "pan-x pan-y pinch-zoom" }}
          >
            <div className="mx-auto min-w-[690px] max-w-6xl">
              <div className="mx-auto mb-4 flex h-12 max-w-xs items-center justify-center rounded-xl bg-slate-800 text-sm font-bold uppercase tracking-[0.3em] text-white">
                Tarima
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] items-stretch gap-2">
                <div className="space-y-3">
                  {[1, 2, 3].map((level) => (
                    <Block
                      key={`izquierdo-${level}`}
                      label={`Izquierda · Nivel ${level}`}
                      boxes={getBlock("izquierdo", level)}
                      focusedNumber={rovingNumber}
                      dimmedNumbers={dimmedNumbers}
                      onBoxClick={openBox}
                      onBoxKeyDown={handleBoxKeyDown}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-400 bg-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500 [writing-mode:vertical-rl]">
                  Pasarela
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((level) => (
                    <Block
                      key={`derecho-${level}`}
                      label={`Derecha · Nivel ${level}`}
                      boxes={getBlock("derecho", level)}
                      focusedNumber={rovingNumber}
                      dimmedNumbers={dimmedNumbers}
                      onBoxClick={openBox}
                      onBoxKeyDown={handleBoxKeyDown}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-600">
          Mostrando {visibleBoxes.length} de {boxes.length} palcos. Selecciona
          un palco para abrir su detalle.
        </p>
      </div>
      {detail ? <BoxDetail detail={detail} /> : null}
    </>
  );
}
