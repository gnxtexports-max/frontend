import { Clock, CheckCircle2, Circle } from "lucide-react";
import { SectionTitle } from "./VehicleTrackingUIComponents";

export function TimelineSection({ data }) {
  return (
    <div>
      <SectionTitle icon={<Clock className="w-4 h-4" />} title="Timeline of Movement" />

      <div className="mt-3 bg-white border border-border rounded-xl p-6">
        <div className="space-y-0">
          {data.timeline.map((step, idx) => {
            const isLast = idx === data.timeline.length - 1;
            return (
              <div key={idx} className="flex gap-4">
                {/* Dot + connector line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      step.completed
                        ? step.active
                          ? "bg-[#1d4ed8] border-[#1d4ed8] shadow-md shadow-blue-200"
                          : "bg-emerald-500 border-emerald-500"
                        : "bg-white border-border"
                    }`}
                  >
                    {step.completed ? (
                      step.active ? (
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground/40" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 h-12 ${
                        step.completed && data.timeline[idx + 1]?.completed
                          ? "bg-emerald-300"
                          : step.completed
                          ? "bg-gradient-to-b from-emerald-300 to-border"
                          : "bg-border"
                      }`}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm ${
                      step.completed
                        ? step.active
                          ? "text-[#1d4ed8]"
                          : "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.step}
                    {step.active && (
                      <span className="ml-2 inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.timestamp}</p>
                  {step.detail && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimelineSection;
