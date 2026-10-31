"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MonthSheet, monthPrices } from "./month-calendar";

export function LoyaltyCalendar() {
  const root = useRef<HTMLElement>(null);
  const selectMonth = useRef<(month: number) => void>(() => {});
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [turning, setTurning] = useState(false);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add(
      {
        desktop: "(min-width: 900px) and (min-height: 740px)",
        compact: "(max-width: 899px), (max-height: 739px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { desktop, reduce } = context.conditions!;
        const sheets =
          root.current!.querySelectorAll<HTMLElement>(".gm-turn-sheet");
        const driver = { progress: 0 };
        let previous = "";
        const render = () => {
          const fraction = driver.progress % 1;
          const inTurn = !reduce && fraction > 0.001 && fraction < 0.5;
          const index = Math.min(
            4,
            inTurn ? Math.ceil(driver.progress) : Math.round(driver.progress),
          );
          const stateKey = `${index}:${inTurn}`;
          if (stateKey !== previous) {
            setActive(index);
            setTurning(inTurn);
            previous = stateKey;
          }
          sheets.forEach((sheet, i) => {
            const turn = Math.max(0, Math.min(1, driver.progress - i));
            gsap.set(sheet, {
              rotationX: reduce ? 0 : -180 * turn,
              y: reduce ? 0 : -25 * turn,
              opacity: reduce ? (i === index ? 1 : 0) : 1,
              visibility: (reduce ? i !== index : turn >= 0.5)
                ? "hidden"
                : "visible",
            });
          });
        };
        render();
        let trigger: ScrollTrigger | undefined;
        if (desktop && !reduce) {
          trigger = ScrollTrigger.create({
            trigger: root.current,
            start: "top top",
            end: "+=1100",
            pin: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              gsap.killTweensOf(driver);
              driver.progress = self.progress * 4;
              render();
            },
          });
        }
        selectMonth.current = (month) => {
          if (trigger) {
            trigger.scroll(
              trigger.start + ((trigger.end - trigger.start) * month) / 4,
            );
            trigger.update();
          } else if (reduce) {
            driver.progress = month;
            render();
          } else
            gsap.to(driver, {
              progress: month,
              duration: 0.65,
              ease: "power3.out",
              overwrite: true,
              onUpdate: render,
            });
        };
        setReady(true);
        return () => {
          gsap.killTweensOf(driver);
          selectMonth.current = () => {};
        };
      },
      root,
    );
    return () => media.revert();
  }, []);

  return (
    <section
      id="loyalty"
      className="gm-loyalty"
      ref={root}
      aria-labelledby="loyalty-heading"
    >
      <div className="gm-wrap gm-loyalty-grid">
        <div className="gm-loyalty-copy">
          <span className="gm-label">The Goodmonth club</span>
          <h2 id="loyalty-heading">
            Same good plan.
            <br />
            <em>A little less.</em>
          </h2>
          <p>
            Every eligible on-time renewal earns a little more off your next
            month. A thank-you for making us part of your routine.
          </p>
          <div
            className="gm-month-controls"
            aria-label="Choose an illustrative month"
            hidden={!ready}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={active === n}
                aria-label={`Month ${n + 1}: ₹${monthPrices[n]} before tax`}
                onClick={() => selectMonth.current(n)}
              >
                <span>0{n + 1}</span>
              </button>
            ))}
          </div>
          <p className="gm-current-month">
            {turning ? "Turning to month" : "Month"} {active + 1}{" "}
            <span>
              ₹{monthPrices[active].toLocaleString("en-IN")} before tax ·{" "}
              {active * 5}% saving
            </span>
          </p>
          <p className="gm-fine">
            Illustrative ₹1,000 monthly plan. Earn 5% per eligible on-time
            renewal, up to 20%. Rewards depend on your plan. Missed payment
            deadlines reset your streak. Annual plans are excluded.
          </p>
          <details className="gm-example-details">
            <summary>See the full five-month example</summary>
            <ol>
              {monthPrices.map((price, i) => (
                <li key={price}>
                  Month {i + 1}: ₹{price.toLocaleString("en-IN")} before tax (
                  {i * 5}% saving)
                </li>
              ))}
            </ol>
          </details>
        </div>
        <div className="gm-calendar-stage" aria-hidden="true">
          <div className="gm-calendar-stack">
            {monthPrices.map((_, i) => (
              <div
                className="gm-calendar gm-turn-sheet"
                key={i}
                style={{ zIndex: 5 - i }}
              >
                <MonthSheet month={i + 1} />
              </div>
            ))}
          </div>
          <p className="gm-calendar-footnote">
            A small ritual. A growing reward.
          </p>
        </div>
      </div>
    </section>
  );
}
