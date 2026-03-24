// src/components/charts/FuelChart.jsx
import React, { useRef, useState, useEffect } from "react";
import { formatNumber, formatInteger } from "../../utils/helpers";

export default function FuelChart({
  data,
  barKey = "liters",
  barName = "ປະລິມານນ້ຳມັນ",
  barUnit = "ລິດ",
  formatBar = formatNumber,
  barColor = "#fdba74",
  barColorHover = "#f97316",
  barTextColor = "#9a3412",
  lineKey = "consumption",
  lineName = "ອັດຕາສິ້ນເປືອງ",
  lineUnit = "ກມ/ລິດ",
  formatLine = formatNumber,
  lineColor = "#3b82f6",
  lineTextColor = "#1e3a8a",
}) {
  const containerRef = useRef(null);
  const [viewBoxWidth, setViewBoxWidth] = useState(800);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setViewBoxWidth(Math.max(containerRef.current.clientWidth, 300));
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (tooltip) setTooltip(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [tooltip]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 md:py-16 text-xs md:text-sm text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200">
        ບໍ່ມີຂໍ້ມູນການເຕີມນ້ຳມັນສຳລັບສ້າງກາຟ
      </div>
    );
  }

  const maxBarVal = Math.max(...data.map((d) => d[barKey] || 0), 10) * 1.25;
  const maxLineVal = Math.max(...data.map((d) => d[lineKey] || 0), 5) * 1.25;

  const viewBoxHeight = 300;
  const isMobile = viewBoxWidth < 500;
  const bottomPad = data.length > 12 ? 60 : 40;
  const padding = {
    top: 50,
    right: isMobile ? 65 : 85,
    bottom: bottomPad,
    left: isMobile ? 45 : 60,
  };

  const width = viewBoxWidth - padding.left - padding.right;
  const height = viewBoxHeight - padding.top - padding.bottom;
  const barWidth = Math.min(48, (width / data.length) * (isMobile ? 0.6 : 0.5));
  const showValues = data.length <= 15;

  const points = data.map((d, i) => {
    const x = padding.left + (i + 0.5) * (width / data.length);
    const yBar = padding.top + height - ((d[barKey] || 0) / maxBarVal) * height;
    const yLine =
      padding.top + height - ((d[lineKey] || 0) / maxLineVal) * height;

    let litY = yBar - 10;
    let consY = yLine - 15;

    if (Math.abs(litY - consY) < 25) {
      if (yLine < yBar) {
        consY = yLine - 18;
        litY = yBar + 15;
      } else {
        litY = yBar - 18;
        consY = yLine + 18;
      }
    }

    return { ...d, x, yBar, yLine, litY, consY };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.yLine}`).join(" ");

  return (
    <div className="w-full relative" ref={containerRef}>
      {tooltip &&
        (() => {
          const leftPercent = (tooltip.x / viewBoxWidth) * 100;
          let translateX = "-50%";
          let arrowLeft = "50%";
          if (leftPercent < 25) {
            translateX = "-20%";
            arrowLeft = "20%";
          } else if (leftPercent > 75) {
            translateX = "-80%";
            arrowLeft = "80%";
          }

          return (
            <div
              className="absolute z-50 bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl text-xs sm:text-sm transform pointer-events-none w-max min-w-[200px] max-w-[260px] border border-gray-600/50 flex flex-col"
              style={{
                left: `${leftPercent}%`,
                top: `${(tooltip.y / viewBoxHeight) * 100}%`,
                marginTop: "-15px",
                transform: `translate(${translateX}, -100%)`,
              }}
            >
              <div
                className="absolute w-3 h-3 bg-gray-800 border-b border-r border-gray-600/50 transform rotate-45 -bottom-1.5"
                style={{ left: arrowLeft, marginLeft: "-6px" }}
              ></div>
              <p className="font-bold border-b border-gray-600/50 pb-1.5 mb-1.5 text-center text-orange-400 w-full">
                {tooltip.label}
              </p>
              {tooltip.carDetailsArray && tooltip.carDetailsArray.length > 0 ? (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 w-full">
                  {tooltip.carDetailsArray.map((car, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-white/10 p-1.5 rounded-lg gap-3"
                    >
                      <span className="font-bold text-gray-100 truncate flex-1">
                        {car.plate}
                      </span>
                      <div className="text-right flex flex-col shrink-0">
                        <span className="text-orange-400 font-bold">
                          {formatInteger(car.actualPaid)} ₭
                        </span>
                        <span className="text-gray-300 text-[10px]">
                          {formatNumber(car.liters)} L
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-2">
                  ບໍ່ມີຂໍ້ມູນລົດແຍກຍ່ອຍ
                </p>
              )}
            </div>
          );
        })()}

      <div className="w-full bg-white">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto font-lao overflow-visible"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + height * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize={isMobile ? "10" : "12"}
                  fontWeight="bold"
                >
                  {formatBar(maxBarVal * ratio)}
                </text>
                <text
                  x={viewBoxWidth - padding.right + 8}
                  y={y + 4}
                  textAnchor="start"
                  fill="#6b7280"
                  fontSize={isMobile ? "10" : "12"}
                  fontWeight="bold"
                >
                  {formatLine(maxLineVal * ratio)}
                </text>
              </g>
            );
          })}

          <text
            x={padding.left - 8}
            y={padding.top - 15}
            textAnchor="end"
            fill={barTextColor}
            fontSize={isMobile ? "10" : "12"}
            fontWeight="900"
          >
            {barUnit}
          </text>
          <text
            x={viewBoxWidth - padding.right + 8}
            y={padding.top - 15}
            textAnchor="start"
            fill={lineTextColor}
            fontSize={isMobile ? "10" : "12"}
            fontWeight="900"
          >
            {lineUnit}
          </text>

          {points.map((p, i) => {
            const barHeight = padding.top + height - p.yBar;
            const isMany = data.length > 12;
            const labelY = viewBoxHeight - padding.bottom + (isMany ? 25 : 20);
            const isHovered = tooltip && tooltip.key === p.key;

            return (
              <g
                key={`bar-${i}`}
                onMouseEnter={() => setTooltip({ ...p, y: p.yBar })}
                onMouseLeave={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltip(
                    tooltip && tooltip.key === p.key
                      ? null
                      : { ...p, y: p.yBar },
                  );
                }}
                className="cursor-pointer"
              >
                <rect
                  x={p.x - barWidth}
                  y={padding.top}
                  width={barWidth * 2}
                  height={height}
                  fill="transparent"
                />
                <rect
                  x={p.x - barWidth / 2}
                  y={p.yBar}
                  width={barWidth}
                  height={Math.max(0, barHeight)}
                  fill={isHovered ? barColorHover : barColor}
                  rx="4"
                  className="transition-colors duration-200"
                />
                <text
                  x={p.x}
                  y={labelY}
                  textAnchor={isMany ? "end" : "middle"}
                  fill="#1f2937"
                  fontSize={isMobile ? "9" : "11"}
                  fontWeight="bold"
                  transform={isMany ? `rotate(-45, ${p.x}, ${labelY})` : ""}
                >
                  {p.label}
                </text>

                {showValues && p[barKey] > 0 && (
                  <>
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinejoin="round"
                      fontSize={isMobile ? "10" : "11"}
                      fontWeight="900"
                    >
                      {formatBar(p[barKey])}
                    </text>
                    <text
                      x={p.x}
                      y={p.litY}
                      textAnchor="middle"
                      fill={barTextColor}
                      fontSize={isMobile ? "10" : "11"}
                      fontWeight="900"
                    >
                      {formatBar(p[barKey])}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          <polyline
            points={polylinePoints}
            fill="none"
            stroke={lineColor}
            strokeWidth={isMobile ? "2" : "3"}
            pointerEvents="none"
          />

          {points.map((p, i) => (
            <g key={`point-${i}`} pointerEvents="none">
              <circle
                cx={p.x}
                cy={p.yLine}
                r={isMobile ? "3" : "4"}
                fill="#ffffff"
                stroke={lineColor}
                strokeWidth="2"
              />
              {showValues && p[lineKey] > 0 && (
                <>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    fontSize={isMobile ? "10" : "11"}
                    fontWeight="900"
                  >
                    {formatLine(p[lineKey])}
                  </text>
                  <text
                    x={p.x}
                    y={p.consY}
                    textAnchor="middle"
                    fill={lineTextColor}
                    fontSize={isMobile ? "10" : "11"}
                    fontWeight="900"
                  >
                    {formatLine(p[lineKey])}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 md:mt-6 text-xs md:text-sm text-gray-600 font-bold font-lao">
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div
              className="w-3 h-3 md:w-4 md:h-4 rounded"
              style={{ backgroundColor: barColor }}
            ></div>
            <span>
              {barName} ({barUnit})
            </span>
          </div>
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <div
              className="w-3 h-1 md:w-4 md:h-1 rounded"
              style={{ backgroundColor: lineColor }}
            ></div>
            <div
              className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white border-2 rounded-full -ml-2.5 md:-ml-3"
              style={{ borderColor: lineColor }}
            ></div>
            <span>
              {lineName} ({lineUnit})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
