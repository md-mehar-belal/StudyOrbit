import { useMemo, useState } from "react";

import { useTasks } from "../../context/TaskContext";

import SummaryCards from "./SummaryCards";
import DailySummary from "./DailySummary";

function Summary() {
  const { tasks } = useTasks();

  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());

  const [month, setMonth] = useState(today.getMonth());

  // =========================
  // MONTH TASKS
  // =========================

  const monthTasks = useMemo(() => {
    return tasks.filter((task) => {
      const date = new Date(task.createdAt);

      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [tasks, year, month]);

  // =========================
  // SUMMARY
  // =========================

  const summary = useMemo(() => {
    const total = monthTasks.length;

    const completed = monthTasks.filter((task) => task.completed).length;

    const pending = total - completed;

    return {
      total,
      pending,
      completed,
    };
  }, [monthTasks]);

  // =========================
  // MONTH NAME
  // =========================

  const monthName = new Date(year, month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // =========================
  // PREVIOUS MONTH
  // =========================

  const previousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else {
      setMonth((value) => value - 1);
    }
  };

  // =========================
  // NEXT MONTH
  // =========================

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else {
      setMonth((value) => value + 1);
    }
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Task Summary</h1>

          <p>Track your productivity and monthly progress.</p>
        </div>
      </div>

      {/* MONTH SELECTOR */}

      <div className="month-picker">
        <button onClick={previousMonth}>←</button>

        <strong>{monthName}</strong>

        <button onClick={nextMonth}>→</button>
      </div>

      {/* THREE CARDS */}

      <SummaryCards summary={summary} />

      <h2 className="section-title">Daily Summary</h2>

      {monthTasks.length === 0 ? (
        <div className="empty-state">No tasks found for {monthName}</div>
      ) : (
        <DailySummary tasks={monthTasks} />
      )}
    </section>
  );
}

export default Summary;
