function TaskStats({ tasks }) {
  const total = tasks.length;

  const completed = tasks.filter(
    (task) => task.completed
  ).length;

  const pending = total - completed;

  return (
    <div className="stats-grid">

      <div className="stat-card">
        <strong>{total}</strong>
        <span>Total</span>
      </div>

      <div className="stat-card pending">
        <strong>{pending}</strong>
        <span>Pending</span>
      </div>

      <div className="stat-card completed">
        <strong>{completed}</strong>
        <span>Completed</span>
      </div>

    </div>
  );
}

export default TaskStats;