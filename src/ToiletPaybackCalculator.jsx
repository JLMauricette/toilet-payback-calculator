import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

/**
 * ToiletPaybackCalculator v7 – closes stray <span> & completes markup
 * ------------------------------------------------------------------
 * • Fixes "Unexpected end of file" build error by ensuring all tags are closed.
 * • Keeps min={0} validation, 5 % default inflation, bold product titles.
 */
const ToiletPaybackCalculator = () => {
  /* ---------------- Input state ---------------- */
  const [baselineFlush, setBaselineFlush] = useState(9);
  const [flushesPerDay, setFlushesPerDay] = useState(120);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [weeksPerYear, setWeeksPerYear] = useState(52);
  const [waterCost, setWaterCost] = useState(2.69);
  const [sewerCost, setSewerCost] = useState(2.34);
  const [sewerPercent, setSewerPercent] = useState(90);
  const [inflation, setInflation] = useState(5);
  const [flushPAST, setFlushPAST] = useState(3);
  const [flushAnalogue, setFlushAnalogue] = useState(4);

  /* ---------------- Constants ---------------- */
  const FLUSH_135 = 1.35;
  const CAPEX_135 = 1000;
  const CAPEX_PAST = 600;
  const CAPEX_ANALOGUE = 450;
  const YEARS_SHOWN = 5;

  /* ---------------- Calculations ---------------- */
  const calculations = useMemo(() => {
    const totalFlushes = flushesPerDay * daysPerWeek * weeksPerYear;
    const unitCost = waterCost / 1000 + (sewerCost / 1000) * (sewerPercent / 100);
    const r = inflation / 100;

    const cumulative = (annualSaving) =>
      Array.from({ length: YEARS_SHOWN }, (_, i) => {
        const y = i + 1;
        if (r === 0) return annualSaving * y;
        return annualSaving * ((1 - Math.pow(1 + r, y)) / (1 - (1 + r)));
      });

    const payback = (annualSaving, capex) => {
      if (annualSaving <= 0) return Infinity;
      if (r === 0) return capex / annualSaving;
      let cum = 0;
      let year = 0;
      while (cum < capex && year < 100) {
        cum += annualSaving * Math.pow(1 + r, year);
        year += 1;
      }
      if (cum === capex) return year;
      const prevCum = cum - annualSaving * Math.pow(1 + r, year - 1);
      const remain = capex - prevCum;
      const frac = remain / (annualSaving * Math.pow(1 + r, year - 1));
      return year - 1 + frac;
    };

    const makeOpt = (newFlush, capex, label) => {
      const annualSaving = (baselineFlush - newFlush) * unitCost * totalFlushes;
      return {
        label,
        annualSaving,
        payback: payback(annualSaving, capex),
        cum: cumulative(annualSaving),
      };
    };

    return [
      makeOpt(FLUSH_135, CAPEX_135, "Propelair 135"),
      makeOpt(flushPAST, CAPEX_PAST, "PAST"),
      makeOpt(flushAnalogue, CAPEX_ANALOGUE, "Analogue"),
    ];
  }, [baselineFlush, flushesPerDay, daysPerWeek, weeksPerYear, waterCost, sewerCost, sewerPercent, inflation, flushPAST, flushAnalogue]);

  /* ---------------- Render helpers ---------------- */
  const renderInput = (id, label, val, setter, step = "any") => (
    <div className="flex flex-col gap-1 pb-4 border-b border-orange-500 last:border-b-0">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-300">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={0}
        value={val}
        onChange={(e) => setter(parseFloat(e.target.value))}
        className="rounded-md p-2 text-gray-900"
      />
    </div>
  );

  const fmt = (n, dp = 2) => (isFinite(n) ? n.toFixed(dp) : "—");

  /* ---------------- JSX ---------------- */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col lg:flex-row gap-6"
    >
      {/* Left – Inputs */}
      <div className="bg-gray-900 text-white rounded-2xl p-6 flex-1 lg:max-w-md">
        <h2 className="text-2xl font-bold mb-1">Calculate Savings</h2>
        <p className="text-sm text-gray-400 mb-6">
          Enter your details below and see how much a Propelair toilet could save your organisation.
        </p>
        <div className="flex flex-col gap-4">
          {renderInput("waterCost", "Metered water charge per m³", waterCost, setWaterCost)}
          {renderInput("baseline", "Current flush volume (L)", baselineFlush, setBaselineFlush)}
          {renderInput("flushesPerDay", "Flushes per day", flushesPerDay, setFlushesPerDay, "1")}
          {renderInput("daysPerWeek", "Days per week", daysPerWeek, setDaysPerWeek, "1")}
          {renderInput("weeksPerYear", "Weeks per year", weeksPerYear, setWeeksPerYear, "1")}
          {renderInput("sewerCost", "Sewerage charge per m³", sewerCost, setSewerCost)}
          {renderInput("sewerPercent", "% volume charged for sewerage", sewerPercent, setSewerPercent)}
          {renderInput("inflation", "Price inflation %/yr", inflation, setInflation)}
          {renderInput("flushPAST", "PAST flush volume (L)", flushPAST, setFlushPAST)}
          {renderInput("flushAnalogue", "Analogue flush volume (L)", flushAnalogue, setFlushAnalogue)}
        </div>
      </div>

      {/* Right – Results */}
      <div className="bg-gray-100 rounded-2xl p-6 flex-1">
        <h3 className="text-xl font-semibold text-orange-600 mb-4">Results (per toilet)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 text-left">Option</th>
                <th className="py-2 text-left">Annual £ saving</th>
                <th className="py-2 text-left">Payback (yrs)</th>
                {[1, 2, 3, 4, 5].map((y) => (
                  <th key={y} className="py-2 text-center whitespace-nowrap">Cum £ Yr {y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calculations.map((opt, idx) => (
                <tr key={opt.label} className={`border-b border-gray-200 ${idx === 0 ? "bg-white" : ""}`}>
                  <td className="py-2 font-medium">{opt.label}</td>
                  <td className="py-2">£{fmt(opt.annualSaving)}</td>
                  <td className="py-2">{fmt(opt.payback, 2)}</td>
                  {opt.cum.map((c, i) => (
                    <td key={i} className="py-2 text-center">£{fmt(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Highlight cards */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {calculations.map((opt) => (
            <div key={opt.label} className="bg-white rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
              <span className="text-base font-bold uppercase tracking-wide text-gray-600">
                {opt.label}
              </span>
              <span className="text-3xl font-bold text-orange-600 mt-1">
                £{fmt(opt.annualSaving)}
              </span>
              <span className="text-xs text-gray-500 mt-1">Yearly saving</span>
              <span className="text-lg font-semibold mt-2">
                Payback in {fmt(opt.payback, 2)} yrs
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ToiletPaybackCalculator;
