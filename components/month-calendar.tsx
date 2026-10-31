import { Sun } from "@/components/ui";

export const monthPrices = [1000, 950, 900, 850, 800];
export function MonthSheet({ month }: { month: number }) {
  return (
    <>
      <div className="gm-calendar-top">
        <span>Goodmonth club</span>
        <span>Monthly</span>
      </div>
      <div className="gm-calendar-number">
        <span>0{month}</span>
        <Sun size={72} />
      </div>
      <div className="gm-calendar-caption">
        <span>
          {month === 1
            ? "A good beginning."
            : month === 5
              ? "Staying looks good on you."
              : "Another month. A little less."}
        </span>
        <span>Month {month}</span>
      </div>
      <div className="gm-calendar-bill">
        <span>
          Your month, before tax
          <strong>₹{monthPrices[month - 1].toLocaleString("en-IN")}</strong>
        </span>
        <span className="gm-calendar-discount">
          {(month - 1) * 5}%<small>loyalty saving</small>
        </span>
      </div>
      <div className="gm-stamps">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n < month ? "is-earned" : ""}>
            {n < month ? "✳" : "·"}
          </span>
        ))}
        <span className="gm-stamp-label">
          Good things
          <br />
          take a little time.
        </span>
      </div>
    </>
  );
}
